var _ = require('underscore'),
    defer = require('./deferred'),
    inflater = require('./inflate').default_inflater;

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


function RemoteCommand() {};
exports.RemoteCommand = RemoteCommand;

exports.describe = function(meta, f) { 
    f.meta = meta;
    return f;
};

/*
function ContextList() { 
    this.contexts = {};
}
ContextList.prototype.add = function(context) { 
    if( this.contexts[context.id] ) { 
        throw new Error('context "'+context.id+'" already added to list');
    }
    this.contexts[context.id] = context;
    return this;
};
ContextList.prototype.get = function(id) { 
    return this.contexts[id];
};
ContextList.protoype.deflate = function() { 
    
    return {
        $datatype: 'contextlist',
        data: this.contexts
};
*/

function CommandList(initial) { 
    this.commands = {};
    this.meta = {};
    if( initial ) this.extend(initial);
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
CommandList.prototype.get_meta = function(name) { 
    var meta = this.meta[name] || this.default_command;
    if( !meta ) { 
        throw new CommandNotFound(name);
    }
    return meta;
};
CommandList.prototype._build_meta = function(command, name) { 
    var meta = command.meta || {};
    this.meta[name] = meta;
    meta.args = meta.args || command.length;
};
CommandList.prototype.extend = function(commands) { 
    _.each(commands, function(command, name) { 
        console.log('got', name, command);
        if( command.$datatype ) { commands[name] = inflater.inflate(command); }
        console.log('after', name, command);
    });
    _.each(commands, this._build_meta, this);
    _.extend(this.commands, commands);
    return this;
};
CommandList.prototype.extend_meta = function(metas) { 
    var self = this;
    _.each(metas, function(meta, name) { 
        self.meta[name] = meta;
    });
    return this;
};
CommandList.prototype.deflate = function() { 
    var self = this,
        commands = {};
    _.each(this.commands, function(command, name) { 
        commands[name] = { $datatype: 'command/remotecall' };
    });

    return {
        $datatype: 'commandlist',
        data: {
            meta: this.meta,
            commands: commands
        }
    };   
};

function Context(options) { 
    options = options || {};
    this.id = options.id;
    this.path = options.path || process.cwd();
    this.env = _.defaults(options.env || {}, {
        HOME: process.env ? process.env.HOME : null
    });
    if( options.commands && options.commands.$datatype ) { 
        this.commands = inflater.inflate(options.commands);
    } else {
        this.commands = options.commands || (new CommandList());
    }
    this.remotes = [];
    this.remotes_by_id = {};
}
Context.prototype.deflate = function() { 
    console.log(this);
    return {
        $datatype: 'context',
        data: {
            id: this.id,
            path: this.path,
            env: this.env,
            commands: this.commands.deflate()
        }
    };
};
Context.prototype.add_remote = function(context) { 

};
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
        ret_promise.resolve({$datatype: c.datatype, data: ret});
    });
    c.result.fail(function(ret) { 
        ret_promise.reject({$datatype: 'command/error', data: ret});
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
        ret = {$datatype: 'commandchain/result', data: {}};

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
    'context': { 
        init: function() { 
            return new Context(this.data);
        }
    },
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
    },
    'commandlist': {
        init: function() { 
            return (new CommandList())
                .extend(this.data.commands)
                .extend_meta(this.data.meta)
            ;
        }
    },
    'command/remotecall': {
        init: function() { 
            return RemoteCommand;
        }
    },
};

inflater.extend(exports.inflaters);
