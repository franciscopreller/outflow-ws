const handlerGlobs = require('glob').sync(`${__dirname}/*/index.js`);
const handlers = getHandlers();

exports.handlers = handlers;

exports.handlerNames = handlerGlobs.map((fullName) => {
  return fullName.replace(`${__dirname}/`, '').replace('/index.js', '');
});

exports.messageHandler = (socket, context) => (data) => {
  let msg = {};
  try {
    msg = Object.assign({}, JSON.parse(message));
  } catch (err) {}

  // if the message is marked as an event
  if (msg.event && exports.handlers[msg.event]) {
    console.log(`Invoking method: ${msg.event} with data:`, msg.data);
    exports.handlers[msg.event](socket, context, msg.data); 
  }
};

function getHandlers() {
  const output = {};
  exports.handlerNames.forEach((key) => {
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
}
