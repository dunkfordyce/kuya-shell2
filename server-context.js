var context = require('./context'),
    defer = require('./deferred');

exports.execute = function(req, res) { 
    var ctx = new context.Context();
    ctx.execute(
        req.body
    ).always(function(r) { res.send(r); });
};
