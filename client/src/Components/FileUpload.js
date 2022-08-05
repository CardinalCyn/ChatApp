import React, { useEffect,useState } from "react";
import Axios from 'axios'
const Buffer = require('buffer/').Buffer

const FileUpload=()=>{
    const [pageState,setPageState]=useState(1);
    Axios.defaults.withCredentials=true;
    useEffect(()=>{
        Axios.get("https://192.168.1.192:5000/profilePic",{responseType:'arraybuffer'}).then((response)=>{
            const buffer = Buffer.from(response.data,'binary').toString('base64');
            const imageNode=document.getElementById("profilePictureImage");
            imageNode.src="data:image/;base64, "+buffer;
        })
    },[pageState])

    const uploadFile=(file)=>{
        const pictureData=new FormData();
        pictureData.append("profilePic",file);
        Axios.post("https://192.168.1.192:5000/profilePic",pictureData).then((response)=>{
            setPageState(pageState+1);
        })
    }
    return(
        <div id="fileUpload">
            <p>
                Upload your profile picture!
            </p>
            <img id="profilePictureImage" alt="user profile pic" width="100 px" height="100 px" border-radius="50%"></img>
            <form>
                <label htmlFor="fileInput" className="customFile">Select a file</label>
                <input id="fileInput" type="file" accept="image/*" onChange={e=>{uploadFile(e.target.files[0])}} />
            </form>
        </div>
    )
}

export default FileUpload