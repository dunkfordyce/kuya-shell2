var O = require('kuya-O'),
    context = require('./context'),
    Context = context.Context,
    defer = require('./deferred');

var ServerContext = O.spawn(Context, {
    _prepare_command: function(cmd_name, args, options, input) { 
        var ret_promise = defer.Deferred(),
            context = this,
            c = {
                context: context,
                cmd_name: cmd_name,
                cmd: context.commands.get_func(cmd_name),
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
        f.cmd = c.cmd;
        f.cmd_name = cmd_name;
        return f;
    },

    prepare_command: function(cmd, args, options, input) { 
        return this._prepare_command(cmd, args, options, input);
    },

    execute_command: function(cmd, args, options, input) { 
        return this.prepare_command(cmd, args, options, input)();
    },

    execute_chain: function(chain, return_all) { 
        var context = this,
            r = defer.Deferred(),
            all_calls = {},
            used_output = {},
            ret = {$inflate: 'commandchain/result', data: {}};

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
    }
});

exports.ServerContext = ServerContext;
O.default_registry.add(ServerContext);

