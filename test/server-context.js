var vows = require('vows'),
    assert = require('assert'),
    _ = require('underscore'),
    tobi = require('tobi'),
    defer = require('../deferred'),
    app = require('../app').app,
    env = require('../env'),
    context = require('../context'),
    command_list = require('../command_list'),
    remote_command = require('../remote_command_jquery'),
    O = require('kuya-O');

app.listen(3000);
var browser = tobi.createBrowser(3000, 'localhost');

function send(command, method, msg, cb, statusCode) { 
    statusCode = statusCode || 200;
    var context = {
        topic: function() { 
            var self = this,
                context = this.context.topics[0],
                opts = { headers: {} };
            if( method == 'post' ) { 
                opts.body = JSON.stringify(msg);
                opts.headers['Content-Type'] = 'application/json';
            }

            browser[method]('/context/'+context.id+'/'+command, opts, function(res) { 
                self.callback(null, res);
            });
        },
        'check result': function(err, res) { 
            assert.equal(res.statusCode, statusCode);
            if( _.isFunction(cb) ) { 
                cb(res.body, res);
            } else {
                if( res.body.$datatype == 'error' ) { 
                    console.error(res.body);
                    assert.ok(res.body.$datatype);
                }
                assert.equal(res.body.$datatype, cb.$datatype);
                assert.deepEqual(res.body, cb);
            }
        }
    };
    return context;
};

function post(cmd, msg, cb) { 
    return send(cmd, 'post', msg, cb);
}

function get(cmd, cb) { 
    return send(cmd, 'get', null, cb);
}

function get_context() {
    return function() {
        console.log('getting context');
        var self = this;
        browser.get('/context/new', {}, function(res) { 
            self.callback(null, O.inflate(res.body));
        });
    }
}

context.default_commands = require('./support/commands').test_commands;

vows.describe('server-context')
    .addBatch({
        'context simple' : { 
            topic: get_context(),
            'simple': function(ctx) { 
                console.log(ctx);
                assert.ok( O.instanceOf(ctx, context.Context) );
                assert.ok( O.instanceOf(ctx.env, env.Env) );
                assert.ok( O.instanceOf(ctx.commands, command_list.CommandList) );
            },
            'execute': function(ctx) { 
                ctx.execute_command('ls').always(function(ret) { 
                    console.error('ret', ret);
                });
            }
         }

        /*
        'default_env': {
            topic: function() { 
                var self = this;
                browser.get('/default_env', {}, function(res) { 
                    self.callback(null, res); 
                });
            },
            ok: function(err, res) { 
                var env = inflater.inflate(res.body);
                assert.ok(env);
                assert.equal(env.get('home'), '/home/dunk');
                assert.equal(env.get('cwd'), '/home/dunk');
            }
        },
        'command_list': {
            topic: function() { 
                var self = this;
                browser.get('/commands', {}, function(res) { 
                    self.callback(null, res);
                });
            },
            ok: function(err, res) { 
                var cl = O.inflate(res.body);
                assert.ok(cl);
                assert.ok( O.instanceOf(cl, command_list.CommandList) );
            }
        }
        */
    })
    /*
    .addBatch({
        'full': { 
            topic: function() { 
                var self = this,
                    done = defer.Deferred().done(function(ctx) { 
                        self.callback(null, ctx);
                    });
                defer.when(
                    (function() { 
                        var p = defer.Deferred();
                        browser.get('/commands', {}, function(r) { p.resolve(inflater.inflate(r.body)); });
                        return p;
                    })(),
                    (function() { 
                        var p = defer.Deferred();
                        browser.get('/default_env', {}, function(r) { p.resolve(inflater.inflate(r.body)); });
                        return p;
                    })()
                ).done(function(commands, env) { 
                    done.resolve(new context.Context({
                        env: env,
                        commands: commands   
                    }));
                });
            },
            ok: function(ctx) {
                assert.ok(ctx);
                ctx.commands.extend({
                    localfunc: context.describe({
                       description: 'a local command'
                    }, function localfunc() { 
                        this.result.resolve('localfunc');
                    })
                });

                ctx.execute_command('localfunc').then(function(r) { 
                    console.log('ret', r);
                });

                ctx.execute_command('ls').then(function(r) { 
                    console.log('ls ret', r);
                });
            }
        }
    })
    .addBatch({
        'execute': { 
            topic: get_context(),
            'simple': post('execute',
                {$datatype: 'command/call', data: {cmd: 'truefunc'}}, 
                {$datatype: 'command/result', data: true}
            ),
            'arguments': post('execute',
                {$datatype: 'command/call', data: {cmd: 'passthru_args', args: ['arg']}},
                {$datatype: 'command/result', data: 'arg'}
            ),
            'options': post('execute',
                {$datatype: 'command/call', data: {cmd: 'passthru_options', options: {opt1: 'opt1'}}},
                {$datatype: 'command/result', data: {opt1: 'opt1'}}
            ),
            'input': post('execute',
                {$datatype: 'command/call', data: {cmd: 'passthru_input', input: {data: 'input'}}},
                {$datatype: 'command/result', data: 'input'}
            ),
            'fail': post('execute',
                {$datatype: 'command/call', data: {cmd: 'always_fail'}},
                {$datatype: 'command/error', data: 'fail!'}
            ),
        },
        'chain': {
            topic: get_context(),
            'simple': post('execute',
                {$datatype: 'commandchain/call', data: { 
                    chain: {
                        f1: { cmd: 'append_to_input', args: ['arg1'] },
                        f2: { cmd: 'append_to_input', args: ['arg2'], input: 'f1' },
                        f3: { cmd: 'append_to_input', args: ['arg3'], input: 'f2' }
                    }
                }},
                {$datatype: 'commandchain/result', data: { 
                    f3: {$datatype: 'command/result', data: 'arg1 arg2 arg3'}
                }}
            )
        }
    })
    */
    .export(module)
;
