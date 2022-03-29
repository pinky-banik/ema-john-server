const express = require('express');
const { MongoClient } = require('mongodb');
var admin = require("firebase-admin");

const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

//firebase admin initialization 
var serviceAccount = require("./ema-john-pinky-firebase-adminsdk-ifxv6-cf3170583e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5f7tq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri);


async function verifyToken(req,res,next){
  if(req.headers?.authorization.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try{
      const decodedUser = await admin.auth.auth().verifyToken(idToken);
      req.decodedUserEmail = decodedUser.email;
    }
    catch{

    }
  }
  next();
  
};


async function run() {

    try {
  
      await client.connect(); 
      const database = client.db("ema-john");
      const productsCollection = database.collection("products");
      const ordersCollection =database.collection("orders");


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
  
    //add order api
    app.get('/orders', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.decodedUserEmail === email) {
          const query = { email: email };
          const cursor = ordersCollection.find(query);
          const orders = await cursor.toArray();
          res.json(orders);
      }
      else {
          res.status(401).json({ message: 'User not authorized' })
      }

     });
    app.post ('/orders', async(req,res)=>{
      
      const order = req.body;
      order.createdAt = new Date();
      const result = await ordersCollection.insertOne(order);
      res.json(result);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    })
    
  
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