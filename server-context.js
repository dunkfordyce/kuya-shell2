var _ = require('underscore'),
    O = require('kuya-O'),
    context = require('./context'),
    command_list = require('./command_list'),
    env = require('./env'),
    defer = require('./deferred'),
    default_commands = {
        ls: require('./commands/ls').ls,
        select: require('./commands/select').select
    },
    default_env = {
        home: process.env.HOME,
        cwd: process.env.HOME
    },
    os = require('os'),
    hostname = os.hostname(),
    contexts = {};

exports.default_commands = default_commands;

exports.create = function(req, res) { 
    console.log('doing create');
    var id = _.uniqueId(),
        ctx = context.Context.create({id: id, commands: default_commands, env: default_env}),
        data = O.deflate(ctx, {mode: 'remote'}); 
    //console.log('sending', data);
    res.send(data);
};

exports.load_context = function(req, res, next) { 
    console.log('load context');
    req.context = contexts[req.params.id];
    if( !req.context ) { 
        next(new Error("cant find context"));
    } else {
        next();
    }
};

exports.execute = function(req, res) { 
    var cmd = O.inflate(req.body, {context: req.context});
    cmd().always(function(r) { res.send(r); });
};
