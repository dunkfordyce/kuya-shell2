var _ = require('underscore'),
    O = require('kuya-O'),
    env = require('./env'),
    command_list = require('./command_list'),
    defer = require('./deferred');

var Context = {
    $deflate: {
        id: 'Context'
    }
};


exports.Context = Context;

O.default_registry.add(Context);
