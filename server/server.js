const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

const server = app.listen(port, () => {
  console.log(`[Express] Server listening on port ${port}.`);
});

const io = SocketIO(server);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Player ${socket.id} has connected.`)
});
