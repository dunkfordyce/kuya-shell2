var context = require('./context'),
    defer = require('./deferred');

exports.execute = function(req, res) { 
    var ctx = new context.Context();
    ctx.execute_command(
        req.body.cmd,
        req.body.args,
        req.body.options,
        defer.Deferred().resolve(req.body.input)
    ).always(function(r) { res.send(r); });
};

exports.chain = function(req, res) { 
    var ctx = new context.Context();
    ctx.execute_chain(
        req.body.chain,
        req.body.return_all
    ).always(function(r) { res.send(r); });
};
