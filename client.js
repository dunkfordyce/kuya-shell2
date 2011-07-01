var O = require('kuya-O'),
    context = require('./context-client'),
    parser = require('./command_parser'),
    remote_command = require('./remote_command_jquery'),
    $ = require('jquery-browserify');

window.pa = parser;

var socket = io.connect('http://localhost');
window.s = socket;
socket.on('connect', function () {
    socket.emit('createcontext');
});
socket.on('createcontext/reply', function(ctx) { 
    ctx = O.inflate(ctx);
    ctx.socket = socket;
    window.ctx = ctx;
});

$.ajaxSetup({dataType: 'json'});

/*
$.ajax('/context/new', {

    })
    .success(function(ret) {
        window.context = O.inflate(ret);
    })
;
*/

//console.log('systems are go');

