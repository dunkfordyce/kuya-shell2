var sys = require('sys'),
    vows = require('vows'),
    assert = require('assert'),
    context = require('../context'),
    events = require('events'),
    fs = require('fs'),
    defer = require('../deferred'),
    test_commands = require('./support/commands').test_commands,
    env = require('../env'),
    O = require('kuya-O');

function nullfunc() {};

vows.describe('context')
    .addBatch({
        'Context': { 
            topic: context.Context.create({
                commands: test_commands,
                env: {HOME: '/home/kuya'}
            }),
            'env': function(ctx) { 
                assert.ok(ctx.env);
                assert.ok(ctx.env.get('HOME'));
            },
            'prepare command': function(context) { 
                var r = context.prepare_command('truefunc');
                assert.isFunction( r );
                assert.equal( r.cmd, test_commands.get_func('truefunc') );
            },
            'prepare missing': function(context) { 
                assert.throws(function() { 
                    context.prepare_command('i dont exist');
                }, context.CommandNotFound);
            },
            'prepare non string': function(context) { 
                var f = function() {},
                    r = context.prepare_command(f);
                assert.equal(f, r.cmd);
            },
            'deflate': function(ctx) { 
                assert.ok(O.deflate(ctx));
                assert.equal(O.deflate(ctx).$inflate, 'context');
            },
            'inflate': function(ctx) { 
                var new_context = O.inflate(O.deflate(ctx));
                var new_env = O.inflate(O.deflate(ctx.env));
                assert.ok(O.instanceOf(new_context, context.Context));
                assert.ok(O.instanceOf(new_env, env.Env));
                assert.ok(O.instanceOf(new_context.env, env.Env));
                assert.deepEqual(O.deflate(new_context), O.deflate(ctx));
            },
            'execute command': {
                topic: function(context) { 
                    try { 
                    var r = context.execute_command('truefunc'),
                        cb = this.callback;
                    r.then(
                        function(a) { cb(null, a); },
                        function(a) { cb(a, null); }
                    );
                    }catch(e) { 
                    console.error(e);
                    }
                },
                'command executed': function(err, result) { 
                    assert.ifError(err);
                    assert.equal(result.data, true);
                }
            },
            'execute command args': { 
                topic: function(context) { 
                    var r = context.execute_command('passthru_args', ['arg']),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned args': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re.data, 'arg');
                }
            },
            'execute command options': { 
                topic: function(context) { 
                    var r = context.execute_command('passthru_options', [], 'options'),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned options': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re.data, 'options');
                }
            },
            'execute command input': { 
                topic: function(context) { 
                    var r = context.execute_command('passthru_input', [], null, 
                            defer.Deferred().resolve({data: 'input'})),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned input': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re.data, 'input');
                }
            },
            'execute chain': {
                topic: function(context) { 
                    var r = context.execute_chain({
                            f1: { cmd: 'append_to_input', args: ['arg1'] },
                            f2: { cmd: 'append_to_input', args: ['arg2'], input: 'f1' },
                            f3: { cmd: 'append_to_input', args: ['arg3'], input: 'f2' }
                        }),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'chained output': function(err, result) { 
                    assert.ifError(err);
                    assert.equal(result.data.f3.data, 'arg1 arg2 arg3');
                }
            },
            'chain fail part': {
                topic: function(context) { 
                    var f = function(arg) { 
                            if( arg == 'fail' ) { 
                                this.result.reject('fail');
                            } else {
                                this.result.resolve(this.input ? (this.input + ' ' + arg) : arg);
                            }
                        },
                        r = context.execute_chain({
                            f1: { cmd: 'append_to_input', args: ['arg1'] },
                            f2: { cmd: 'always_fail', input: 'f1' },
                            f3: { cmd: 'append_to_input', args: ['arg3'], input: 'f2' }
                        }),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'chained output': function(err, result) { 
                    assert.equal(err.data.f3.$datatype, 'command/error');
                    assert.equal(err.data.f3.data.message, 'failed on input');
                    assert.equal(result, null);
                }

            }
        }
    })
    .export(module)
;
