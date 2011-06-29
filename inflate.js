var _ = require('underscore');

function InflaterNotFound(type, message) { 
    this.message = message || 'Inflater not found for "'+type+'"';
    this.type = type;
}
InflaterNotFound.prototype = Error.prototype;


function Inflater(initial, default_inflater) { 
    this.inflaters = initial || {};
    this.default_inflater = default_inflater;
}
Inflater.prototype.get = function(datatype) { 
    var inflater = this.inflaters[datatype] || this.default_inflater;
    if( !inflater ) { 
        throw new InflaterNotFound(datatype);
    }
    return inflater;
};
Inflater.prototype.inflate = function(obj, ctx) { 
    var f = this.get(obj.$datatype),
        r = _.isFunction(f) ? f.call(this, ctx) : _.extend(obj.data, f);
    return r === undefined ? obj : r;
};
Inflater.prototype.extend = function(more) { 
    this.inflaters = _.extend(this.inflaters, more);
    return this;
};

exports.Inflater = Inflater;
exports.default_inflater = new Inflater({
    'error': {
        init: function() { 
            console.error(this.data);
        }
    }
});
exports.InflaterNotFound = InflaterNotFound;


