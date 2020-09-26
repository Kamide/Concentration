module.exports = function(io, socket) {
  socket.on('update_player_name', (name) => {
    name = String(name);
    player.name = name;

    if (player.game) {
      io.to(player.game).emit('update_player_name_success', socket.id, name);
    }

    devlog(`Player ${player} changed their name.`);
  });
};
