var vows = require('vows'),
    assert = require('assert'),
    context = require('../context'),
    events = require('events'),
    fs = require('fs'),
    defer = require('../deferred'),
    test_commands = require('./support/commands').test_commands;

function nullfunc() {};

vows.describe('context')
    .addBatch({
        'CommandList': {
            topic: new context.CommandList({
                testfunc1: nullfunc
            }),
            'get': function(command_list) { 
                assert.equal(command_list.get('testfunc1'), nullfunc);
            },
            'get missing': function(command_list) { 
                assert.throws(function() { 
                    command_list.get('i dont exist');
                }, context.CommandNotFound);
            },
            'extend': function(command_list) { 
                var testfunc2 = function() {};
                command_list.extend({testfunc2: testfunc2});
                assert.equal(command_list.get('testfunc2'), testfunc2);
            }
        },
        'Context': { 
            topic: new context.Context({
                commands: test_commands
            }),
            'prepare command': function(context) { 
                var r = context.prepare_command('truefunc');
                assert.isFunction( r );
                assert.equal( r.cmd, test_commands.commands.truefunc  );
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
            'execute command': {
                topic: function(context) { 
                    var r = context.execute_command('truefunc'),
                        cb = this.callback;
                    r.then(
                        function(a) { cb(null, a); },
                        function(a) { cb(a, null); }
                    );
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
                'chained output': function(err, ret) { 
                    assert.ifError(err);
                    assert.equal(ret.data.f3.data, 'arg1 arg2 arg3');
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
                'chained output': function(err, ret) { 
                    assert.equal(err.data.f3.schema, 'error');
                    assert.equal(err.data.f3.data.message, 'failed on input');
                    assert.equal(ret, null);
                }

            }
        }
    })
    .export(module)
;
