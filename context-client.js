var O = require('kuya-O'),
    context = require('./context'),
    Context = context.Context;

var ClientContext = O.spawn(Context, {

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

exports.ClientContext = ClientContext;
O.default_registry.add(ClientContext);

