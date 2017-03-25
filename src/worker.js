const express = require('express');
const path = require('path');
const healthChecker = require('sc-framework-health-check');
const events = require('./events');

module.exports.run = (worker) => {
  console.log('   >> Worker PID:', process.pid);
  const app = express();
  const httpServer = worker.httpServer;
  const scServer = worker.scServer;

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  // Attach app to httpServer
  httpServer.on('request', app);

  /*
   In here we handle our incoming realtime connections and listen for events.
   */
  scServer.on('connection', (socket) => {
    console.log(`User connected from socket ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`User disconnected from socket ${socket.id}`);
    });

    // Bind other events
    events.bindHandlers(socket);
  });
};
