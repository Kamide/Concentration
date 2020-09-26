module.exports = function(io, socket, state) {
  socket.on('join_lobby', () => {
    io.to(socket.id).emit('get_game_list',
      Object.values(state.games)
        .filter(game => !game.playing)
        .map(game => game.publicInfo));

    socket.join(state.lobby);
  });

  socket.on('leave_lobby', () => {
    socket.leave(state.lobby);
  });
};
