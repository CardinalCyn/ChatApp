import {io} from 'socket.io-client'
import React from 'react';

export const socket = io("https://192.168.1.192:5000/");
export const socketContext=React.createContext();