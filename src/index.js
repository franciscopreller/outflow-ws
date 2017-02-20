const express   = require('express');
const socket    = require('socket.io');
const app       = express();
const server    = require('http').createServer(app);
const io        = socket.listen(server);
const WebSocket = require('./socket');

// Start websocket server
WebSocket.bindWebsocketHandlers(io);
server.listen(80, () => {
    console.log(`Websocket server listening...`);
});
