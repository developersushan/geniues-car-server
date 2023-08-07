const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cors = require('cors');
const app =express()
const port = process.env.PORT || 8000
require('dotenv').config();
//middleware
app.use(cors())
app.use(express.json())

app.get('/', (req,res)=>{
    res.send('Geniues car server running')
} )

//mongodb server
console.log(process.env.ACCESS_TOKEN_SECRET)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ffndnr.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {serverApi: {version: ServerApiVersion.v1,strict: true,deprecationErrors: true,}
});

const verifyJwt = (req,res,next)=>{
    const authorization = req.headers.authorization
    if(!authorization){
        return res.status(401).send({error:true,message:'unauthorized access'})
    }
    const token = authorization.split(' ')[1]
    console.log(token)
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decode)=>{
        if(error){
            return res.status(403).send({error:true,message:'unauthorized access'})
        }
        req.decode = decode
        next()
    })

}

async function run(){
    try{
        const serviceCollection = client.db('geniues-car0').collection('services')
        const orderCollection = client.db('geniues-car0').collection('orders')
        //jwt token
        app.post('/token', (req,res)=>{
            const user = req.body
            console.log(user)
            const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
                expiresIn:'1day'
            })
            console.log(token)
            res.send({token})
        })
        //all data find
        app.get('/services', async (req,res)=>{
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })
        //get api findOne
        app.get('/services/:id', async(req,res)=>{
            const id = req.params.id
            const cursor = { _id:new ObjectId(id) }
            const options ={
                projection:{title:1, price:1, service_id:1, img:1,},
            }
            const service = await serviceCollection.findOne(cursor,options)
            res.send(service)
        })
        //get api post method create
        app.post('/orders', async (req,res)=>{
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result)
            console.log(result)
        }) 
        app.get('/orders',verifyJwt, async( req,res)=>{
            // console.log(req.headers)
            const decoded = req.decode
            if(decoded.email !== req.query.email){
                res.status(403).send({error:1,message:'Forbidden access'})
            }
            console.log('come to back ', decoded)
            let query ={}
            if(req.query?.email){
                query = {email:req.query.email}
            }
            const result = await orderCollection.find(query).toArray()
            res.send(result)
        })  
        //update-api
        app.patch('/orders/:id', async(req,res)=>{
            const id = req.params.id
            const filter = { _id:new ObjectId(id)}
            const updateDoc =req.body
            const update={
                $set:{
                    status:updateDoc.status
                }
            }
            const result = await orderCollection.updateOne(filter,update)
            res.send(result)
        })
        //delete-api
        app.delete('/orders/:id', async(req,res)=>{
            const id  = req.params.id
            const query = { _id:new ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

    }
    finally{

    }
}
run().catch(error=>console.error(error))

app.listen(port,()=>{
    console.log(`listen port running ${port}`)
})