const TelnetConnector = require('./lib/connector');

module.exports.bindWebsocketHandlers = (io) => {
    io.on('connection', (socket) => {
        socket.on('server.connect', (connection, callback) => {
            if (connection) {
                console.log('Connection request, connecting to...', connection);

                const Connector = new TelnetConnector(connection, socket);
                Connector.connect(callback);
            } else {
                console.error('No data received for server connection...');
            }
        });
    });
};
