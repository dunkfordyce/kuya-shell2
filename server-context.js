var _ = require('underscore'),
    O = require('kuya-O'),
    context = require('./context'),
    command_list = require('./command_list'),
    env = require('./env'),
    defer = require('./deferred'),
    default_commands = command_list.CommandList.create({
        ls: require('./commands/ls').ls,
        select: require('./commands/select').select
    }),
    default_env = env.Env.create({
        home: process.env.HOME,
        cwd: process.env.HOME
    }),
    contexts = {};

exports.default_commands = default_commands;

exports.commands = function(req, res) { 
    var r = O.deflate(default_commands, {mode: 'remote'});
    res.send(r);
};


/*
exports.create = function(req, res) { 
    var id = _.uniqueId(),
        ctx = new context.Context({id: id, commands: default_commands});
    res.send(ctx.deflate());
};
*/

/*
exports.load_context = function(req, res, next) { 
    req.context = contexts[req.params.id];
    if( !req.context ) { 
        next(new Error("cant find context"));
    } else {
        next();
    }
};

exports.execute = function(req, res) { 
    var ctx = inflate(req.body.context),
        command = inflate(req.body.command);
    command.execute().always(function(r) { res.send(r); });
};

exports.commands = function(req, res) { 
    res.send(req.context.commands.details());
};
*/
