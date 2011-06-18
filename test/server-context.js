var vows = require('vows'),
    assert = require('assert'),
    tobi = require('tobi'),
    app = require('../app').app,
    context = require('../context'),
    _ = require('underscore');

app.listen(3000);
var browser = tobi.createBrowser(3000, 'localhost');

function send(msg, cb, statusCode) { 
    statusCode = statusCode || 200;
    var context = {
        topic: function() { 
            var self = this;
            browser.post('/context/execute', {
                body: JSON.stringify(msg),
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function(res) { 
                self.callback(null, res);
            });
        },
        'check result': function(err, res) { 
            assert.equal(statusCode, res.statusCode);
            if( _.isFunction(cb) ) { 
                cb(res.body, res);
            } else {
                assert.deepEqual(res.body, cb);
            }
        }
    };
    return context;
};

context.default_commands = require('./support/commands').test_commands;

vows.describe('server-context')
    .addBatch({
        'execute': { 
            'simple': send(
                {datatype: 'command/call', data: {cmd: 'truefunc'}}, 
                {datatype: 'command/result', data: true}
            ),
            'arguments': send(
                {datatype: 'command/call', data: {cmd: 'passthru_args', args: ['arg']}},
                {datatype: 'command/result', data: 'arg'}
            ),
            'options': send(
                {datatype: 'command/call', data: {cmd: 'passthru_options', options: {opt1: 'opt1'}}},
                {datatype: 'command/result', data: {opt1: 'opt1'}}
            ),
            'input': send(
                {datatype: 'command/call', data: {cmd: 'passthru_input', input: {data: 'input'}}},
                {datatype: 'command/result', data: 'input'}
            ),
            'fail': send(
                {datatype: 'command/call', data: {cmd: 'always_fail'}},
                {datatype: 'command/error', data: 'fail!'}
            ),
        },
        'chain': {
            'simple': send(
                {datatype: 'commandchain/call', data: { 
                    chain: {
                        f1: { cmd: 'append_to_input', args: ['arg1'] },
                        f2: { cmd: 'append_to_input', args: ['arg2'], input: 'f1' },
                        f3: { cmd: 'append_to_input', args: ['arg3'], input: 'f2' }
                    }
                }},
                {datatype: 'commandchain/result', data: { 
                    f3: {datatype: 'command/result', data: 'arg1 arg2 arg3'}
                }}
            )
        }
    })
    .export(module)
;
