var _ = require('underscore'),
    inflater = require('./inflate').default_inflater;

function Env(initial) { 
    this.env = initial || {};
    this.changed = false;
}
Env.prototype.deflate = function() { 
    return {
        $datatype: 'env',
        data: this.env
    };
};
Env.inflate = {
    init: function() { 
        return new Env(this.data);
    }
};
Env.prototype.get = function(key) { 
    return this.env[key];
};
Env.prototype.set = function(key, val) { 
    this.env[key] = val;
    this.changed = true;
    return this;
};
Env.prototype.extend = function(more) { 
    if( this.changed ) { 
        _.extend(this.env, more);
    } else {
        var self = this;
        _.each(more, function(v, k) { 
            if( self.env[k] != v ) { 
                self.changed = true;
                self.env[k] = v;
            }
        });
    }
    return this;
};
Env.prototype.is_changed = function() { return this.changed; };

exports.Env = Env;
inflater.extend({'env': Env.inflate});
