var sys = require('sys'),
    vows = require('vows'),
    assert = require('assert'),
    O = require('kuya-O'),
    command_list = require('../command_list'),
    remote_command_list = require('../remote_command_list'),
    test_commands = require('./support/commands.js').test_commands;

function nullfunc() {};

vows.describe('command_list')
    .addBatch({
        'CommandList': {
            topic: command_list.CommandList.create({
                testfunc1: nullfunc
            }),
            'get': function(cl) { 
                assert.equal(cl.get_func('testfunc1'), nullfunc);
            },
            'get missing': function(cl) { 
                assert.throws(function() { 
                    cl.get('i dont exist');
                }, command_list.CommandNotFound);
            },
            'extend': function(cl) { 
                var testfunc2 = function() {};
                cl.extend({testfunc2: testfunc2});
                assert.equal(cl.get_func('testfunc2'), testfunc2);
            },
            'remote': { 
                topic: O.deflate(test_commands, {mode: 'remote'}),
                //log: function(deflated) { console.error(deflated); },
                inflates: function(deflated) { 
                    var rcl = O.inflate(deflated);
                    assert.ok( O.instanceOf(rcl, remote_command_list.RemoteCommandList) );
                }
            },
            'deflated': { 
                topic: O.deflate(test_commands),
                //'log': function(deflated) { console.log(deflated); },
                'simple': function(deflated) { 
                    assert.equal(deflated.$inflate, 'CommandList');
                    assert.ok(deflated.commands.truefunc);
                },
                'got meta': function(deflated) { 
                    assert.ok(deflated.commands.can_run_in_browser.meta.out_of_server);
                },
                'description': function(deflated) { 
                    assert.ok(deflated.commands.command_with_description.meta.description);
                },
                'options': function(deflated) { 
                    assert.ok(deflated.commands.command_with_options_meta.meta.options);
                },
            } /*,
            'inflate details': {
                topic: inflater.inflate(test_commands.deflate()),
                //log: function(details) { console.log(arguments); },
                'simple': function(cl) { 
                    assert.ok(cl instanceof command_list.CommandList);
                },
                'meta equal': function(cl) { 
                    assert.ok( test_commands !== cl );
                    assert.deepEqual(cl.deflate(), test_commands.deflate());
                },
                //'functions are remote': function(cl) { 
                //    assert.equal( cl.get('truefunc'), command_list.RemoteCommand );
                //}
            }*/
        }
    })
    .export(module)
;
