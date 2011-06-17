var vows = require('vows'),
    assert = require('assert'),
    tobi = require('tobi'),
    app = require('../app').app,
    context = require('../context');

app.listen(3000);
var browser = tobi.createBrowser(3000, 'localhost');

context.default_commands = require('./support/commands').test_commands;

vows.describe('server-context')
    .addBatch({
        'exectue': { 
            'simple': {
                topic: function() { 
                    browser.post('/context/execute', {
                        body: JSON.stringify({cmd: 'truefunc'}),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.data, true);
                }
            },
            'arguments': {
                topic: function() { 
                    browser.post('/context/execute', {
                        body: JSON.stringify({cmd: 'passthru_args', args: ['arg']}),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.data, 'arg');
                }
            },
            'options': {
                topic: function() { 
                    browser.post('/context/execute', {
                        body: JSON.stringify({cmd: 'passthru_options', options: {opt1: 'opt1'}}),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.data.opt1, 'opt1');
                }
            },
            'input': {
                topic: function() { 
                    browser.post('/context/execute', {
                        body: JSON.stringify({cmd: 'passthru_input', input: {data: 'input'}}),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.data, 'input');
                }
            },
            'fail': {
                topic: function() { 
                    browser.post('/context/execute', {
                        body: JSON.stringify({cmd: 'always_fail'}),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.schema, 'error');
                    assert.equal(res.body.data, 'fail!');
                }
            }
        },
        'chain': {
            'simple': { 
                topic: function() { 
                    browser.post('/context/chain', {
                        body: JSON.stringify({
                            chain: {
                                f1: { cmd: 'append_to_input', args: ['arg1'] },
                                f2: { cmd: 'append_to_input', args: ['arg2'], input: 'f1' },
                                f3: { cmd: 'append_to_input', args: ['arg3'], input: 'f2' }
                            }
                        }),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }, this.callback);
                },
                'result': function(res, $) { 
                    assert.equal(res.body.data.f3.data, 'arg1 arg2 arg3');
                }
            }
        }
    })
    .export(module)
;
