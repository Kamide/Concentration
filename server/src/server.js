require('dotenv').config()
const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

const io = SocketIO(server, { cookie: false });

const socketIOLog = (message) => {
  if (process.env.NODE_ENV == 'development') {
    console.log(message);
  }
}

let players = {};

io.on('connection', (socket) => {
  players[socket.id] = { name: '' };
  socketIOLog(`Player ${socket.id} connected.`);

  socket.on('setName', (name) => {
    players[socket.id].name = name;
    socketIOLog(`Player ${socket.id} changed their name to '${name}'.`);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    socketIOLog(`Player ${socket.id} disconnected.`);
  });
});
