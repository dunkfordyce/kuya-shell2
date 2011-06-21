var vows = require('vows'),
    assert = require('assert'),
    inflate = require('../inflate');

function SomeType() {};

var type1 = {
        a: true,
        b: false
    },
    type2 = {
        returnthis: function(thing) { return this[thing]; }
    },
    type_with_init = {
        init: function() { 
            this.inited = true;
        }
    },
    type_with_init_args = {
        init: function(arg) { 
            this.arg = arg;
        }
    },
    type_that_modifies = {
        init: function() { 
            return new SomeType();
        }
    },
    default_inflater = { 
        'foo': true
    };


vows.describe('inflater')
    .addBatch({
        'simple': { 
            topic: new inflate.Inflater({
                'type1': type1,
                'type2': type2,
                'type_with_init': type_with_init,
                'type_with_init_args': type_with_init_args,
                'type_that_modifies': type_that_modifies
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
                var obj = inflater.inflate({c: 1}, null, 'type1');
                assert.equal(obj.__proto__, type1);
                assert.equal(obj.a, true);
                assert.equal(obj.b, false);
                assert.equal(obj.c, 1);
            },
            'inflate with dataType': function(inflater) { 
                var obj = inflater.inflate({c: 1, $datatype: 'type1'});
                assert.equal(obj.__proto__, type1);
            },
            'inflate with init': function(inflater) { 
                var obj = inflater.inflate({$datatype: 'type_with_init'});
                assert.equal(obj.inited, true);
            },
            'inflate with init args': function(inflater) { 
                var obj = inflater.inflate({$datatype: 'type_with_init_args'}, ['a']);
                assert.equal(obj.arg, 'a');
            },
            'functions': function(inflater) { 
                var obj = inflater.inflate({c: 1, $datatype: 'type2'});
                assert.equal(obj.returnthis('c'), 1);
            },
            'replace object': function(inflater) { 
                var obj = inflater.inflate({c: 1, $datatype: 'type_that_modifies'});
                assert.ok( obj instanceof SomeType );
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
