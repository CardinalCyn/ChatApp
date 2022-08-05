//things to do: social media auth: use google strategy once its ready for production on actual website, do something about being in a chatroom, but on profile, fix css

//express boilerplate
const express=require("express");
const app=express();
//used to parse cookies for session
const cookieParser=require("cookie-parser");
//used to allow communication b/w frontend and backend
const cors=require("cors");
//allows us to create a session, so we can stay logged in b/w page changes
const session=require('express-session');
//allows us to securely store env variables and read them
require("dotenv").config();
//hashes password in db
const bcrypt=require("bcrypt");
//allows us to read the info from client
const bodyParser=require("body-parser");
//connects to db
const mongoose=require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const MongoStore=require('connect-mongo');
const userModel=require('./userModel')
//converts text from f/e to json
app.use(express.json());
//ssl certificate reading, used to allow us to use https instead of http
const fs=require('fs');
const options={
    key:fs.readFileSync('./192.168.1.192-key.pem'),
    cert:fs.readFileSync('./192.168.1.192.pem')
}
//socket io rooms, allows us to set up chatroom
const https=require('https').createServer(options,app);
const io= require('socket.io')(https,{
    cors:{
        origin:"https://192.168.1.192:3000",
        methods:["GET,POST"]
    }
});

//allows frontend to make get and post requests w/ credentials
app.use(cors({
    origin:["https://192.168.1.192:3000"],
    methods:["GET","POST","DELETE"],
    credentials:true,
}));
//allows file uploads
const multer=require('multer');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
//session settings, enables using client being hosted differently than server
app.set("trust proxy",1);
app.use(
    session({
        name:"express.sid",
        key:"express.sid",
        secret:process.env.SESSION_SECRET,
        resave:false,
        saveUninitialized:false,
        unset:"destroy",
        store:MongoStore.create({
            mongoUrl:process.env.MONGO_URI,
            ttl:14*24*3600*1000,
            expires: new Date(new Date().getTime()+(5*24*60*60*1000)),
        }),
        cookie:{
            expires: new Date(new Date().getTime()+(5*24*60*60*1000)),
            secure:false,
        }
    })
)

//passport auth for server, used for authenticating through social media websites
const passport=require('passport');
const TwitterStrategy=require('passport-twitter').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;
const InstagramStrategy=require('passport-instagram').Strategy;
require('./passport')(app,userModel,passport,TwitterStrategy,FacebookStrategy,InstagramStrategy);


//routes for server
require("./routes")(app,userModel,bcrypt,multer,passport,TwitterStrategy,FacebookStrategy,InstagramStrategy);

//array of users connected that are in a room, each has prof name, socketid, and array of rooms theyre in
let users=[];
io.on('connection', (socket)=>{
    //listens to joinRoom emit from client, if the user doesnt exist it will add it, otherwise, it will push the room its trying to join into users array
    socket.on("joinRoom", (roomId,profileName)=>{
        if(profileName &&!users.some(user=>user.profileName===profileName)){
            users.push({
                profileName:profileName,
                socketId:socket.id,
                roomsJoined:[roomId]
            })
        }
        else{
            users=users.map(user=>{
                if(user.profileName===profileName&&!user.roomsJoined.includes(roomId)){
                    user.roomsJoined.push(roomId);
                    return user;
                }
                return user;
            })
        }
        //socket joins the room of roomid
        socket.join(roomId);
        //gets num of clients in room
        const clientSize=io.sockets.adapter.rooms.get(roomId).size;
        //set of socket ids in room
        const clients=io.sockets.adapter.rooms.get(roomId);
        //array of the usernames of clients in room
        let clientsNamesInRoom=[];
        //for each socket id in room, goes through users array to convert socket id to prof name
        for(let client of clients){
            for(let i=0;i<users.length;i++){
                if(client===users[i].socketId){
                    clientsNamesInRoom.push(users[i].profileName)
                }
            }
        }
        //emits the amt of users, user array, and new user events to clients in the room joined
        io.to(roomId).emit("usersInRoom",clientsNamesInRoom,roomId);
        io.to(roomId).emit("numUsers",clientSize,roomId);
        io.to(roomId).emit("newUser",profileName,roomId);
    })
    //listener for leave room
    socket.on("leaveRoom",(roomId,profileName)=>{
        //socket leaves rooms,
        socket.leave(roomId);
        //removes the roomId from the roomsJoined property of the user
            users= users.map(user=>{
            if(profileName===user.profileName){
                const newRoomsJoined=user.roomsJoined.filter(roomVal=>roomVal!==roomId)
                return {...user,roomsJoined:newRoomsJoined}
            }
            return user;
        })
        //if the rooms has more than one user after the user leaves the room, emits the new user array, number of users, and user left element
        if(io.sockets.adapter.rooms.get(roomId)){
            const clientSize=io.sockets.adapter.rooms.get(roomId).size;
            const clients=io.sockets.adapter.rooms.get(roomId);
            let clientsNamesInRoom=[];
            for(let client of clients){
                for(let i=0;i<users.length;i++){
                    if(client===users[i].socketId){
                        clientsNamesInRoom.push(users[i].profileName)
                    }
                }
            }
            io.to(roomId).emit("usersInRoom",clientsNamesInRoom,roomId);
            io.to(roomId).emit("numUsers",clientSize,roomId);
            io.to(roomId).emit("userLeft",profileName,roomId)
        }
    })
    socket.on("getRoomCount",(roomId)=>{
        //if the room exists, emits the number of users, and the array of clients
        if(io.sockets.adapter.rooms.get(roomId)){
            socket.emit("numUsers",io.sockets.adapter.rooms.get(roomId).size,roomId);
            const clients=io.sockets.adapter.rooms.get(roomId);
            let clientsNamesInRoom=[];
            for(let client of clients){
                for(let i=0;i<users.length;i++){
                    if(client===users[i].socketId){
                        clientsNamesInRoom.push(users[i].profileName)
                    }
                }
            }
            socket.emit("usersInRoom",clientsNamesInRoom,roomId);
        }
        
    })
    socket.on("disconnect",()=>{
        //when a user disconnects ,iterates through the rooms that the user was in before disconnecting. if the room still has 1+ users after the user left, it will send the amt of users, userLeft event. then iterates through list of clients, then iterates through users to create list of usernames in room. emits that to the rooms in roomjoined
        users.map(user=>{
            if(user.socketId===socket.id){
                for(let i=0;i<user.roomsJoined.length;i++){
                    if(io.sockets.adapter.rooms.has(user.roomsJoined[i])){
                        io.to(user.roomsJoined[i]).emit("numUsers",io.sockets.adapter.rooms.get(user.roomsJoined[i]).size,user.roomsJoined[i]);
                        io.to(user.roomsJoined[i]).emit("userLeft",user.profileName,user.roomsJoined[i]);
                        const clients=io.sockets.adapter.rooms.get(user.roomsJoined[i]);
                        let clientsNamesInRoom=[];
                        for(let client of clients){
                            for(let i=0;i<users.length;i++){
                                if(client===users[i].socketId){
                                    clientsNamesInRoom.push(users[i].profileName)
                                }
                            }
                        }
                        io.to(user.roomsJoined[i]).emit("usersInRoom",clientsNamesInRoom,user.roomsJoined[i]);
                    }
                }
            }
        })
        users=users.filter(user=>{
            return user.socketId!==socket.id
        })
    })
    //socket listener, gets message from client, sends it to all users in room
    socket.on("send_message",(message,roomDisplayed)=>{
        io.to(roomDisplayed).emit("receive_message", message,roomDisplayed);
    })
})
https.listen(5000, console.log("listening on port 5000"));