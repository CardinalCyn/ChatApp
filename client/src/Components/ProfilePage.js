import React,{useEffect, useState} from 'react';
import Axios from 'axios';
import {useNavigate} from 'react-router-dom'
import NavBar from './NavBar'
import FileUpload from './FileUpload';
import './AllPages.css'
 
const ProfilePage=()=>{
    const navigate=useNavigate();
    const [profileName,setProfileName]=useState("");

    Axios.defaults.withCredentials=true;
    useEffect(()=>{
        console.log("checking session");
        Axios.get("https://192.168.1.192:5000/checkSession").then((response)=>{
        console.log(response);
            if(!response.data.loggedIn){
                navigate("/");
            }
            else{
                console.log(response.data);
                setProfileName(response.data.user.username);
            }
        
        }).catch((err)=>{
            console.log(err);
        })
    },[navigate])
    return(
    <div className="profileContainer">
        <div id="headerContainer">
            <h1>profile</h1>
            {profileName}
        </div>
        <NavBar />
        <FileUpload />
    </div>
    )
}

export default ProfilePage