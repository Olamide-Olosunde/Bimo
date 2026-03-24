const crypto = require('crypto');
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { PDFParse } =  require('pdf-parse');
const fs = require("fs");

const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

const dotenv = require('dotenv');
dotenv.config();

const OpenAI = require("openai");
const nova = new OpenAI({
    apiKey: process.env.NOVA_AI_API_KEY,
    baseURL: 'https://api.nova.amazon.com/v1',
});

const admin_uri = process.env.admin_connection_string;
const client = new MongoClient(admin_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    tls: true,
    tlsAllowInvalidCertificates: true
  }
});

const corsOptions = {
    origin: [process.env.DEV_URL, process.env.PROD_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};

const app = express();
app.use(express.json({limit: '10000mb'}));
app.use(cors(corsOptions));

function generateRandomString(){
    const randomString = crypto.randomBytes(20).toString('hex');
    return randomString;
}

// create
app.post("/api/bot", upload.single("file"), async (req, res)=>{
    try{
        // validation
        if( !req.body.doc && !req.file )
        {
            console.log("Invalid request");
            res.sendStatus(400);
            return;
        }
        if( (typeof req.body.doc !== "string") && (req.file.fieldname !== "file") )
        {
            console.log("Invalid file format");
            res.sendStatus(400);
            return;
        }
        async function getDoc(){
            if(typeof req.body.doc === "string")
                return req.body.doc;
            else {
                const parser = new PDFParse({ url: req.file.path });
                return await parser.getText()
                .then(result=> {
                    // console.log(result.text);
                    parser.destroy()
                    return result.text;
                })
                .catch(err=>console.error(err));
            }
        }


        // func
        async function embedText(txt)
        {
            const embeddings = new OpenAIEmbeddings({
                model: 'text-embedding-3-small',
                apiKey: process.env.OPEN_AI_API_KEY,
            });
            const embedding = await embeddings.embedQuery(txt);
            return embedding;
        }
        async function embedDoc(doc)
        {
            const embeddings = new OpenAIEmbeddings({
                model: 'text-embedding-3-small',
                apiKey: process.env.OPEN_AI_API_KEY,
            });
            const embedding = await embeddings.embedDocuments(doc);
            return embedding;
        }


        // RAG
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 512,
            chunkOverlap: 64,
        });
        await getDoc()
        .then(doc=>{
            fs.unlink(req.file.path, (err)=>{
                console.error(err);
            })

            return doc;
        })
        .then(async (doc)=>{
            return await splitter.splitText(doc)
            .then(result=>{
                // console.log("done chunking");
                return result;
            })
        })
        .then(async (chunks)=>{
            // embed
            if(chunks.length < 7)
            {
                const embeddings = [];
                for(let i = 0; i < chunks.length; i++ )
                {
                    const batchEmbeddings = await embedText(chunks[i]);
                    embeddings.push(batchEmbeddings);
                }
                // console.log("done embedding");
                return {chunks, embeddings};
            }
            else {
                const embeddings = await embedDoc(chunks);
                // console.log(`done embedding`);
                return {chunks, embeddings};
            }
        })
        .then(async (chunksAndEmbeddings)=>{
            // name -- attach que & first two chunks if there's up to two chunks available
            const chunks = chunksAndEmbeddings.chunks;
            const embeddings = chunksAndEmbeddings.embeddings;
            const prompt = "Generate 1 human name according to this\n\n" + chunks[0] + ((chunks.length > 1) ? chunks[1] : "");
            return await nova.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant. Only give a one-word answer. No punctuation marks."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "nova-2-lite-v1",
            })
            .then((ans)=>{
                // get name and return
                const name = ans.choices[0].message.content;
                // console.log(`done generating name\n${embeddings}`);
                return {name, chunks, embeddings};
            })
        })// lowkey, might need to add a description... we'll see
        .then(async (response)=>{
            // mongo db
            gen_id = generateRandomString();
            await client.connect();

            const collection = client.db("users").collection('bots_for_mvp');
            await collection.insertOne({
                bot_id: gen_id,
                bot_name: response.name,
                chunks: response.chunks,
                embeddings: response.embeddings,
                chat: []
            });

            const id = gen_id;
            const name = response.name;
            // console.log("done generating name");
            return {id, name};
        })
        .then((toSend)=>{
            // send
            // console.log("officially done");
            res.send(toSend); //to be stored in localStorage for mvp
        })
        .catch(err=>console.error(err));


    } catch (err){
        console.error(err);
        res.sendStatus(500);
    } finally{
        await client.close();
    }
})

