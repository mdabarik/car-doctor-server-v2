const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5500;
require('dotenv').config();
/**** JSON Web Token ****/
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})


// custom middleware
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            // console.log(err, 'inside verify token err');
            // return res.status(401).send({ message: 'unauthorized access' })
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send({ message: 'Token has expired. Please log in again.' });
            }
            console.log(err, 'inside verify token err');
            return res.status(401).send({ message: 'unauthorized access' });
        }
        
        console.log(req.user, 'inside verifyToken req.user');
        req.user = decoded;
        next();
    })
}


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

    // auth related api

    // require('crypto').randomBytes(64).toString('hex'); to generate token
    app.post('/jwt', logger, async(req, res) => {
        const user = req.body;
        // const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '24h'})
        console.log(user);
        res
        .cookie('token', token, {
            httpOnly: true,
            secure: false
        })
        .send({success: true});
    })

    // services related api
    app.get('/services', logger, async(req, res) => {
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
        const result = await checkoutCollection.insertOne(checkout);
        res.send(result);
    })

    // app.get('/checkout', verifyToken, async(req, res) => {
    //     // console.log(req.query.email);
    //     // console.log(req.cookies);
    //     // console.log(req.query.email);
    //     // console.log('ttttt token', req.cookies.token)
    //     console.log('user in the valid token', req.user)
    //     if(req.query.email !== req.user.email){
    //         return res.status(403).send({message: 'forbidden access'})
    //     }

    //     let query = {};
    //     if (req.query?.email) {
    //         query = {email: req.query.email}
    //     }
    //     const result = await checkoutCollection.find(query).toArray()
    //     res.send(result)
    // })

    app.get('/checkout', logger, verifyToken, async (req, res) => {
        console.log(req.query.email);
        // console.log('ttttt token', req.cookies.token)
        console.log('user in the valid token', req.user)
        if(req.query.email !== req.user.email){
            return res.status(403).send({message: 'forbidden access'})
        }

        let query = {};
        if (req.query?.email) {
            query = { email: req.query.email }
        }
        const result = await checkoutCollection.find(query).toArray();
        res.send(result);
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