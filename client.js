var O = require('kuya-O'),
    context = require('./context-client'),
    parser = require('./command_parser'),
    remote_command = require('./remote_command_jquery'),
    $ = require('jquery-browserify');

window.pa = parser;

var ctx = null;

var socket = io.connect('http://localhost');
window.s = socket;
socket.on('connect', function () {
    if( ctx === null ) {
        socket.emit('context/create', function(ctx) { 
            window.ctx = O.inflate(ctx);
            window.ctx.socket = socket;
        });
    } else {
        ctx.socket = socket;
    }
});

/*
$.ajaxSetup({dataType: 'json'});

$.ajax('/context/new', {

    })
    .success(function(ret) {
        window.context = O.inflate(ret);
    })
;
*/

console.log('systems are go');