// read
app.get("/api/bot/:id", async (req, res)=>{
    try{
        // validation
        if( !req.params.id )
        {
            console.log("No id in parameters");
            res.sendStatus(400);
            return;
        }
        if( typeof req.params.id !== 'string' )
        {
            console.log("Id has to be string");
            res.sendStatus(400);
            return;
        }


        // mongo db
        await client.connect();

        const collection = client.db("users").collection("bots_for_mvp");
        const bot = await collection.findOne({ bot_id: req.params.id });


        // send
        if( !bot ){
            console.log("Not found");
            res.sendStatus(404);
            return;
        }
        else
            res.send(bot);

    } catch (err){
        console.error(err);
        res.sendStatus(500);
    } finally{
        await client.close();
    }
})

// read all
app.get("/api/bot", async (req, res)=>{
    try{
        // mongo db
        await client.connect();
        const collection = client.db("users").collection("bots_for_mvp");
        const bots = await collection.find().toArray();


        // send
        if( !bots ){
            console.log("No bots found");
            res.sendStatus(404);
            return;
        }
        else
            res.send(bots);

    } catch (err){
        console.error(err);
        res.sendStatus(500);
    } finally {
        await client.close();
    }
})

// update
app.put("/api/bot/:id", async (req, res)=>{
    try{
        // validation
        if( !req.params.id )
        {
            console.log("Id is required");
            res.sendStatus(400);
            return;
        }
        if( typeof req.params.id !== 'string' )
        {
            console.log("Invalid id");
            res.sendStatus(400);
            return;
        }
        if( req.params.id !== req.body.bot_id )
        {
            console.log("Parameter and body ids don't match");
            res.sendStatus(400);
            return;
        }
        if( 
            (typeof req.body.bot_name) !== "string" ||
            (typeof req.body.chunks) !== "object" ||
            (typeof req.body.embeddings) !== "object" 
            // ||
            // (typeof req.body.chat) !== "object"  // cause sometimes we want to empty chat
        )
        {
            console.log("Invalid bot format");
            res.sendStatus(400);
            return;
        }
        if( 
            (typeof req.body.chunks[0]) !== "string" ||
            (typeof req.body.embeddings[0]) !== "object" 
            // ||
            // (typeof req.body.chat[0]) !== "string"   // cause sometimes we want to empty chat
        )
        {
            console.log("Invalid bot format");
            res.sendStatus(400);
            return;
        }
        if( typeof req.body.embeddings[0][0] !== "number" )
        {
            console.log("Invalid bot format");
            res.sendStatus(400);
            return;
        }

        console.log(req.body.chat);


        // might have to wrap this in thens, cause it sometimes runs before connecting...
        // mongo db
        await client.connect()
        const collection = client.db("users").collection("bots_for_mvp");

        await collection.updateOne({ bot_id: req.body.bot_id }, {$set: {
            bot_name: req.body.bot_name,
            chunks: req.body.chunks,
            embeddings: req.body.embeddings,
            chat: req.body.chat,
        }});
        const bot = await collection.findOne({bot_id: req.body.bot_id});


        // send
        res.send(bot);

    } catch(err){
        console.error(err);
        res.sendStatus(500);
    } finally{
        await client.close();
    }
})

