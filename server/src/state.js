const Player = require('./player');
const Game = require('./game')
const devlog = require('./devlog');

module.exports = class State {
  constructor(io, lobby) {
    this.io = io;
    this.lobby = lobby;
    this.players = {};
    this.games = {};
  }

  newPlayer(socket) {
    const player = new Player(socket);
    this.players[socket.id] = player;
    devlog(`Player ${player} connected.`);
    return player;
  }

  deletePlayer(player) {
    this.leaveGame(player.socket);
    devlog(`Player ${player} disconnected.`);
  }

  newGame(socket, title, pairs, playerLimit) {
    const timestamp = Date.now();
    const game = new Game(socket.id, timestamp, title, pairs, playerLimit);
    this.games[socket.id] = game;
    this.io.to(socket.id).emit('new_game_status', timestamp);
    this.io.to(this.lobby).emit('new_game_list_item', game.publicInfo);
    devlog(`Game   ${game} created.`);
  }

  deleteGame(socket) {
    let game = this.games[socket.id];

    if (game) {
      delete this.games[socket.id];
      this.io.to(this.lobby).emit('delete_game_list_item', game.id);
      devlog(`Game   ${game} deleted.`);
    }
  }

  leaveGame(socket) {
    let player = this.players[socket.id];

    if (player.isAManager) {
      player.emit('player_leave', socket.id);
      this.deleteGame(socket);
    }
    else if (player.manager) {
      let game = this.games[player.manager];

      if (game) {
        game.delete(player);
        this.io.to(this.lobby).emit('decrement_game_list_item_player_count', game.id);
        devlog(`Player ${player} left ${game}.`);
      }
    }
    else {
      this.deleteGame(socket);
    }

    player.leave();
  }
};
