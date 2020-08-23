const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');
const devlog = require('./devlog');
const Player = require('./player');
const Game = require('./game');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

const io = SocketIO(server, { cookie: false });
let players = {};
let games = {};

function deleteGame(socket) {
  let game = games[socket.id];

  if (game) {
    delete games[socket.id];
    devlog(`Game   ${game} deleted.`);
  }
}

function leaveGame(socket) {
  let player = players[socket.id];

  if (player.isAManager) {
    player.emit('playerLeft', socket.id);
    deleteGame(socket);
  }
  else {
    let game = games[player.manager];

    if (game) {
      game.delete(player);
      devlog(`Player ${player} left ${game}.`);
    }
  }

  player.leave();
}

io.on('connection', (socket) => {
  let player = new Player(socket);
  players[socket.id] = player;
  devlog(`Player ${player} connected.`);

  socket.on('setPlayerName', (name) => {
    player.name = name;
    devlog(`Player ${player} changed their name.`);
  });

  socket.on('newGame', ({title, limit, pairs}) => {
    deleteGame(socket);
    let timestamp = Date.now();
    let game = new Game(socket.id, timestamp, title, limit, pairs);

    games[socket.id] = game;
    io.to(socket.id).emit('newGameRedirect', timestamp);
    devlog(`Game   ${game} created.`);
  });

  socket.on('requestJoinGame', (manager, timestamp) => {
    let game = games[manager];
    let permit = game && game.timestamp == timestamp
      && (game.count > 0 || game.manager == socket.id)
      && !(socket in game);

    io.to(socket.id).emit('joinGame', permit);

    if (permit) {
      let info = game.add(player);
      io.to(socket.id).emit('gameInfo', info);
      devlog(`Player ${player} joined ${game}.`);
    }
  });

  socket.on('leaveGame', () => {
    leaveGame(socket);
  });

  socket.on('disconnect', () => {
    leaveGame(socket);
    delete players[socket.id];
    devlog(`Player ${player} disconnected.`);
  });
});
