const _ = require('lodash');
const net = require('net');
const UUID = require('uuid/v4');
const TelnetInput = require('telnet-stream').TelnetInput;
const TelnetOutput = require('telnet-stream').TelnetOutput;
const EventEmitter = require('events').EventEmitter;
const ansiHTML = require('./ansiHtml');
const fs = require('fs');

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
        this.timestamp = Date.now();

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
        this.logOutputToFile(output.toString());
        const lines = ansiHTML.toLineObjects({ str: output.toString() });
        const emitString = `server.output.${this.uuid}`;

        this.socket.emit('server.output', { lines, uuid: this.uuid });
    }
    processOutput(output) {
        if (!this.connected || this.data !== '') {
            this.data += output;
        } else {
            this.sendOutput(output)
        }
    }
    processCommand(command) {
        this.output.write(command + '\n');
    }
    logOutputToFile(output) {
        const fileName = `outflow_${this.host}_${this.timestamp}.log`;
        const file = `${global.logPath}/${fileName}`;
        fs.open(file, 'a+', (err, fd) => {
            console.log('Logging to file:', file);
            if (err) {
                console.error(`Could not open file ${file}:`, err.message);
            } else {
                fs.write(fd, output, { encoding: 'utf8' }, (err) => {
                    if (err) {
                        console.error(`Could not write to file ${file}`, err.message);
                    } else {
                        console.log('Logged successful');
                    }
                });
            }
        });
    }
}
module.exports = Connector;
