const { emptyString, outOfRange } = require('../invalidators')
const devlog = require('../devlog');

module.exports = function(io, socket, state, player) {
  socket.on('new_game', ({title, pairs, playerLimit}) => {
    state.deleteGame(socket);
    title = String(title);
    pairs = parseInt(pairs);
    playerLimit = parseInt(playerLimit);

    if (Number.isNaN(pairs) || Number.isNaN(playerLimit) || emptyString(title) || outOfRange(pairs, 1, 52) || outOfRange(playerLimit, 1, 4)) {
      io.to(socket.id).emit('new_game_status', null);
      return;
    }

    state.newGame(socket, title, pairs, playerLimit);
  });

  socket.on('join_game', (manager, timestamp) => {
    manager = String(manager);
    timestamp = parseInt(timestamp);
    let game = state.games[manager];
    let info = game && game.add(player, timestamp);
    io.to(socket.id).emit('join_game_status', info);

    if (info) {
      io.to(state.lobby).emit('increment_game_list_item_player_count', game.id);
      devlog(`Player ${player} joined ${game}.`);
    }
  });

  socket.on('leave_game', () => {
    state.leaveGame(socket);
  });

  socket.on('toggle_ready', () => {
    if (!player.game) {
      return;
    }

    let game = state.games[player.manager];

    if (player.isAManager) {
      const deckImageSeed = game.start();

      if (!deckImageSeed) {
        return;
      }

      io.to(game.id).emit('start_game', deckImageSeed);
      io.to(state.lobby).emit('delete_game_list_item', game.id);
    }
    else {
      if (game) {
        game.toggleReady(player)
        io.to(game.id).emit('toggle_ready_status', player.id);
      }
    }
  });

  socket.on('flip_card', (deckIndex) => {
    if (!player.game) {
      return;
    }

    deckIndex = parseInt(deckIndex);
    let game = state.games[player.manager];
    io.to(game.id).emit('flip_card_status', game.flip(player, deckIndex));
  });

  socket.on('reset_game', () => {
    if (!player.game) {
      return;
    }

    let game = state.games[player.manager];
    game.reset();
    io.to(game.id).emit('reset_game_success');
    io.to(state.lobby).emit('new_game_list_item', game.publicInfo);
  });
};
