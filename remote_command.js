var O = require('kuya-O');

var RemoteCommand = {
    $deflate: { 
        id: 'RemoteCommand',
        inflater: function(obj, ctx) { 
            obj = O.spawn(this, obj);
            var f = function() {
                return obj.apply(obj, arguments);
            };
            f.call = function() { 
                return obj.call.apply(obj, arguments);
            };
            f.apply = function() { 
                return obj.apply.apply(obj, arguments);
            };
            return f;
        }
    },

    call: function() { 
        var args = Array.prototype.slice.apply(arguments),
            _this = args.shift();
        return this.apply(_this, args);
    },
    apply: function(_this, args) { 
        console.error('calling remote command', this);
    }
};

exports.RemoteCommand = RemoteCommand;

O.default_registry.add(RemoteCommand);
