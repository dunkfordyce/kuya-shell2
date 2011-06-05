var _ = require('underscore'),
    defer = require('./deferred');

var commands = {
    ls: require('./commands/ls').ls,
    select: require('./commands/select').select
};

function Context() { 
    this.path = process.cwd();
    this.env = {
        HOME: process.env.HOME
    };
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

Context.prototype.execute_chain = function(chain) { 
    var calls = chain.calls,
        context = this,
        r = defer.Deferred();

    _.values(calls).forEach(function(call) { 
        call.retval = null;
        call.used_output = false;
        call.ret = defer.Deferred();
        if( call.input !== null ) { call.input = calls[call.input]; }
        call._call = function() { 
            console.log('executing call', call.id);
            var cmd = commands[call.cmd];
            context.execute(cmd, call.args, call.opts, call.input ? call.input.retval : null)
                .done(function(ret) { 
                    console.log('finished cmd', call.cmd, call.args, ret);
                    call.retval = ret;
                    call.ret.resolve(ret);
                })
                .fail(function(ret) { 
                    console.log('failed cmd', call.cmd, call.args, ret);
                    call.retval = {schema: 'error', data: ret};
                    call.ret.resolve(ret);
                })
            ;
        };
        call.call = function() { 
            if( call.input ) { 
                console.log('call', call.id, 'waiting on', call.input.id);
                call.input.used_output = true;
                call.input.ret
                    .done(call._call)
                    .fail(function(e) { 
                        call.ret.resolve({schema: 'error', data: {message: 'error on input'}});
                    })
                ;
            } else { 
                call._call(); 
            }
        };
    });
    
    defer.when.apply(null, _.map(_.values(calls), function(call) { 
        call.call();
        return call.ret;
    })).then(function() { 
        console.log('all resolved');
        var ret = {};
        _.values(calls).forEach(function(call) { 
            if( chain.debug || !call.used_output ) { 
                ret[call.id] = call.retval;
            }
        });
        console.log('sending', ret);
        r.resolve(ret);
    });

    return r.promise();
};

exports.Context = Context;
