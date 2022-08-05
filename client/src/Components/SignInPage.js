import React,{useEffect, useState} from 'react';
import Axios from "axios";
import './AllPages.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter,faFacebookF,faInstagram } from '@fortawesome/free-brands-svg-icons';
import {useNavigate} from 'react-router-dom'
const SignInPage=()=>{
    const navigate=useNavigate();
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [credentialsValid,setCredentialsValid]=useState("");
    Axios.defaults.withCredentials=true;
    useEffect(()=>{
      Axios.get("https://192.168.1.192:5000/checkSession").then((response)=>{
        console.log(response);
        if(response.data.loggedIn){
          navigate("/profile");
        }
      })
    },[navigate])
    
    const signInUser=(e)=>{
        e.preventDefault();
        Axios.post("https://192.168.1.192:5000/",{
            username:username,
            password:password,
        }).then((response)=>{
            if(response.data.user){
              console.log(response.data.user);
              navigate("/profile");
            }
            else{
              setCredentialsValid(response.data.status);
            }
        })
    }
    return(
        <div className='loginContainer'>
      <div id="headerContainer">
        <h1>
          Whatsupp
        </h1>
        <h2>Another Social Media Platform</h2>
      </div>
      <div id="formContainer">
        <h2>Sign in!</h2>
        <form onSubmit={signInUser}>
          <div className='formGroup'>
            <label form= "usernameTextField">Username</label>
            <input type="username" value={username} onChange={(e)=>setUsername(e.target.value)}className="formControl" id= "usernameTextField" placeholder="Enter Username"></input>
            <label form= "passwordTextField">Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)}className="formControl" id="passwordTextField" placeholder="Enter Password"></input>
            <button type="submit" value= "login" id="loginButton">Submit</button>
          </div>
          <div>{credentialsValid}</div>
          <div className= 'registerFromLogin'>
            Don't have an account? <a href="register">Sign up!</a>
          </div>
          <h2>Log in with social media!</h2>
          <div className='buttonGroup'>
            <a href= "https://192.168.1.192:5000/auth/twitter/"  className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faTwitter} size= "3x"/></a>
            <a href= "https://192.168.1.192:5000/auth/facebook/" className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faFacebookF} size ="3x"/></a>
            <a href= "https://192.168.1.192:5000/auth/instagram/" className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faInstagram} size= "3x"/></a>
          </div>
        </form>
      </div>
    </div>
    )
}
export default SignInPage