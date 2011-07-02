var O = require('kuya-O'),
    context = require('./context-client'),
    parser = require('./command_parser'),
    remote_command = require('./remote_command_jquery'),
    $ = require('jquery-browserify');

var remote = null,
    ctx = null,
    ready = $.Deferred();

DNode.connect(function (in_remote) {
    remote = window.remote = in_remote;

    ready.resolve();

    remote.context.create(function(in_ctx) {
        ctx = window.ctx = in_ctx;
    });
});

function parse(input) { 
    var commands = parser.parse(input);
    return commands[0];
}

function execute(input, cb) { 
    var command = parse(input).command;
    ctx.execute(command, cb);
}

window.p = parse;
window.e = execute;

