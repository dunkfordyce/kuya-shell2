var vows = require('vows'),
    assert = require('assert'),
    inflate = require('../inflate');

var type1 = {
        a: true,
        b: false
    },
    type2 = {
        returnthis: function(thing) { return this[thing]; }
    },
    default_inflater = { 
        'foo': true
    };


vows.describe('inflater')
    .addBatch({
        'simple': { 
            topic: new inflate.Inflater({
                'type1': type1,
                'type2': type2
            }),
            'get': function(inflater) { 
                assert.equal(inflater.get('type1'), type1);
            },
            'get not found': function(inflater) { 
                assert.throws(function() { 
                    inflater.get('doesntexist');
                }, inflater.InflaterNotFound);
            },
            'inflate with type': function(inflater) { 
                var obj = inflater.inflate({c: 1}, 'type1');
                assert.equal(obj.__proto__, type1);
                assert.equal(obj.a, true);
                assert.equal(obj.b, false);
                assert.equal(obj.c, 1);
            },
            'inflate with dataType': function(inflater) { 
                var obj = inflater.inflate({c: 1, datatype: 'type1'});
                assert.equal(obj.__proto__, type1);
            },
            'functions': function(inflater) { 
                var obj = inflater.inflate({c: 1, datatype: 'type2'});
                assert.equal(obj.returnthis('c'), 1);
            }
        },
        'default inflater': {
            topic: new inflate.Inflater({
                type1: type1,
                type2: type2
            }, default_inflater),
            'get': function(inflater) { 
                assert.equal(inflater.get('doesntexist'), default_inflater);
            }
        }
    })
    .export(module)
;
