var vows = require('vows'),
    assert = require('assert'),
    inflater = require('../inflate').default_inflater,
    command_list = require('../command_list'),
    test_commands = require('./support/commands.js').test_commands;

function nullfunc() {};

vows.describe('command_list')
    .addBatch({
        'CommandList': {
            topic: new command_list.CommandList({
                testfunc1: nullfunc
            }),
            'get': function(cl) { 
                assert.equal(cl.get('testfunc1'), nullfunc);
            },
            'get missing': function(cl) { 
                assert.throws(function() { 
                    cl.get('i dont exist');
                }, command_list.CommandNotFound);
            },
            'extend': function(cl) { 
                var testfunc2 = function() {};
                cl.extend({testfunc2: testfunc2});
                assert.equal(cl.get('testfunc2'), testfunc2);
            },
            'deflated': { 
                topic: test_commands.deflate(),
                //'log': function(deflated) { console.log(deflated); },
                'simple': function(deflated) { 
                    assert.equal(deflated.$datatype, 'commandlist');
                    assert.ok(deflated.data.meta.truefunc);
                    assert.ok(deflated.data.commands.truefunc);
                },
                'got meta': function(deflated) { 
                    assert.ok(deflated.data.meta.can_run_in_browser.out_of_server);
                },
                'description': function(deflated) { 
                    assert.ok(deflated.data.meta.command_with_description.description);
                },
                'options': function(deflated) { 
                    assert.ok(deflated.data.meta.command_with_options_meta.options);
                }
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
