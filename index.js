import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import 'dotenv/config'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from "jose";




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
const bookingCollection = db.collection('Booking')




const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
   if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  
  
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try { 
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }





};









app.post('/add-destination',verifyToken, async(req , res) => {

const data = req.body
console.log(data)
const result = await users.insertOne(data);
    res.send(result);

})



app.post('/booking', async(req , res) => {

const data = req.body

const result = await bookingCollection.insertOne(data);
    res.send(result);

})





app.get('/my-booking/:email', async (req , res)=>{
const {email} = req.params;
const result = await bookingCollection.find({email : email}) .toArray();
res.send (result);


})


app.delete('/my-booking/:id', async (req , res) => {
 const{id} = req.params;
//  const result = await bookingCollection.deleteOne({_id : id});
// CHANGED (2026-10-30): legacy bookings were created with the destination's `_id` string leaked
// into the insert payload, so their `_id` is a BSON *string* while newer bookings get a real
// ObjectId. `{_id : new ObjectId(id)}` matched nothing for those documents (deletedCount: 0 →
// MyBookingCard threw "No booking was deleted"). Query both shapes via $or, guarded by
// ObjectId.isValid so a malformed id can't throw and turn into an HTML 500.
const or = [{ _id: id }];
if (ObjectId.isValid(id)) or.push({ _id: new ObjectId(id) });
const result = await bookingCollection.deleteOne({ $or: or });
 res.send(result);


})









app.get('/destination', async (req, res) => {
  const result = await users.find({}).toArray();
  res.send(result);
});


app.get('/featured-destinations', async(req, res) => {
  const result  = await users.find().limit(5).toArray()
  res.send(result)
})



app.get('/destination/:id',verifyToken, async(req,res) => {

  const id = req.params.id;
  const query = {_id : new ObjectId (id)};

  const result = await users.findOne(query);
  res.send(result);


})













app.put('/destination/:id', async (req, res) => {
  
  
  const result =  await users.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
  res.send(result);
});









// app.delete('/destination/:id', async (req, res) => {
//  const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
//   res.send(result);
// });

app.delete('/my-booking/:id', async (req, res) => {
  const { id } = req.params;

  // CHANGED (2026-10-30): Support legacy bookings where _id
  // was stored as a string instead of a MongoDB ObjectId.
  const or = [{ _id: id }];

  if (ObjectId.isValid(id)) {
    or.push({ _id: new ObjectId(id) });
  }

  const result = await bookingCollection.deleteOne({
    $or: or
  });

  res.send(result);
});





app.get("/", (req, res) => {
  res.send("Server running fine");
});

app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`);
});


export default app