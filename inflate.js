var _ = require('underscore');

function InflaterNotFound(type, message) { 
    this.message = message || 'Inflater not found for "'+type+'"';
    this.type = type;
}
Inflater.prototype = Error.prototype;

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
Inflater.prototype.inflate = function(obj, args, datatype) { 
    var ret;
    obj.__proto__ = this.get(datatype || obj.$datatype);
    if( obj.init ) { 
        ret = obj.__proto__.init.apply(obj, args);
        if( ret !== undefined ) return ret;
    }
    return obj;
};
Inflater.prototype.extend = function(more) { 
    this.inflaters = _.extend(this.inflaters, more);
    return this;
};

exports.Inflater = Inflater;
exports.default_inflater = new Inflater();
exports.InflaterNotFound = InflaterNotFound;


