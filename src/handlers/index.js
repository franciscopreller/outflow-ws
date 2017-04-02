const handlerGlobs = require('glob').sync(`${__dirname}/*/index.js`);

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

function subscriberHandler(socket) {
  return (data) => {
    try {
      const payload = JSON.parse(data);
      socket.emit('ws.message', payload);
    } catch (error) {
      console.error('Could not parse JSON in subscriberHandler');
    }
  };
}

/**
 * Generic message handler
 *
 * @param socket
 * @param context
 * @returns {function(*)}
 */
function messageHandler(socket, context) {
  return (data) => {
    let msg = {};
    try {
      msg = Object.assign({}, JSON.parse(data));
    } catch (err) {}

    // if the message is marked as an event which has middleware, use that middleware handler
    if (msg.event && msg.event.charAt(0) !== '#') {
      if (handlers && handlers[msg.event]) {
        handlers[msg.event](socket, context, msg.data);
      }

      // Send the connection request to the telnet server
      const pub = context.socket('PUSH');
      pub.connect(msg.event, () => {
        pub.write(JSON.stringify(msg.data.payload), 'utf-8');
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
  const connectionObj = {};
  redis.set(`connection.${socketId}`, JSON.stringify(connectionObj)).then(() => {
    console.log(`User connected from socket ${socketId}`);
  }).catch((error) => {
    console.error('Could not create connection in cache', error);
  });

}

/**
 * Handles all socket disconnections
 *
 * @param redis
 * @param socketId
 * @returns {function()}
 */
function disconnectHandler(redis, socketId) {
  return () => {
    redis.del(`connection.${socketId}`).then(() => {
      console.log(`User disconnected from socket ${socketId}`);
    }).catch((error) => {
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
