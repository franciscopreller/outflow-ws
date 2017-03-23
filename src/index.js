const PORT = process.env.PORT || 8080;
const PATH = '/ws';
const SocketCluster = require('socketcluster').SocketCluster;

// Start SocketCluster Server
const socketCluster = new SocketCluster({
  workers: 1,
  brokers: 1,
  port: PORT,
  path: PATH,
  appName: 'outflow',
  wsEngine: 'uws',
  perMessageDeflate: true,

  /* A JS file which you can use to configure each of your
   * workers/servers - This is where most of your backend code should go
   */
  workerController: __dirname + '/worker.js',

  /* JS file which you can use to configure each of your
   * brokers - Useful for scaling horizontally across multiple machines (optional)
   */
  brokerController: __dirname + '/broker.js',

  // Whether or not to reboot the worker in case it crashes (defaults to true)
  rebootWorkerOnCrash: true
});

socketCluster.on('workerMessage', (id, data) => {
  console.log('Message received from worker', {
    id,
    data,
  });
});
