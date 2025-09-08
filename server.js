// server.js
const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const allowedTokens = [
    process.env.ACCESS_PI,
    process.env.ACCESS_PHONE,
    process.env.ACCESS_PARTNER
  ];

  if (allowedTokens.includes(token)) {
    return next();
  } else {
    console.log(`❌ Unauthorised device: ${socket.id}`);
    return next(new Error("Unauthorised"));
  }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // This is a simple signaling logic for a two-person room
    socket.on('join room', (roomName) => {
        socket.join(roomName);
        const clientsInRoom = io.sockets.adapter.rooms.get(roomName);
        const numClients = clientsInRoom ? clientsInRoom.size : 0;
        console.log(`User ${socket.id} joined room ${roomName}. Room now has ${numClients} client(s).`);

        if (numClients === 1) {
            socket.emit('created'); // First user in the room
        } else if (numClients === 2) {
            io.in(roomName).emit('joined'); // Second user joins
        } else { // Max two clients
            socket.leave(roomName);
            socket.emit('full');
        }
    });

    // Relay 'offer' messages
    socket.on('offer', (offer, roomName) => {
        socket.to(roomName).emit('offer', offer);
        console.log('Relaying offer from', socket.id);
    });

    // Relay 'answer' messages
    socket.on('answer', (answer, roomName) => {
        socket.to(roomName).emit('answer', answer);
        console.log('Relaying answer from', socket.id);
    });

    // Relay 'ice-candidate' messages
    socket.on('ice-candidate', (candidate, roomName) => {
        socket.to(roomName).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});