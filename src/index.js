// const express = require('express');
// const app = express();
// const server = require('http').createServer(app);
const PORT = 8080;
const PATH = '/ws';
const WebSocket = require('ws');
const server = require('http').createServer((request, response) => {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.write("Welcome to Outflow!\n\n");
  response.end("Thanks for visiting us! \n");
});
server.listen(PORT, '0.0.0.0', () => {
  console.log((new Date()) + ' Server is listening on port 8080');
});

const wss = new WebSocket.Server({ server, path: PATH, autoAcceptConnections: false });
console.log(`Etablishing websocket connection on port '${PORT}' on path '${PATH}'`);
wss.on('connection', (ws) => {
  console.log('connection established', ws);
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });
});
wss.on('error', (error) => {
  console.error('Error with socket connection', error);
});

// server.listen(8080, () => {
//   console.log('Listening on %d', server.address().port);
// });
