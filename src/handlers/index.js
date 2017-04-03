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
 * Sets the subscriber handler
 *
 * @param socket
 * @param sub
 */
function handleSubscriber(socket, sub) {
  const queueName = `ws.reply.${socket.id}`;
  sub.on('data', (data) => {
    try {
      const payload = JSON.parse(data);
      socket.emit('ws.message', payload);
    } catch (error) {
      console.error('Could not parse JSON in handleSubscriber:', {
        error,
        queueName,
      });
    }
  });
  sub.connect(queueName);
}

/**
 * Generic message handler
 *
 * @param socket
 * @param redis
 * @param context
 * @returns {function(*)}
 */
function messageHandler(socket, redis, context) {
  return (message) => {
    // Avoid special messages
    if (message.charAt(0) === '#') return;
    let msg = {};
    try {
      msg = JSON.parse(message.toString());
    } catch (err) {
      console.error(err);
    }

    // if the message is marked as an event which has middleware, use that middleware handler
    if (msg.event && msg.event.charAt(0) !== '#') {
      utils.getUserIdFromSocketId(redis, socket.id).then((userId) => {
        const data = Object.assign({}, {
          payload: msg.data.payload,
          socketId: socket.id,
          userId,
        });

        const pub = context.socket('PUSH');
        pub.connect(msg.event, () => {
            pub.write(JSON.stringify(data), 'utf8');
            pub.close();
        });
      });
    }
  };
}

/**
 * Handles all new socket connection
 *
 * @param socket
 * @param redis
 */
function handleConnection(socket, redis) {
  utils.setUserIdFromSocketId(redis, '#', socket.id).then(() => {
    console.log(`User connected from socket ${socket.id}`);
  }).catch((error) => {
    console.error('Could not create connection in cache', error);
  });
}

/**
 * Handles all socket disconnections
 *
 * @param context
 * @param socket
 * @param redis
 * @param sub
 * @returns {function()}
 */
function disconnectHandler(context, socket, redis, sub) {
  return () => utils.getUserIdFromSocketId(redis, socket.id)
    .then((userId) => utils.requestUserCleanup(context, userId))
    .then(() => utils.deleteUserIdFromSocketId(redis, socket.id))
    .catch((error) => console.error('Could not remove connection from cache', error))
    .then(() => {
      console.log(`User disconnected from socket ${socket.id}`);
      if (sub) sub.close();
    });
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
exports.handleSubscriber = handleSubscriber;
