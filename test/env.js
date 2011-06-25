var vows = require('vows'),
    assert = require('assert'),
    env = require('../env'),
    inflater = require('../inflate').default_inflater;

vows.describe('env')
    .addBatch({
        'Env': {
            topic: new env.Env({foo: 'bar'}),
            'get': function(e) { 
                assert.ok(e.get('foo'));
            },
            'set': function(e) { 
                e.set('newkey', 'newval');
                assert.equal(e.get('newkey'), 'newval');
            },
            'extend': function(e) { 
                e.extend({even: 'more'});
                assert.equal(e.get('even'), 'more');
            },
            'deflate': function(e) { 
                var deflated = e.deflate();
                assert.equal(deflated.$datatype, 'env');
                assert.ok(deflated.data.foo);
            },
            'inflate': function(e) { 
                assert.deepEqual(inflater.inflate(e.deflate()).e, e.e);
            },
            'changed': function(e) { 
                e.changed = false;
                e.set('x', 'y');
                assert.equal(e.changed, true);
            }
        }
    })
    .export(module)
;
