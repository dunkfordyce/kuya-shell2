var O = require('kuya-O'),
    context = require('./context'),
    parser = require('./command_parser'),
    remote_command = require('./remote_command_jquery'),
    $ = require('jquery-browserify');

window.pa = parser;

$.ajaxSetup({dataType: 'json'});

$.ajax('/context/new', {
    })
    .success(function(ret) {
        window.context = O.inflate(ret);
    })
;

console.log('systems are go');
