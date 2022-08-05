import './App.css';
import React from 'react'
import {Route, Routes} from 'react-router-dom';
import SignInPage from './Components/SignInPage';
import ProfilePage from './Components/ProfilePage';
import RegisterPage from './Components/RegisterPage';
import ChatPage from './Components/ChatPage';
import { socketContext,socket } from './Components/socket';

const App=()=> {
  
  return (
    <div className="containerPage">
      <socketContext.Provider value={socket}>
        <Routes>
          <Route exact path="/" element={<SignInPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/profile"  element={<ProfilePage />} />
          <Route path="/chat"  element={<ChatPage />} />
        </Routes>
      </socketContext.Provider>
    </div>
  );
}

export default App;
