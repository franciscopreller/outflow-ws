const constants = require('./constants');
const Handlers = require('../index');

module.exports = {

  /**
   * Connects the main session listener when it receives a SESSION_CONNECT event
   *
   * @param redis
   * @param socket
   * @param context
   * @param data
   */
  [constants.AUTH_WS_UPDATE]: (redis, socket, context, data) => {
    if (data.payload && data.payload.uuid) {
      const { uuid } = data.payload;

      // Connect to session listener
      const queueName = `${constants.AUTH_LISTENER}.${uuid}`;
      Handlers.subscriberHandler(queueName, uuid, redis, context, socket);

      // Attach socket ID to the payload
      data.payload.socketId = socket.id;
    } else {
      console.error('No data received for server connection...');
    }
  }

};
