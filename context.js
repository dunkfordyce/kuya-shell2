var _ = require('underscore'),
    defer = require('./deferred');

function CommandNotFound(command) { 
    this.command = command;
    this.message = 'Command Not Found'
}
CommandNotFound.prototype = Error.prototype;
exports.CommandNotFound = CommandNotFound;

function DataTypeError(message) {
    this.message = message || '';
}
DataTypeError.prototype = Error.prototype;
exports.DataTypeError = DataTypeError;


function CommandList(initial) { 
    this.commands = initial || {};
    this.default_command = null;
}
exports.CommandList = CommandList;
CommandList.prototype.get = function(name) { 
    var cmd = this.commands[name] || this.default_command;
    if( !cmd ) { 
        throw new CommandNotFound(name); 
    }
    return cmd;
};
CommandList.prototype.extend = function(commands) { 
    _.extend(this.commands, commands);
};
CommandList.prototype.details = function() { 
    var ret = {
        datatype: 'commandlist/details',
        data: {}
    };   

    _.each(this.commands, function(command, name) { 
        ret.data[name] = _.clone(command.meta || {});
        if( ret.data[name].out_of_server ) { 
            ret.data[name].body = command.toString();
        }
    });

    return ret;
};

exports.default_commands = new CommandList({
    ls: require('./commands/ls').ls,
    select: require('./commands/select').select
});

function Context(options) { 
    options = options || {};
    this.path = options.path || process.cwd();
    this.env = options.env || {
        HOME: process.env.HOME
    };
    this.commands = options.commands || exports.default_commands;
}

Context.prototype._prepare_command = function(cmd, args, options, input) { 
    var ret_promise = defer.Deferred(),
        c = {
            context: this,
            cmd: cmd,
            options: options,
            input: input,
            result: defer.Deferred(),
            datatype: 'command/result'
        },
        f = function() { 
            (c.input || defer.Deferred().resolve())
                .done(function(result) { 
                    var ret;
                    c.input = result;
                    try { 
                        ret = c.cmd.apply(c, args);
                    } catch(e) { 
                        c.result.reject(e);
                        return;
                    }
                    if( ret !== undefined ) { 
                        c.result.resolve(ret);
                    }
                })
                .fail(function() { 
                    c.result.reject({message: 'failed on input'});
                })
            ; 
            return ret_promise.promise();
        };

    c.result.done(function(ret) { 
        ret_promise.resolve({datatype: c.datatype, data: ret});
    });
    c.result.fail(function(ret) { 
        ret_promise.reject({datatype: 'command/error', data: ret});
    });

    f.input = function(promise) { 
        c.input = promise;
        return this;
    };
    f.result = ret_promise.promise();
    f.cmd = cmd;
    return f;
};

Context.prototype.prepare_command = function(cmd, args, options, input) { 
    if( !_.isFunction(cmd) ) { 
        cmd = this.commands.get(cmd);
    }
    return this._prepare_command(cmd, args, options, input);
};

Context.prototype.execute_command = function(cmd, args, options, input) { 
    return this.prepare_command(cmd, args, options, input)();
};

Context.prototype.execute_chain = function(chain, return_all) { 
    var context = this,
        r = defer.Deferred(),
        all_calls = {},
        used_output = {},
        ret = {datatype: 'commandchain/result', data: {}};

    try { 
        _.each(chain, function(cmd, cmd_id) { 
            all_calls[cmd_id] = context.prepare_command(cmd.cmd, cmd.args, cmd.options);
        });
    } catch(e) { 
        r.reject(e);
    }

    _.each(all_calls, function(call, cmd_id) {
        if( chain[cmd_id].input ) {
            call.input(all_calls[chain[cmd_id].input].result);
            used_output[chain[cmd_id].input] = true;
        }
    });

    defer.when.apply(null, _.map(all_calls, function(call, cmd_id) { 
        return call();
    }) )
        .always(function() { 
            _.each(all_calls, function(call, cmd_id) { 
                if( return_all || !used_output[cmd_id] ) { 
                    call.result.always(function(result) { ret.data[cmd_id] = result; });
                }
            });
        })
        .done(function() { r.resolve(ret); })
        .fail(function() { r.reject(ret); })
    ;

    return r.promise();
};

exports.Context = Context;

exports.inflaters = {
    'command/call': {
        init: function(ctx) { 
            this.context = ctx || new Context();
            this.data.input = this.data.input ? defer.Deferred().resolve(this.data.input) : undefined;
        },
        execute: function() { 
            return this.context.execute_command(
                this.data.cmd, 
                this.data.args, 
                this.data.options, 
                this.data.input
            );
        }
    },
    'commandchain/call': {
        init: function(ctx) { 
            this.context = ctx || new Context();
        },
        execute: function() { 
            return this.context.execute_chain( 
                this.data.chain,
                this.data.returnall
            );
        }
    }
};
