var vows = require('vows'),
    assert = require('assert'),
    tobi = require('tobi'),
    app = require('../app').app,
    context = require('../context'),
    _ = require('underscore');

app.listen(3000);
var browser = tobi.createBrowser(3000, 'localhost');

function send(command, method, msg, cb, statusCode) { 
    statusCode = statusCode || 200;
    var context = {
        topic: function() { 
            var self = this,
                context_id = this.context.topics[0],
                opts = { headers: {} };
            if( method == 'post' ) { 
                opts.body = JSON.stringify(msg);
                opts.headers['Content-Type'] = 'application/json';
            }

            browser[method]('/context/'+context_id+'/'+command, opts, function(res) { 
                self.callback(null, res);
            });
        },
        'check result': function(err, res) { 
            assert.equal(res.statusCode, statusCode);
            if( _.isFunction(cb) ) { 
                cb(res.body, res);
            } else {
                assert.equal(res.body.datatype, cb.datatype);
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

context.default_commands = require('./support/commands').test_commands;

vows.describe('server-context')
    .addBatch({
        'commands': {
            topic: function() { 
                var self = this;
                browser.post('/context/', {}, function(res) { 
                    self.callback(null, res.body.data.id);
                });
            },
            'list': get('commands',
                function(ret) { 
                    console.log(ret);
                }
            )
        },
        'execute': { 
            topic: function() { 
                var self = this;
                browser.post('/context/', {}, function(res) { 
                    self.callback(null, res.body.data.id);
                });
            },
            'simple': post('execute',
                {datatype: 'command/call', data: {cmd: 'truefunc'}}, 
                {datatype: 'command/result', data: true}
            ),
            'arguments': post('execute',
                {datatype: 'command/call', data: {cmd: 'passthru_args', args: ['arg']}},
                {datatype: 'command/result', data: 'arg'}
            ),
            'options': post('execute',
                {datatype: 'command/call', data: {cmd: 'passthru_options', options: {opt1: 'opt1'}}},
                {datatype: 'command/result', data: {opt1: 'opt1'}}
            ),
            'input': post('execute',
                {datatype: 'command/call', data: {cmd: 'passthru_input', input: {data: 'input'}}},
                {datatype: 'command/result', data: 'input'}
            ),
            'fail': post('execute',
                {datatype: 'command/call', data: {cmd: 'always_fail'}},
                {datatype: 'command/error', data: 'fail!'}
            ),
        },
        'chain': {
            topic: function() { 
                var self = this;
                browser.post('/context/', {}, function(res) { 
                    self.callback(null, res.body.data.id);
                });
            },
            'simple': post('execute',
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
