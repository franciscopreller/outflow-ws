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
        this.host = connection.host;
        this.port = connection.port;
        this.uuid = connection.uuid;
        this.input = new TelnetInput();
        this.output = new TelnetOutput();
        this.data = '';
        this.buffer = '';
        this.conn = null;
        this.connected = false;
        this.timestamp = Date.now();

        // Bindings
        this.bindOutputProcessing();
        this.bindCommandHandler();
        this.bindConnectionBinding();
    }
    connect(callback) {
        this.conn = net
            .createConnection(this.port, this.host, (err) => {
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

        this.conn.on('close', () => {
            console.log(`(${this.host}) lost connection...`);
            this.conn.unpipe(this.input);
            this.output.unpipe(this.conn);
        });
        this.conn.on('error', (err) => {
            console.log('Connection error', err);
        });
    }
    bindCommandHandler() {
        this.socket.on(`server.command.${this.uuid}`, (data) => {
            this.processCommand(data.command);
        });
    }
    bindOutputProcessing() {
        this.input.on('data', (data) => {
            // Buffer output until last character is a carriege return
            this.buffer += data;
            const lastChar = data[data.length - 1];
            if (lastChar === 32 && !(data[data.length - 2] && data[data.length - 2] === 32)) {
                this.processOutput(this.buffer);
                this.buffer = '';
            }
        });
        this.input.on('command', (command) => {
            // Received: IAC <command> - See RFC 854
            console.log(`(${this.host}) got command:`, command);
        });
        this.input.on('do', (option) => {
            // Received: IAC DO <option> - See RFC 854
            console.log(`(${this.host}) got do:`, option);
        });
        this.input.on('dont', (option) => {
            // Received: IAC DONT <option> - See RFC 854
            console.log(`(${this.host}) got dont:`, option);
        });
        this.input.on('sub', (option, buffer) => {
            // Received: IAC SB <option> <buffer> IAC SE - See RFC 855
            console.log(`(${this.host}) got sub:`, option, buffer);
        });
        this.input.on('will', (option) => {
            // Received: IAC WILL <option> - See RFC 854
            console.log(`(${this.host}) got will:`, option);
        });
        this.input.on('wont', (option) => {
            // Received: IAC WONT <option> - See RFC 854
            console.log(`(${this.host}) got wont:`, option);
        });
    }
    bindConnectionBinding() {
        this.socket.on(`server.connected.${this.uuid}`, () => {
            console.log(`(${this.host}) connected...`);
            this.connected = true;
            // If we have data in cache after connecting, send it
            if (this.data !== '') {
                this.sendOutput(this.data);
                this.data = '';
            }
        });
    }
    sendOutput(output) {
        const lines = ansiHTML.toLineObjects({ str: output.toString() });
        const emitString = `server.output.${this.uuid}`;
        this.socket.emit('server.output', { lines, uuid: this.uuid });
    }
    processOutput(output) {
        if (!this.connected || this.data !== '') {
            this.data += output;
        } else {
            this.logOutputToFile(output.toString());
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
            if (err) {
                console.error(`Could not open file ${file}:`, err.message);
            } else {
                fs.write(fd, output, { encoding: 'utf8' }, (err) => {
                    if (err) {
                        console.error(`Could not write to file ${file}`, err.message);
                    }
                });
            }
        });
    }
}
module.exports = Connector;
