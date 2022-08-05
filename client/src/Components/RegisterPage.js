import React,{useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import './AllPages.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter,faFacebookF,faInstagram } from '@fortawesome/free-brands-svg-icons';
const RegisterPage=()=>{
    const navigate=useNavigate();

    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [usernameTaken,setUsernametaken]=useState(false);
    const [usernameValid,setUsernameValid]=useState(true);
    const [passwordValid,setPasswordValid]=useState(true);
    Axios.defaults.withCredentials=true;
    useEffect(()=>{
      Axios.get("https://192.168.1.192:5000/checkSession").then((response)=>{
        console.log(response);
        if(response.data.loggedIn){
          navigate("/profile");
        }
      })
    },[navigate])
    
    const registerUser=(e)=>{
        e.preventDefault();
        
        Axios.post("https://192.168.1.192:5000/register",{
            username:username,
            password: password,
        }).then((response)=>{
            if(response.data.status==="credential input invalid"){
              if(!response.data.usernameValid){
                setUsernametaken(false);
              }
              setUsernameValid(response.data.usernameValid);
              setPasswordValid(response.data.passwordValid);
            }
            else if(response.data.status==="created"){
              navigate("/")
            }
            else if(response.data.status==="username already exists"){
              setUsernametaken(true);
            }
        })
    }
    return(
        <div className='registerContainer'>
        <div id="headerContainer">
          <h1>
            Whatsupp
          </h1>
          <h2>Another Social Media Platform</h2>
        </div>
        <div id="formContainer">
          <h2>Register now!</h2>
          <form onSubmit={registerUser}>
            <div className='formGroup'>
              {usernameValid?<label form= "usernameTextField">Username</label>:<label form= "usernameTextField">Username must be between 2 and 32 characters long</label>}
              <input type="username" value={username} onChange={(e)=>setUsername(e.target.value)} className="formControl" id= "usernameTextField" placeholder="Enter Username"></input>
              {passwordValid?<label form= "passwordTextField">Password</label>:<label form= "passwordTextField">Password must be between 8 and 40 characters long</label>}
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="formControl" id="passwordTextField" placeholder="Enter Password"></input>
              <button type="submit" value= "register" id="registerButton">Submit</button>
            </div>
            {usernameTaken?<div id="usernameTaken">That username is already taken!</div>:<div></div>}
            <div className= 'registerFromLogin'>
              Already have an account? <a href="/">Sign in!</a>
            </div>
            <h3>Log in with social media!</h3>
            <div className='buttonGroup'>
              <a href= "https://192.168.1.192:5000/auth/twitter/" className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faTwitter} size= "3x"/></a>
              <a href= "https://192.168.1.192:5000/auth/facebook/" className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faFacebookF} size ="3x"/></a>
              <a href= "https://192.168.1.192:5000/auth/instagram/callback" target="_blank" rel="noreferrer" className="socialButton"><FontAwesomeIcon id="fontAwesome" icon={faInstagram} size= "3x"/></a>
            </div>
          </form>
        </div>
      </div>
    )
}

export default RegisterPage;