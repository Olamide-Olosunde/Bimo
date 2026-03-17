const crypto = require('crypto');
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

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
  }
});

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:8080'], // dev & prod respectively
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};

const app = express();
app.use(express.json({limit: '100mb'}));
app.use(cors(corsOptions));

function generateRandomString(){
    const randomString = crypto.randomBytes(20).toString('hex');
    return randomString;
}

// create
app.post("/api/bot", async (req, res)=>{
    try{
        // validation
        if( !req.body.doc )
        {
            console.log("Invalid request");
            res.sendStatus(400);
            return;
        }
        if( typeof req.body.doc !== "string" )
        {
            console.log("Doc has to be in string");
            res.sendStatus(400);
            return;
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


        // RAG
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 512,
            chunkOverlap: 64,
        });
        await splitter.splitText(req.body.doc)
        .then(async (chunks)=>{
            // embed
            const embeddings = [];
            for(let i = 0; i < chunks.length; i++ )
            {
                const batchEmbeddings = await embedText(chunks[i]);
                embeddings.push(batchEmbeddings);
            }
            return {chunks, embeddings};
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
                return {name, chunks, embeddings};
            })
        })
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

            return gen_id;
        })
        .then((gen_id)=>{
            // send
            res.send(gen_id); //to be stored in localStorage for mvp
        })

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


        // mongo db
        await client.connect();
        const collection = client.db("users").collection("bots_for_mvp");

        await collection.updateOne({ bot_id: req.body.bot_id }, {$set: {
            bot_name: req.body.bot_name,
            chat: req.body.chat
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
        client.connect()
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
        const question = req.body.chat;
        if( typeof question !== 'string' )
        {
            console.log("Body in invalid format");
            res.sendStatus(400);
            return;
        }


        // nova
        console.log(question)
        const completion = await nova.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Don't format text with md styling. Always give a response of maximum 2 sentences. Only reach 2 if NEEDED. When ever you're asked to generate a file name, wrap the name of the file in quotation marks."
                },
                {
                    role: "user",
                    content: question
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

// app.post("/api/docs", async (req, res) => {
//     try{

//     } catch (err){
//         console.error(err);
//         res.sendStatus(500);
//     }
// })



app.listen(3000, ()=>{
    console.log("Listening...")
});