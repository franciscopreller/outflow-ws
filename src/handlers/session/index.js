const constants = require('./constants');
const Handlers = require('../index');
const utils = require('../utils');

module.exports = {

  /**
   * Connects the main session listener when it receives a SESSION_CONNECT event
   *
   * @param redis
   * @param socket
   * @param context
   * @param data
   */
  [constants.SESSION_CONNECT]: (redis, socket, context, data) => {
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const { uuid } = data.payload.connection;
      const queueName = `${constants.SESSION_LISTENER}.${uuid}`;

      // Add subscriber handler
      utils.getUserIdFromSocketId(redis, socket.id).then((userId) => {
        Handlers.subscriberHandler(queueName, userId, redis, context, socket);
      });
    } else {
      console.error('No data received for server connection...');
    }
  }

};
