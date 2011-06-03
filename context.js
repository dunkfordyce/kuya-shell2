var _ = require('underscore'),
    defer = require('jsdeferred');

function Context() { 
    this.path = process.cwd();
}

Context.prototype.execute = function(cmd, args, options, input) { 
    var c = {
        context: this,
        options: options,
        input: input,
        result: defer.Deferred()
    };

    cmd.apply(c, args);

    return c.result.promise();
};

exports.Context = Context;
