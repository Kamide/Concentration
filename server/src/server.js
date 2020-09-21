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
    io.to(LOBBY).emit('game_list_game_delete', game.id);
    devlog(`Game   ${game} deleted.`);
  }
}

function leaveGame(socket) {
  let player = players[socket.id];

  if (player.isAManager) {
    player.emit('player_leave', socket.id);
    deleteGame(socket);
  }
  else if (player.manager) {
    let game = games[player.manager];

    if (game) {
      game.delete(player);
      io.to(LOBBY).emit('game_list_game_leave', game.id);
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

  socket.on('player_name_update', (name) => {
    name = String(name);
    player.name = name;

    if (player.game) {
      io.to(player.game).emit('player_name_update_success', socket.id, name);
    }

    devlog(`Player ${player} changed their name.`);
  });

  socket.on('game_create_request', ({title, pairs, playerLimit}) => {
    deleteGame(socket);
    title = String(title);
    pairs = parseInt(pairs);
    playerLimit = parseInt(playerLimit);

    if (emptyString(title) || outOfRange(pairs, 1, 52) || outOfRange(playerLimit, 1, 4)) {
      io.to(socket.id).emit('game_create_status', null);
    }
    else {
      let timestamp = Date.now();
      let game = new Game(socket.id, timestamp, title, pairs, playerLimit);
      games[socket.id] = game;
      io.to(socket.id).emit('game_create_status', timestamp);
      io.to(LOBBY).emit('game_list_game_create', game.publicInfo);
      devlog(`Game   ${game} created.`);
    }
  });

  socket.on('game_join_request', (manager, timestamp) => {
    manager = String(manager);
    timestamp = parseInt(timestamp);
    let game = games[manager];
    let info = game && game.add(player, timestamp);
    io.to(socket.id).emit('game_join_status', info);

    if (info) {
      io.to(LOBBY).emit('game_list_game_join', game.id);
      devlog(`Player ${player} joined ${game}.`);
    }
  });

  socket.on('game_leave', () => {
    leaveGame(socket);
  });

  socket.on('lobby_join', () => {
    io.to(socket.id).emit('game_list_get',
      Object.values(games)
        .filter(game => !game.playing)
        .map(game => game.publicInfo));

    socket.join(LOBBY);
  });

  socket.on('lobby_leave', () => {
    socket.leave(LOBBY);
  });

  socket.on('ready_toggle_request', () => {
    if (!player.game) {
      return;
    }

    let game = games[player.manager];

    if (player.isAManager) {
      let deckImageSeed = game.start();

      if (!deckImageSeed) {
        return;
      }

      io.to(game.id).emit('game_start', deckImageSeed);
    }
    else {
      if (game) {
        game.toggleReady(player)
        io.to(game.id).emit('ready_toggle_status', player.id);
      }
    }
  });

  socket.on('card_flip_request', (deckIndex) => {
    if (!player.game) {
      return;
    }

    deckIndex = parseInt(deckIndex);
    let game = games[player.manager];
    io.to(game.id).emit('card_flip_status', game.flip(player, deckIndex));
  });

  socket.on('disconnect', () => {
    leaveGame(socket);
    delete players[socket.id];
    devlog(`Player ${player} disconnected.`);
  });
});
