var _ = require('underscore'),
    context = require('./context'),
    defer = require('./deferred'),
    inflate = require('./inflate'),
    inflater = inflate.default_inflater,
    default_commands = new context.CommandList({
        ls: require('./commands/ls').ls,
        select: require('./commands/select').select
    }),
    contexts = {};

exports.default_commands = default_commands;

exports.commands = function(req, res) { 
    return default_commands.deflate();
};

exports.create = function(req, res) { 
    var id = _.uniqueId(),
        ctx = new context.Context({id: id});
    res.send(ctx.deflate());
};

/*
exports.load_context = function(req, res, next) { 
    req.context = contexts[req.params.id];
    if( !req.context ) { 
        next(new Error("cant find context"));
    } else {
        next();
    }
};
*/

exports.execute = function(req, res) { 
    var ctx = inflate(req.body.context),
        command = inflate(req.body.command);
    command.execute().always(function(r) { res.send(r); });
};

exports.commands = function(req, res) { 
    res.send(req.context.commands.details());
};
