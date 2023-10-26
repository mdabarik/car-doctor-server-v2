const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5500;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


/******** MongoDB Server Start *******/
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.waijmz7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {

    const serviceCollection = client.db('CarDoctor').collection('services');

    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const options = {
            projection: { title: 1, price: 1, img: 1  }
        }
        const result = await serviceCollection.findOne(query, options);
        res.send(result);
    });

    const checkoutCollection = client.db('CarDoctor').collection('checkout');
    app.post('/checkout', async (req, res) => {
        const checkout = req.body;
        console.log(checkout);
        const result = await checkoutCollection.insertOne(checkout);
        res.send(result);
    })

    app.get('/checkout', async(req, res) => {
        console.log(req.query.email);
        let query = {};
        if (req.query?.email) {
            query = {email: req.query.email}
        }
        const result = await checkoutCollection.find(query).toArray()
        res.send(result)
    })

    app.patch('/booking/:id', async(req, res) => {
        const updatedBooking = req.body;
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const updated = {
            $set: {
                status: updatedBooking.status
            }
        }
        console.log(updatedBooking);
        const result = await checkoutCollection.updateOne(filter, updated);
        res.send(result);
    })

    app.delete('/booking/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await checkoutCollection.deleteOne(query);
        res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);
/******** MongoDB Server End *******/

app.get('/', (req, res) => {
    res.send('doctor is running');
})

app.listen(port, () => {
    console.log('Car Doctor Server is running on port: ', port);
})