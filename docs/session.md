# Session Handlers

#### `connection.open: {context: PUSH, payload: { uuid, host, port, name }}`
Opens a new Telnet connection. It should be requested from a telnet server in round-robin (see: PUSH)
```
// server.js
const sub = context.socket('PULL');
sub.connect('connection.open', (data) => {
  // Connection handler
});

// client.js
const pub = context.socket('PUSH');
put.connect('connection.open');

```

#### Handler: `connection.close: {context: PUSH, payload: { uuid }}`