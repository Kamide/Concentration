const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');
const State = require('./state');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

const io = SocketIO(server, { cookie: false });
const state = new State(io, 'lobby');

io.on('connection', (socket) => {
  const player = state.newPlayer(socket);

  socket.on('disconnect', () => {
    state.deletePlayer(player);
  });

  require('./sockets/player')(io, socket);
  require('./sockets/lobby')(io, socket, state);
  require('./sockets/game')(io, socket, state, player);
});
