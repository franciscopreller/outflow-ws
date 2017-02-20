const _ = require('lodash');
const net = require('net');
const UUID = require('uuid/v4');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const EventEmitter = require('events').EventEmitter;
const ansiHTML = require('./ansiHtml');

class Connector {
    constructor(connection, socket) {
        this.socket = socket;
        this.host   = connection.host;
        this.port   = connection.port;
        this.uuid   = connection.uuid;
        this.input  = new TelnetInput();
        this.output = new TelnetOutput();
        this.data   = '';
        this.conn   = null;
        this.connected = false;

        // Bindings
        this.bindOutputProcessing();
        this.bindCommandHandler();
        this.bindConnectionBinding();
    }
    connect(callback) {
        this.conn = net.createConnection(this.port, this.host, (err) => {
            if (err) {
                return callback(err, null);
            }

            // Bind IO
            this.conn.pipe(this.input);
            this.output.pipe(this.conn);

            callback(null, {
                host: this.host,
                port: this.port,
                uuid: this.uuid,
            });
        });
    }
    bindCommandHandler() {
        this.socket.on(`server.command.${this.uuid}`, (data) => {
            console.log('Received command for server:', data.command);
            this.processCommand(data.command);
        });
    }
    bindOutputProcessing() {
        this.input.on('data', (data) => {
            this.processOutput(data);
        });
    }
    bindConnectionBinding() {
        this.socket.on(`server.connected.${this.uuid}`, () => {
            console.log(`Client connected to ${this.host}...`);
            this.connected = true;
            // If we have data in cache after connecting, send it
            if (this.data !== '') {
                this.sendOutput(this.data);
                this.data = '';
            }
        });
    }
    sendOutput(output) {
        const text = ansiHTML.parse(output.toString());
        const emitString = `server.output.${this.uuid}`;

        console.log(`Emitting data to ${this.host}: ${emitString}`);
        console.log(output.toString());
        this.socket.emit('server.output', { text, uuid: this.uuid });
    }
    processOutput(output) {
        // Output to client
        if (!this.connected || this.data !== '') {
            console.log(`${this.host} received but not connected, caching...`);
            this.data += output;
        } else {
            this.sendOutput(output)
        }
    }
    processCommand(command) {
        this.output.write(command + '\n');
    }
}
module.exports = Connector;
