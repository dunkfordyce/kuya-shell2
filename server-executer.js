function _prepare_command(context, cmd, args, options, input) { 
    var ret_promise = defer.Deferred(),
        c = {
            context: context,
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
}

function prepare_command(context, cmd, args, options, input) { 
    if( !_.isFunction(cmd) ) { 
        cmd = context.commands.get(cmd);
    }
    return _prepare_command(context, cmd, args, options, input);
}

function execute_command(context, cmd, args, options, input) { 
    return prepare_command(context, cmd, args, options, input)();
}

function execute_chain(context, chain, return_all) { 
    var r = defer.Deferred(),
        all_calls = {},
        used_output = {},
        ret = {$datatype: 'commandchain/result', data: {}};

    try { 
        _.each(chain, function(cmd, cmd_id) { 
            all_calls[cmd_id] = prepare_command(context, cmd.cmd, cmd.args, cmd.options);
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

exports.prepare_command = prepare_command;
exports.execute_command = execute_command;
exports.execute_chain = execute_chain;
