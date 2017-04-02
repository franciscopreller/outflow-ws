const constants = require('./constants');
const Handlers = require('../index');
<<<<<<< HEAD
const utils = require('../utils');
=======
>>>>>>> 6f8aeb2a51674dd88ec36c269d956b766de9677b

module.exports = {

  /**
   * Connects the main session listener when it receives a SESSION_CONNECT event
   *
<<<<<<< HEAD
   * @param redis
=======
>>>>>>> 6f8aeb2a51674dd88ec36c269d956b766de9677b
   * @param socket
   * @param context
   * @param data
   */
<<<<<<< HEAD
  [constants.SESSION_CONNECT]: (redis, socket, context, data) => {
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const { uuid } = data.payload.connection;
      const queueName = `${constants.SESSION_LISTENER}.${uuid}`;

      // Add subscriber handler
      utils.getUserIdFromSocketId(redis, socket.id).then((userId) => {
        Handlers.subscriberHandler(queueName, userId, redis, context, socket);
      });
=======
  [constants.SESSION_CONNECT]: (socket, context, data) => {
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const sub = context.socket('PULL');
      const { uuid } = data.payload.connection;

      // Add data subscriber
      sub.on('data', Handlers.subscriberHandler(socket));

      // Connect to session listener
      sub.connect(`${constants.SESSION_LISTENER}.${uuid}`);
>>>>>>> 6f8aeb2a51674dd88ec36c269d956b766de9677b
    } else {
      console.error('No data received for server connection...');
    }
  }

};
