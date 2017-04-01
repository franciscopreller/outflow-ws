const constants = require('./constants');
const Handlers = require('../index');

module.exports = {

  /**
   * Connects the main session listener when it receives a SESSION_CONNECT event
   *
   * @param socket
   * @param context
   * @param data
   */
  [constants.SESSION_CONNECT]: (socket, context, data) => {
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const sub = context.socket('PULL');
      const { uuid } = data.payload.connection;

      // Add data subscriber
      sub.on('data', Handlers.subscriberHandler(socket));

      // Connect to session listener
      sub.connect(`${constants.SESSION_LISTENER}.${uuid}`);
    } else {
      console.error('No data received for server connection...');
    }
  }

};
