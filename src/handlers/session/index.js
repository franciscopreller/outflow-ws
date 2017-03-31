module.exports = {

  ['session.connect']: (socket, context, data) => {
    // Validate payload
    if (data.payload && data.payload.connection && data.payload.connection.uuid) {
      const { uuid } = data.payload.connection;
      const subscriberNames = [
        `connection.opened.${uuid}`,
        `connection.data.${uuid}`,
        `connection.closed.${uuid}`,
      ];
      const pub = context.socket('PUSH');
      const sub = context.socket('SUB');

      // Connect to all subscriber routes unique to this session
      subscriberNames.forEach((queue) => {
        sub.connect(queue, () => {
          console.log(`Subscribing to queue: ${queue}`);
        });
      });

      // Send the connection request to the telnet server
      pub.connect('session.connect', () => {
        console.log('Sending to session.connect', JSON.stringify(data.payload));
        pub.write(JSON.stringify(data.payload), 'utf-8');
      });
    } else {
      console.error('No data received for server connection...');
    }
  }

};
