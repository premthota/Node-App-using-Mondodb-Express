const { static } = require("express")
var express=require("express")
var bodyparser=require("body-parser")
const { Socket } = require("dgram")
var app=express()
var http=require("http").Server(app)
var io=require("socket.io")(http)

var mongo=require("mongoose")
mongo.set('useFindAndModify', false); // for using the MongoDB driver's findOneAndUpdate() function using the useFindAndModify global option.
app.use(express.static(__dirname))

app.use(bodyparser.json())

app.use(bodyparser.urlencoded({"extended":false}))
var dbUrl= "mongodb+srv://user_doos:user_doos@cluster0.noamh.mongodb.net/Doos?retryWrites=true&w=majority"
var Message=mongo.model('Message',{
    name:String,
    message:String,
    points:Number  // Prioritize the messages with ASAP 
})

//var messages=[ 
//    {name: 'Sri Rama', message: 'Om mahadevaa'},
//    {name: 'Hanuman', message: 'Om mahadevaa Jai Sri Ram'},
//    {name: 'Prem', message: 'Om mahadevaa Jai Sri Sai Ram Jai Hanuman'}
//]

app.get('/messages', (req,res) => {
    Message.find({}, (err,messages) => {
        res.send(messages)
    } )
})
app.post('/messages', async (req,res) => {
    try {
        var message= new Message(req.body)
        var mSave= await message.save()
    
        console.log("Saved")
      
        var important= await Message.findOneAndUpdate(
                {message:'priority'},
                {$inc:{points:5}})
        if (important)
               await Message.find({ }).sort( { points: -1 })//Promise sorts the message with highest points
                .then(console.log("Performs sort"))
                .catch(err =>{throw err})
            
        io.emit('message', req.body)
        res.sendStatus(200)  
    } catch (error) {
        res.sendStatus(500)
        return console.log(error)
    }finally{
        console.log("Post method ")
    }
})
io.on('connection', Socket => {
    console.log("Listening")
})

/*
app.post('/messages', (req,res) => {
    var message= new Message(req.body)
    //promise

    message.save()
    .then(() => {
        console.log("Saved")
        //finds the message with so called priority level
        return Message.findOneAndUpdate(
            {message:'priority'},
            {$inc:{points:5}})
    })
    .then( important =>{
        if (important){
            Message.find({ }).sort( { points: -1 })//Promise sorts the message with highest points
            .then(console.log("Performs sort"))
            .catch(err =>{throw err})
        }
        io.emit('message', req.body)
        res.sendStatus(200)  
    })
    .catch( (err) => {
        if(err)
            res.sendStatus(500)
            return console.log(err)
    })
        
})
*/


//Message.findOneAndUpdate(
//    {message:'priority'},
//    {$inc:{points:5}},
//    (err,important) => {
//        if (important){
//            Message.find({ }).sort( { points: -1 })//Promise sorts the message with highest points
//            .then(console.log("Performs sort"))
//            .catch(err =>{throw err})
//        }
//       console.log(err)
//    })



mongo.connect(dbUrl, { useUnifiedTopology: true }, err => {
    console.log("mongoose connected", err)
})

var server=http.listen(3000, () => {
    console.log("Server is listenning on port",server.address().port);
})