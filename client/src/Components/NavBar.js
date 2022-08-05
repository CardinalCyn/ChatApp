import React from 'react';
import {useNavigate} from 'react-router-dom'
import Axios from 'axios'

const NavBar=()=>{
    const navigate=useNavigate();
    const chatNav=()=>{
        navigate("/chat");
    }
    const profileNav=()=>{
        navigate("/profile")
    }
    const logOut=()=>{
        Axios.defaults.withCredentials=true;
        Axios.post("https://192.168.1.192:5000/logout").then((response)=>{
            if(response.data.status==="logged out"){
                navigate("/");
            }
            else{
                console.log(response.data);
            }
        })
    }
    return(
        <div id="navBar">
            <button onClick={chatNav}>Chat</button>
            <button onClick={profileNav}>Profile</button>
            <button onClick={logOut}>Log Out</button>
        </div>
    )
}

export default NavBar