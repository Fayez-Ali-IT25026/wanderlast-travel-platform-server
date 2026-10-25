import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import 'dotenv/config'
import cors from 'cors'




const app = express();
const PORT = 8000;







app.use(cors());
app.use(express.json());








const client = new MongoClient(process.env.MONGODB_URL)
 

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}





const connectedClient = await connectToMongoDB()
const db = connectedClient.db('wanderlast');
const users = db.collection('addDestination');









app.post('/add-destination', async(req , res) => {

const data = req.body
console.log(data)
const result = await users.insertOne(data);
    res.send(result);

})

app.get('/destination', async (req, res) => {
  const result = await users.find({}).toArray();
  res.send(result);
});



app.get('/destination/:id', async(req,res) => {

  const id = req.params.id;
  const query = {_id : new ObjectId (id)};

  const result = await users.findOne(query);
  res.send(result);


})













app.put('/destination/:id', async (req, res) => {
  
  
  const result =  await users.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
  res.send(result);
});









app.delete('/destination/:id', async (req, res) => {
 const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});







app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`);
});
