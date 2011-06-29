var vows = require('vows'),
    assert = require('assert'),
    O = require('kuya-O'),
    env = require('../env');

vows.describe('env')
    .addBatch({
        'Env': {
            topic: new env.Env.create({foo: 'bar'}),
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
                var deflated = O.deflate(e); 
                assert.equal(deflated.$inflate, 'env');
                assert.ok(deflated.data.foo);
            },
            'inflate': function(e) { 
                var other = O.inflate(O.deflate(e));
                assert.deepEqual(other, e);
                assert.ok(O.instanceOf(other, env.Env));
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
