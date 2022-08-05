import './AllPages.css'
import React,{useContext, useEffect, useState} from 'react'
import $ from 'jquery'
import Axios from 'axios'
import {useNavigate} from 'react-router-dom'
import { socketContext } from './socket'
import NavBar from './NavBar'

//used to convert binary to base64 img
const Buffer = require('buffer/').Buffer 
//array of all messages, organized by each element being object, with roomId and messages in the room
let messageListDisplayed=[];

const ChatPage=() =>{
  const socket=useContext(socketContext);
  //used to navigate to diff page
  const navigate=useNavigate();
  //value of text field for room
  const [roomId,setRoomId]=useState("");
  //value of the lists that the current user is in. it will be initialized to the value in browser local storage, or will be empty
  const [roomList,setRoomList]=useState(()=>{
    return JSON.parse(localStorage.getItem("roomList"))||[]
  });
  //value of the chatroom the user is currently in
  const [roomDisplayed,setRoomDisplayed]=useState("");
  //amount of users in the room that the user is currently viewing
  const [roomUsers,setRoomUsers]=useState(1);
  //array of users that are in the room
  const [usersInRoom,setUsersInRoom]=useState([]);
  //value of message text field, on submit, this value is sent to all users in room
  const [message,setMessage]=useState("");
  //profilename is the users prof name, prof pic is the users prof pic, this data is in base64 format, and sent to socket io, so it can be sent with the message the user sends
  const [profileName,setProfileName]=useState("");
  const [profilePic,setProfilePic]=useState("");

  Axios.defaults.withCredentials=true;
  useEffect(()=>{
    //checks if user is logged in, navigates to home page if not, otherwise gets the username from server
    Axios.get("https://192.168.1.192:5000/checkSession").then((response)=>{
      if(!response.data.loggedIn){
        navigate("/");
      }
      else{
        setProfileName(response.data.user.username);
      }
    })
    //gets users profile picture from server, stores in client as base64
    Axios.get("https://192.168.1.192:5000/profilePic",{responseType:'arraybuffer'}).then((response)=>{
      const buffer = Buffer.from(response.data,'binary').toString('base64');
      setProfilePic(buffer);
    })
    
  },[navigate])

  useEffect(()=>{
    if(profileName){
    Axios.get('https://192.168.1.192:5000/roomDisplayed').then((response)=>{
      setRoomDisplayed(response.data.roomDisplayed);
    })
    Axios.get('https://192.168.1.192:5000/roomList').then((response)=>{
      setRoomList(response.data.roomList);
      response.data.roomList.forEach(roomInList=>{
        socket.emit("joinRoom",roomInList,profileName);
      })
    })
    }
  },[socket,profileName])
  //useeffect to make post request to server, whenever the roomDisplayed changes, it will update the user in db to have it displayed as default
  
  useEffect(()=>{
    if(profileName){
      Axios.post('https://192.168.1.192:5000/roomDisplayed',{roomDisplayed:roomDisplayed}).then((response)=>{
        console.log(response);
      })
    }
  },[profileName,roomDisplayed])
  //useeffect to make post request to server, whenever the roomList changes, it will update the user in db to have it displayed as default
  useEffect(()=>{
    if(profileName){
      Axios.post('https://192.168.1.192:5000/roomList',{roomList:roomList}).then((response)=>{
        console.log(response);
      })
    }
  },[profileName,roomList])
  
  useEffect(()=>{
    //everytime roomdisplayed changes, this will run
    if(roomDisplayed){
      //when roomdisplayed changes to valid value, emits to server the roomdisplayed info, and gets the list of users in that room and amt of users in that room
      socket.emit("getRoomCount",roomDisplayed);
      //if the messagelist doesnt have an object with property of roomname thats the same as the roomdisplayed, it will make one
      if(!messageListDisplayed.some(messageList=>
        messageList.roomName===roomDisplayed
      )){
        messageListDisplayed.push({roomName:roomDisplayed,messagesInRoom:``});
      }
      else{
        //otherwise, it will empty the chatbox, and set the chatbox to the values of the messages in the room
        messageListDisplayed.forEach(messageList=>{
          if(messageList.roomName===roomDisplayed){
            $('#messages').empty().append($(messageList.messagesInRoom));
          }
          return {messageList};
        })
      }
    }
  },[roomDisplayed,socket]);
  //function for joining a room, checks the submitted roomId if it doesn't have whitespace, sees if the roomlist includes the roomId. if both pass, it will add the roomid to roomlist, emit a socket io event to join room, sending the roomid and profilename, and chaanges the roomdisplyed to the roomid in field, then resets the text field
  const joinRoom=()=>{
    const regExp=/^\w+$/;
    if(regExp.test(roomId) &&!roomList.includes(roomId)){
      setRoomList(roomList.concat(roomId));
      socket.emit("joinRoom",roomId,profileName);
      setRoomDisplayed(roomId);
    }
    setRoomId("");
  }
  //function for leaving a room. filters out the room that doesnt equal roomname, emits leaveroom event, clears out the room displayed, clears out the message history of the messagelist, and empties the chatbox
  const leaveRoom=(roomName)=>{
    setRoomList(roomList.filter(room=>room!==roomName));
    socket.emit("leaveRoom",roomName,profileName);
    setRoomDisplayed("");
    messageListDisplayed=messageListDisplayed.filter(room=>
      {return room.roomName!==roomName}
    )
    $('#messages').empty().append("");
  }
  useEffect(()=>{
    //socket listener, takes in roomsize and roomid, if the value of the room is = to roomid, will set the amt of users to roomsize
    socket.on("numUsers",(roomSize,roomId)=>{
      if(roomDisplayed===roomId){
        setRoomUsers(roomSize);
      }
      
    })
    //socket listener, gets the list of users from socket io
    socket.on("usersInRoom",(roomUsers,roomId)=>{
      if(roomDisplayed===roomId){
        setUsersInRoom(roomUsers);
      }
    })
    //receive message socket listener, gets the message data and roomname. finds the message element equal to roomname, and then adds message to its property. adds an element of li, the prof picture of the sender, message, etc. if the roomdisplayed is equal to the roomname, it will empty out the array and append the messages
    socket.on("receive_message",(data,roomName)=>{
      messageListDisplayed.forEach(messageList=>{
        if(messageList.roomName===roomName){
          messageList.messagesInRoom+=`<li id="message"><img id="profilePictureImage" src=${ "data:image/;base64,"+data.profilePic}>${data.profileName}: ${data.message}</li>`;
 
          if(roomDisplayed===roomName){
            $('#messages').empty().append($(messageList.messagesInRoom));
          }
        }
      });
      //autoscrolls to bottom
      const messageDiv=document.getElementById("messages");
      messageDiv.scrollIntoView(false);
    })
    //adds new user message when user joins room
    socket.on("newUser",(newProfileName,roomName)=>{
      messageListDisplayed.forEach(messageList=>{
        if(messageList.roomName===roomName){
          messageList.messagesInRoom+=`<li id="message">New user ${newProfileName} has joined the chat</li>`;
          if(roomDisplayed===roomName){
            $('#messages').empty().append($(messageList.messagesInRoom));
          }
        }
      })
    })
    //adds user has left chat to the rooms the user left when they disconnect or leave the room
    socket.on("userLeft",(username,roomName)=>{
      messageListDisplayed.forEach(messageList=>{
        if(messageList.roomName===roomName){
          messageList.messagesInRoom+=`<li id="message">User ${username} has left the chat</li>`;
          if(roomDisplayed===roomName){
            $('#messages').empty().append($(messageList.messagesInRoom));
          }
        }
      })
    })
    return ()=>{
      socket.off("receive_message");
      socket.off("numUsers");
      socket.off("newUser");
      socket.off("userLeft");
      socket.off("usersInRoom");
    }
  },[socket,profileName,roomDisplayed])
  //send message function, emits socket io with the users prof name, pic, message, and the room theyre currently in, then clears the text field
  const sendMessage=()=>{
    socket.emit("send_message",{profileName:profileName, profilePic:profilePic,message:message},roomDisplayed);
    setMessage("");
  }

  return (
    <div className='chatContainer'>
      <div id='headerContainer'>
        <h1>Chatbox</h1>
        {roomDisplayed?<div id="roomInfo">
          <h3>Users in room: {roomUsers}</h3>
          <h3>Users:<ul>{usersInRoom.map(user=><li key={user}>{user}</li>)}</ul></h3>
          <h3>Current Room:{roomDisplayed}</h3>
        </div>:<></>}
        <NavBar />
      </div>
      <div id="chatBox">
        <ul id="messages">
        </ul>
      </div>
      <form onSubmit={(e)=>e.preventDefault()}>
        <input id="messageField" type="username" value={message}onChange={(e)=>setMessage(e.target.value)}placeholder="Your Message Here" />
        <button onClick={()=>sendMessage()} type="submit">Send</button>
      </form>
      <div id="joinRoom">
        <form onSubmit={(e)=>e.preventDefault()}>
            <input type="text" placeholder='Enter a Room value here!' value={roomId} onChange={e=>setRoomId(e.target.value)}></input>
            <button onClick={()=>joinRoom()} type="submit">Join Room!</button>
        </form>
      </div>
      <div id="sidebar">
        <ul id="joinedRooms">
            {roomList.map(room=><li key={room}><div id={room} onClick={()=>setRoomDisplayed(room)}>{room}</div><div onClick={()=>leaveRoom(room)}>Leave Room</div></li>)}
        </ul>
      </div>
    </div>
  )
}

export default ChatPage