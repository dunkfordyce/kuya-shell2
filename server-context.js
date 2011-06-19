var _ = require('underscore'),
    context = require('./context'),
    defer = require('./deferred'),
    inflate = require('./inflate'),
    inflater = new inflate.Inflater(),
    contexts = {};

inflater.extend(context.inflaters);

exports.create = function(req, res) { 
    var ctx = new context.Context(),
        id = _.uniqueId();
    contexts[id] = ctx;
    res.send({
        datatype: 'context/create',
        data: {id: id}
    });
};

exports.load_context = function(req, res, next) { 
    req.context = contexts[req.params.id];
    if( !req.context ) { 
        next(new Error("cant find context"));
    } else {
        next();
    }
};

exports.execute = function(req, res) { 
    var obj = inflater.inflate(req.body, [req.context]);
    obj.execute().always(function(r) { res.send(r); });
};

exports.commands = function(req, res) { 
    res.send(req.context.commands.details());
};
