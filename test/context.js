var vows = require('vows'),
    assert = require('assert'),
    context = require('../context'),
    events = require('events'),
    fs = require('fs'),
    defer = require('../deferred');

function testfunc1() {};
function testfunc2() {};

vows.describe('context')
    .addBatch({
        'CommandList': {
            topic: new context.CommandList({
                testfunc1: testfunc1
            }),
            'get': function(command_list) { 
                assert.equal(command_list.get('testfunc1'), testfunc1);
            },
            'get missing': function(command_list) { 
                assert.throws(function() { 
                    command_list.get('i dont exist');
                }, context.CommandNotFound);
            },
            'extend': function(command_list) { 
                command_list.extend({testfunc2: testfunc2});
                assert.equal(command_list.get('testfunc2'), testfunc2);
            }
        },
        'Context': { 
            topic: new context.Context({
                commands: new context.CommandList({
                    testfunc1: testfunc1
                })
            }),
            'prepare command': function(context) { 
                var r = context.prepare_command('testfunc1');
                assert.isFunction( r );
                assert.ok( r.cmd_data );
            },
            'prepare missing': function(context) { 
                assert.throws(function() { 
                    context.prepare_command('i dont exist');
                }, context.CommandNotFound);
            },
            'prepare non string': function(context) { 
                var f = function() {},
                    r = context.prepare_command(f);
                assert.equal(f, r.cmd_data.cmd);
            },
            testasync: {
                topic: function () {
                    var promise = new(events.EventEmitter);

                    fs.stat('/home/dunk/.bashrc', function (e, res) {
                        if (e) { promise.emit('error', e) }
                        else   { promise.emit('success', res) }
                    });
                    return promise;
                  },
                  'can be accessed': function (err, stat) {
                    assert.isNull   (err);        // We have no error
                    assert.isObject (stat);       // We have a stat object
                  },
                  'is not empty': function (err, stat) {
                    assert.isNotZero (stat.size); // The file size is > 0
                  }
            },
            'execute command': {
                topic: function(context) { 
                    var f = function() { 
                            this.result.resolve(true); 
                        },
                        r = context.execute_command(f),
                        cb = this.callback;
                    r.then(
                        function(a) { cb(null, a); },
                        function(a) { cb(a, null); }
                    );
                },
                'command executed': function(err, success) { 
                    assert.ifError(err);
                }
            },
            'execute command args': { 
                topic: function(context) { 
                    var f = function(arg) { 
                            this.result.resolve(arg);
                        },
                        r = context.execute_command(f, ['arg']),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned args': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re, 'arg');
                }
            },
            'execute command options': { 
                topic: function(context) { 
                    var f = function() { 
                            this.result.resolve(this.options);
                        },
                        r = context.execute_command(f, [], 'options'),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned options': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re, 'options');
                }
            },
            'execute command input': { 
                topic: function(context) { 
                    var f = function() { 
                            this.result.resolve(this.input);
                        },
                        r = context.execute_command(f, [], null, defer.Deferred().resolve('input')),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'command returned input': function(err, re) { 
                    assert.ifError(err);
                    assert.equal(re, 'input');
                }
            },
            'execute chain': {
                topic: function(context) { 
                    var f1 = function(arg) { 
                            this.result.resolve(arg);
                        },
                        f2 = function() { 
                            this.result.resolve(this.input + ' chained');
                        },
                        r = context.execute_chain({
                            f1: { cmd: f1, args: ['arg1'] },
                            f2: { cmd: f2, input: 'f1' }
                        }).done(console.log).fail(console.error),
                        cb = this.callback;
                    r.then(
                        function(re) { cb(null, re); },
                        function(re) { cb(re, null); }
                    );
                },
                'chained output': function(err, ret) { 
                    console.log(ret);
                    console.log(err);
                    assert.ifError(err);
                    assert.equal(ret.f2, 'arg1 chained');
                }
            }
        }
    })
    .export(module)
;
