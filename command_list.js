var _ = require('underscore'),
    O = require('kuya-O');

exports.describe = function(meta, f) { 
    f.meta = meta;
    return f;
};

function CommandNotFound(command) { 
    this.command = command;
    this.message = 'Command Not Found "'+command+'"';
}
CommandNotFound.prototype = Error.prototype;

var CommandList = {
    $deflate: { 
        id: 'CommandList',
        deflater: function(obj, ctx) { 
            if( ctx.mode != 'remote' ) { 
                return O.default_deflate(obj, ctx);
            };
            var commands = {};
            
            _.each(obj.commands, function(o, n) { 
                commands[n] = _.clone(o);
                commands[n].func = {$inflate: 'RemoteCommand'};
            });

            return {
                $inflate: 'CommandList', 
                default: obj.default,
                commands: commands
            };
        }
    },

    create: function(initial) { 
        var ret = O.spawn(CommandList, {
            commands: {},
            default: null,
        });
        ret.extend(initial);
        return ret;
    },

    get: function(name) { 
        var cmd = this.commands[name] || this.default;
        if( !cmd ) { 
            console.log('didnt find', name, this.commands);
            throw new CommandNotFound(name); 
        }
        return cmd;
    },
    get_meta: function(name) { 
        return this.get(name).meta;
    },
    get_func: function(name) { 
        return this.get(name).func;
    },
    get_all_meta: function() { 
        var ret = {};
        _.each(this.commands, function(cmd, name) { 
            ret[name] = cmd.meta;
        });
        return ret;
    },
    _fix_meta: function(cmd) { 
        cmd.meta.args =cmd.meta.args || cmd.func.length;
    },
    add: function(name, func, meta) { 
        this.commands[name] = {func: func, meta: _.extend({}, func.meta, meta)};
        this._fix_meta(this.commands[name]);
        return this;
    },
    extend: function(commands) { 
        var self = this;
        _.each(commands, function(func, key) { 
            self.add(key, func);
        });
        return this;
    }
};

exports.CommandNotFound = CommandNotFound;
exports.CommandList = CommandList;
O.default_registry.add(CommandList);

