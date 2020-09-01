const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');
const devlog = require('./devlog');
const Player = require('./player');
const Game = require('./game');
const { emptyString, outOfRange } = require('./errors')

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

const io = SocketIO(server, { cookie: false });
const LOBBY = 'lobby';
let players = {};
let games = {};

function deleteGame(socket) {
  let game = games[socket.id];

  if (game) {
    delete games[socket.id];
    io.to(LOBBY).emit('lobbyDeleteGame', game.id);
    devlog(`Game   ${game} deleted.`);
  }
}

function leaveGame(socket) {
  let player = players[socket.id];

  if (player.isAManager) {
    player.emit('playerLeft', socket.id);
    deleteGame(socket);
  }
  else if (player.manager) {
    let game = games[player.manager];

    if (game) {
      game.delete(player);
      io.to(LOBBY).emit('lobbyPlayerLeftGame', game.id);
      devlog(`Player ${player} left ${game}.`);
    }
  }
  else {
    deleteGame(socket);
  }

  player.leave();
}

io.on('connection', (socket) => {
  let player = new Player(socket);
  players[socket.id] = player;
  devlog(`Player ${player} connected.`);

  socket.on('setPlayerName', (name) => {
    name = String(name);
    player.name = name;

    if (player.game) {
      io.to(player.game).emit('playerNameChanged', socket.id, name);
    }

    devlog(`Player ${player} changed their name.`);
  });

  socket.on('newGame', ({title, pairs, limit}) => {
    deleteGame(socket);
    title = String(title);
    pairs = parseInt(pairs);
    limit = parseInt(limit);

    if (emptyString(title) || outOfRange(pairs, 1, 52) || outOfRange(limit, 1, 4)) {
      io.to(socket.id).emit('newGameRedirect', null);
    }
    else {
      let timestamp = Date.now();
      let game = new Game(socket.id, timestamp, title, pairs, limit);
      games[socket.id] = game;
      io.to(socket.id).emit('newGameRedirect', timestamp);
      io.to(LOBBY).emit('lobbyNewGame', game.publicInfo);
      devlog(`Game   ${game} created.`);
    }
  });

  socket.on('requestJoinGame', (manager, timestamp) => {
    manager = String(manager);
    timestamp = parseInt(timestamp);
    let game = games[manager];
    let info = game && game.add(player, timestamp);
    io.to(socket.id).emit('joinGame', info);

    if (info) {
      io.to(LOBBY).emit('lobbyPlayerJoinedGame', game.id);
      devlog(`Player ${player} joined ${game}.`);
    }
  });

  socket.on('leaveGame', () => {
    leaveGame(socket);
  });

  socket.on('joinLobby', () => {
    io.to(socket.id).emit('gameList',
      Object.values(games)
        .filter(game => !game.playing)
        .map(game => game.publicInfo));

    socket.join(LOBBY);
  });

  socket.on('leaveLobby', () => {
    socket.leave(LOBBY);
  });

  socket.on('disconnect', () => {
    leaveGame(socket);
    delete players[socket.id];
    devlog(`Player ${player} disconnected.`);
  });
});
