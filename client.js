var O = require('kuya-O'),
    context = require('./context-client'),
    parser = require('./command_parser'),
    remote_command = require('./remote_command_jquery'),
    $ = require('jquery-browserify');

window.pa = parser;

var ctx = null;

DNode.connect(function (remote) {
    console.log('connected to remote', remote);
    window.remote = remote;
    remote.context_foo(function(in_ctx) {
        console.log('got context', in_ctx);
        window.ctx = ctx = in_ctx;
    });
});


/*
var socket = io.connect('http://localhost');
window.s = socket;
socket.on('connect', function () {
    if( ctx === null ) socket.emit('createcontext');
    else ctx.socket = socket;
});
socket.on('createcontext/reply', function(in_ctx) { 
    ctx = O.inflate(in_ctx);
    ctx.socket = socket;
    window.ctx = ctx;
});
*/

/*
$.ajaxSetup({dataType: 'json'});

$.ajax('/context/new', {

    })
    .success(function(ret) {
        window.context = O.inflate(ret);
    })
;
*/

//console.log('systems are go');

