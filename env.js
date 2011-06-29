var _ = require('underscore'),
    O = require('kuya-O');

var Env = { 
    $type: 'env',
    $deflate: {
        id: 'env'
    },
    create: function(initial) { 
        return O.spawn(Env, {
            data: initial || {}
        });
    },
    changed: false,
    get: function(key) { 
        return this.data[key];
    },
    set: function(key, val) { 
        this.data[key] = val;
        this.changed = true;
        return this;
    },
    extend: function(more) { 
        if( this.changed ) { 
            _.extend(this.data, more);
        } else {
            var self = this;
            _.each(more, function(v, k) { 
                if( self.data[k] != v ) { 
                    self.changed = true;
                    self.data[k] = v;
                }
            });
        }
        return this;
    },
    is_changed: function() { return this.changed; }
};

exports.Env = Env;
O.default_registry.add(Env);
