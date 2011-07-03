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
    _changed: false,
    get: function(key) { 
        return this.data[key];
    },
    set: function(key, val) { 
        this.data[key] = val;
        if( !this._changed ) { this._changed = {}; }
        this._changed[key] = val;
        return this;
    },
    extend: function(more) { 
        var self = this;
        _.each(more, function(v, k) { 
            self.set(k, v);
        });
        return this;
    },
    is_changed: function() { return this._changed; },
    changed: function() { 
        return this._changed;
    },
    unset_changed: function() { 
        this._changed = false;
        return this;
    }
};

exports.Env = Env;
O.default_registry.add(Env);