// delete
app.delete("/api/bot/:id", async (req, res)=>{
    try{
        // validation
        if( !req.params.id )
        {
            console.log("Id is required");
            res.sendStatus(400);
            return;
        }
        if( typeof req.params.id !== 'string' )
        {
            console.log("Invalid id");
            res.sendStatus(400);
            return;
        }
        // if( req.params.id !== req.body.bot_id )
        // {
        //     console.log("Parameter and body ids don't match");
        //     res.sendStatus(400);
        //     return;
        // }


        // mongo db
        await client.connect()
        const collection = client.db("users").collection("bots_for_mvp");
        const bot = await collection.findOne({ bot_id: req.params.id });

        if( !bot )
        {
            res.send("Bot not found, so none deleted");
            return;
        }

        const result = await collection.deleteOne({ bot_id: req.params.id });


        // send
        if( result.deletedCount === 1 )
            res.send(result);   //will have to remove bot_id from localStorage in fe -- just for mvp
        else
            res.send("Couldn't delete bot");

    } catch(err){
        console.error(err);
        res.sendStatus(500);
    } finally {
        client.close();
    }
})
 

app.post("/api/chat", async (req, res)=>{
    try{
        // validation
        if( !req.body.chat )
        {
            console.log("Error. No chat included in request");
            res.sendStatus(400);
            return;
        }
        const length = req.body.chat.length;
        const question = req.body.chat[ length - 1 ];
        if( typeof question !== 'string' )
        {
            console.log("Body in invalid format");
            res.sendStatus(400);
            return;
        }
        if( question.length > 10000 )
        {
            console.log("Prompt too long");
            res.sendStatus(400);
            return;
        }


        async function embedText(txt)
        {
            const embeddings = new OpenAIEmbeddings({
                model: 'text-embedding-3-small',
                apiKey: process.env.OPEN_AI_API_KEY,
            });
            const embedding = await embeddings.embedQuery(txt);
            return embedding;
        }
        const embeddedQuestion = await embedText(question);

        // Similarity function
        function cosineSimilarity(vecA, vecB)
        {
            if( vecA.length !== vecB.length )
            {
                throw new Error('Vectors must be of equal length');
            }

            let dotProduct = 0;
            for(let i = 0; i < vecA.length; i++)
            dotProduct += vecA[i] * vecB[i];

            const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
            const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
            
            if(magnitudeA == 0 || magnitudeB == 0)
                return 0;

            return dotProduct / (magnitudeA * magnitudeB);
        }
        function similarityFunction(questionEmbedding, embeddedChunks, chunks, topN = 3)
        {
            const similarities = embeddedChunks.map((chunk, index) => ({
                content: chunks[index],
                similarity: cosineSimilarity(questionEmbedding, chunk),
            }))

            similarities.sort((a,b) => b.similarity - a.similarity);
            return similarities.slice(0, topN);
        }
        const similarChunks = similarityFunction(embeddedQuestion, req.body.embeddings, req.body.chunks);
        const dataForQuestion = similarChunks[0].content + similarChunks[1].content + similarChunks[2].content; // topN's 3
        // question = question + "\n\nContext:\n\n" + similarChunks;
        console.log(`Question: ${question}\n\n` + `Data: ${dataForQuestion}`);


        // nova
        const completion = await nova.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are bot birthed from Bimo (a chatbot maker), and your name is ${req.body.bot_name}.
                            Answer the question STRICTLY based on the following data. 
                            If the answer isn't related to the data, say "I don't have that information."
                            Don't add any special stylings to text. Make your answers concise: 2 sentences at most.`
                },
                {
                    role: "user",
                    content: `Question: ${question}\n\n` + `Data: ${dataForQuestion}`
                }
            ],
            model: "nova-2-lite-v1",
        });
        // console.log(completion.choices[0].message.content);


        // send
        res.send(completion);

    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
})

app.post("/api/feedback", async(req, res)=>{
    try{
        if(!req.body)
        {
            console.log("No body");
            res.sendStatus(400);
            return;
        }
        if( !req.body.feedback )
        {
            console.log("No feedback");
            res.sendStatus(400);
            return;
        }
        if( typeof req.body.feedback !== "string" )
        {
            console.log("Invalid type");
            res.sendStatus(400);
            return;
        }
        const feedback = req.body.feedback;
        const now = new Date();
        
        await client.connect()
        .then(async ()=>{
            const collection = client.db("users").collection('feedback');
            await collection.insertOne({
                date: now,
                feedback: feedback
            });
        })

        res.send("Thank you for your feedback!");

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    } finally{
        await client.close();
    }
})


app.listen(3000, ()=>{
    console.log("Listening...")
});