const TelnetConnector = require('./lib/connector');

module.exports.bindWebsocketHandlers = (socket) => {
  socket.on('connection.open', (data) => {
    if (data.payload && data.payload.connection) {
      const connection = data.payload.connection;
      console.log('Connection request, connecting to...', connection);

      const Connector = new TelnetConnector(connection, socket);
      Connector.connect();
    } else {
      console.error('No data received for server connection...');
    }
  });
};
