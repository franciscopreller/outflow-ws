const RABBIT_URL = process.env.RABBIT_URL || 'amqp://rabbitoutflow:unsafepassword@rabbitmq';
const REDIS_URL = process.env.REDIS_URL || 'redis://:unsafepassword@redis:6380/0';
const express = require('express');
const path = require('path');
const healthChecker = require('sc-framework-health-check');
const context = new require('rabbit.js').createContext(RABBIT_URL);
const Handlers = require('./handlers');
const Redis = require('ioredis');

module.exports.run = (worker) => {
  console.log('   >> Worker PID:', process.pid);
  const app = express();
  const httpServer = worker.httpServer;
  const scServer = worker.scServer;
  const redis = new Redis(REDIS_URL);

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  // Attach app to httpServer
  httpServer.on('request', app);

  // Handle real-time connection and listen for events
  scServer.on('connection', (socket) => {
    const socketId = socket.id;
    Handlers.handleConnection(redis, socketId);

    // Socket bindings
    socket.on('disconnect', Handlers.disconnectHandler(redis, socket, context));
    socket.on('message', Handlers.messageHandler(redis, socket, context));
  });
};
