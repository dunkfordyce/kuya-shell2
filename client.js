var context = require('./context'),
    inflater = require('./inflate').default_inflater,
    parser = require('./command_parser'),
    $ = require('jquery-browserify');

var local_context = new context.Context();

window.p = parser;

$.ajaxSetup({dataType: 'json'});

$.ajax('/context/', {
        type: 'POST'
    })
    .success(function(ret) {
        window.context = inflater.inflate(ret);
    })
;

console.log('systems are go');
