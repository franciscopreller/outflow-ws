const TelnetConnector = require('./lib/connector');

module.exports.bindWebsocketHandlers = (socket) => {
  socket.on('open.connection', (data, callback) => {
    if (data.payload && data.payload.connection) {
      const connection = data.payload.connection;
      console.log('Connection request, connecting to...', connection);

      const Connector = new TelnetConnector(connection, socket);
      Connector.connect(callback);
    } else {
      console.error('No data received for server connection...');
    }
  });
};
