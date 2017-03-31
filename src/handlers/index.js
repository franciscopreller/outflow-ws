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
      console.log(`(${socket.id}) Got data funneled into subscriber`, payload);
      socket.emit('ws.message', payload);
    } catch (error) {
      console.error('Could not parse JSON in subscriberHandler');
    }
  };
}

/**
 * Generic message handler
 *
 * @param socketId
 * @param sub
 * @param context
 * @returns {function(*)}
 */
function messageHandler(socketId, sub, context) {
  return (data) => {
    let msg = {};
    try {
      msg = Object.assign({}, JSON.parse(data));
      console.log(`(${socketId}) Processing message:`, msg);
    } catch (err) {}

    // if the message is marked as an event
    if (msg.event && handlers && handlers[msg.event]) {
      console.log(`Invoking method: ${msg.event} with data:`, msg.data);
      handlers[msg.event](sub, context, msg.data);
    }
  }
}

/**
 * Handles all new socket connections
 *
 * @param socketId
 */
function handleConnection(socketId) {
  console.log(`User connected from socket ${socketId}`);
}

/**
 * Handles all socket disconnections
 *
 * @param socketId
 * @returns {function()}
 */
function disconnectHandler(socketId) {
  return () => {
    console.log(`User disconnected from socket ${socketId}`);
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