const constants = require('./constants');

module.exports = {

  [constants.SESSION_CONNECT]: (sub, context, data) => {
    // Validate payload
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const { uuid } = data.payload.connection;
      const subscriberNames = constants.SESSION_CONNECT_LISTENERS.map(l => `${l}.${uuid}`);
      const pub = context.socket('PUSH');

      // Connect to all subscriber routes unique to this session
      subscriberNames.forEach((queue) => {
        sub.connect(queue, () => {
          console.log(`Subscribing to queue: ${queue}`);
        });
      });

      // Send the connection request to the telnet server
      pub.connect(constants.SESSION_CONNECT, () => {
        console.log('Sending to session.connect', JSON.stringify(data.payload));
        pub.write(JSON.stringify(data.payload), 'utf-8');
      });
    } else {
      console.error('No data received for server connection...');
    }
  }

};
