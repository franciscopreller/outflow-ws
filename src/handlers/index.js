const handlerGlobs = require('glob').sync(`${__dirname}/*/index.js`);
const utils = require('./utils');

/**
 * Gets all handler namespaces
 */
const handlerNamespaces = handlerGlobs.map((globStr) => globStr.replace(`${__dirname}/`, '').replace('/index.js', ''));

/**
 * Gets all handlers names in sub-directories
 */
const handlerNames = getHandlerNames();

/**
 * Gets all handlers, flattened
 */
const handlers = getHandlers();

/**
 * Adds a queue injected by the subscriberHandler into cache
 *
 * @param queueName
 * @param userId
 * @param redis
 */
function addQueueToCache(queueName, userId, redis) {
  redis.get(`queues.${userId}`).then((results) => {
    const queues = JSON.parse(results) || [];
    const queueExists = queues.includes(queueName);
    if (!queueExists) {
      queues.push(queueName);
      redis.set(`queues.${userId}`, JSON.stringify(queues));
    }
  });
}

/**
 * Sets the subscriber handler
 *
 * @param queueName
 * @param userId
 * @param redis
 * @param context
 * @param socket
 */
function subscriberHandler(queueName, userId, redis, context, socket) {
  const sub = context.socket('PULL');
  sub.on('data', (data) => {
    try {
      const payload = JSON.parse(data);
      socket.emit('ws.message', payload);
    } catch (error) {
      console.error('Could not parse JSON in subscriberHandler:', {
        error,
        queueName,
      });
    }
  });
  sub.connect(queueName);
  addQueueToCache(queueName, userId, redis);
}

/**
 * Generic message handler
 *
 * @param redis
 * @param socket
 * @param context
 * @returns {function(*)}
 */
function messageHandler(redis, socket, context) {
  return (data) => {
    let msg = {};
    try {
      msg = Object.assign({}, JSON.parse(data));
    } catch (err) {}

    // if the message is marked as an event which has middleware, use that middleware handler
    if (msg.event && msg.event.charAt(0) !== '#') {
      if (handlers && handlers[msg.event]) {
        handlers[msg.event](redis, socket, context, msg.data);
      }

      // Send the connection request to the telnet server
      const pub = context.socket('PUSH');
      pub.connect(msg.event, () => {
        pub.write(JSON.stringify(msg.data.payload), 'utf-8');
        pub.end();
      });
    }
  };
}

/**
 * Handles all new socket connection
 *
 * @param redis
 * @param socketId
 */
function handleConnection(redis, socketId) {
  utils.setUserIdFromSocketId(redis, '#', socketId).then(() => {
    console.log(`User connected from socket ${socketId}`);
  }).catch((error) => {
    console.error('Could not create connection in cache', error);
  });
}

/**
 * Handles all socket disconnections
 *
 * @param redis
 * @param socket
 * @param context
 * @returns {function()}
 */
function disconnectHandler(redis, socket, context) {
  return () => {
    utils.getUserIdFromSocketId(redis, socket.id)
      .then((userId) => utils.removeQueuesForUser(redis, context, userId))
      .then(() => utils.deleteUserIdFromSocketId(redis, socket.id))
      .then(() => console.log(`User disconnected from socket ${socket.id}`))
      .catch((error) => {
        console.error('Could not remove connection from cache', error);
      });
  };
}

/**
 * Get all the handlers from sub-directories recursively, a duplicate key across directories will cause a fatal error
 */
function getHandlers() {
  const output = {};
  handlerNamespaces.forEach((key) => {
    const handler = require(`./${key}`);
    Object.keys(handler).forEach((handlerKey) => {
      if (typeof output[handlerKey] !== 'undefined') {
        console.error(`Key already defined: ${handlerKey}, must be unique`);
        process.exit(1);
      } else {
        output[handlerKey] = handler[handlerKey];
      }
    });
  });

  return output;
}

/**
 * Gets all handler names
 * @returns {Array}
 */
function getHandlerNames() {
  const handlerNames = [];
  handlerNamespaces.forEach((namespace) => {
    Object.keys(require(`./${namespace}`)).forEach((key) => {
      handlerNames.push(key);
    });
  });

  return handlerNames;
}

exports.handlers = handlers;
exports.handlerNames = handlerNames;
exports.messageHandler = messageHandler;
exports.handleConnection = handleConnection;
exports.disconnectHandler = disconnectHandler;
exports.subscriberHandler = subscriberHandler;
