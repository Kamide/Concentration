const { emptyString } = require('../invalidators');
const devlog = require('../devlog');

module.exports = function(io, socket, player) {
  socket.on('update_player_name', (name) => {
    name = String(name);
    player.name = name;

    if (player.game) {
      io.to(player.game).emit('update_player_name_success', socket.id, name);
    }

    devlog(`Player ${player} changed their name.`);
  });

  socket.on('send_message', (message) => {
    message = String(message);

    if (!emptyString(message) && player.game) {
      io.to(player.game).emit('receive_message', {
        from: socket.id,
        text: message.trim()
      });
    }
  });
};
