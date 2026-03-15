const crypto = require('crypto');
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

const dotenv = require('dotenv');
dotenv.config();

const admin_uri = process.env.admin_connection_string;
const client = new MongoClient(admin_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const corsOptions = {
    origin: ['*'], // for now
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

function generateRandomString(){
    const randomString = crypto.randomBytes(20).toString('hex');
    return randomString;
}

// create
app.post("/api/bot", async (req, res)=>{
    try{
        // validation
        if( !req.body.bot_name || !req.body.embeddings )
        {
            console.log("No bot name or embeddings")
            res.sendStatus(400);
            return;
        }
        if( typeof req.body.bot_name !== 'string' ){
            console.log("Bot name has to be a string")
            res.sendStatus(400);
            return;
        }
        if( Array.isArray(req.body.embeddings) )//|| req.body.embeddings.length != 1536 )
        {
            if(typeof req.body.embeddings[0] !== 'number')
            {
                console.log("Embeddings have to be float")
                res.sendStatus(400);
                return;
            }
        } else {
            console.log("Embeddings have to be an array")
            res.sendStatus(400);
            return;
        }


        // mongo db
        gen_id = generateRandomString();
        await client.connect();

        const collection = client.db("users").collection('bots_for_mvp');
        await collection.insertOne({
            bot_id: gen_id,
            bot_name: req.body.bot_name,
            embeddings: req.body.embeddings,
            chat: []
        });


        // send
        res.send(gen_id); //to be stored in localStorage for mvp

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
        // if( req.body. )


        // mongo db


        // send

    } catch (err){
        console.error(err);
        res.sendStatus(500);
    } finally{
        await client.close();
    }
})

// read all
app.get("/api/bot", (req, res)=>{

})

// update
app.put("/api/bot/:id", (req, res)=>{

})

// delete
app.delete("/api/bot/:id", (req, res)=>{

})



app.listen(3000, ()=>{
    console.log("Listening...")
});