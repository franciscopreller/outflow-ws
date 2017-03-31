const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const express = require('express');
const path = require('path');
const healthChecker = require('sc-framework-health-check');
const context = new require('rabbit.js').createContext(RABBIT_URL);
const Handlers = require('./handlers');

module.exports.run = (worker) => {
  console.log('   >> Worker PID:', process.pid);
  const app = express();
  const httpServer = worker.httpServer;
  const scServer = worker.scServer;

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  // Attach app to httpServer
  httpServer.on('request', app);

  // Handle real-time connections and listen for events
  scServer.on('connection', (socket) => {
    const socketId = socket.id;
    const sub = context.socket('SUB');
    Handlers.handleConnection(socketId);
    sub.on('data', Handlers.subscriberHandler(socket));

    // Socket bindings
    socket.on('disconnect', Handlers.disconnectHandler(socketId));
    socket.on('message', Handlers.messageHandler(socketId, sub, context));
  });
};
