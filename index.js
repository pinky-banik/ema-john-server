const express = require('express');
const { MongoClient } = require('mongodb');

const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5f7tq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri);


async function run() {

    try {
  
      await client.connect(); 
      const database = client.db("ema-john");
      const productsCollection = database.collection("products");
      
      //get api
      app.get('/products', async (req, res) => {
        console.log(req.query)
        const cursor = productsCollection.find({});
        const page = req.query.page;
        const size = parseInt(req.query.size);
        let products;
        const count = await cursor.count();

        if (page) {
            products = await cursor.skip(page * size).limit(size).toArray();
        }
        else {
            products = await cursor.toArray();
        }

        res.send({
            count,
            products
        });
      });

    //use post api to get data by keys
    app.post ('/products/bykeys',async(req,res)=>{
    const keys =(req.body);
    const query = {key:{$in: keys}}
    const products = await productsCollection.find(query).toArray();
    res.json(products);
    });
  
     
    //   const result = await haiku.insertOne(doc)
    //   console.log(`A document was inserted with the _id: ${result.insertedId}`);
  
    } finally {
  
    //   await client.close();
  
    }
  
  }
  
  run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("ema-john server is running");
})

app.listen(port,()=>{
    console.log("server is running on port",port);
})