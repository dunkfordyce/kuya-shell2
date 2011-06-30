var _ = require('underscore'),
    O = require('kuya-O'),
    env = require('./env'),
    command_list = require('./command_list'),
    defer = require('./deferred');

var context_c = 0;

var Context = {
    $deflate: {
        id: 'Context'
    },

    default_commands: null,

    create: function(options) { 
        options = options || {};
        var inst = {};
        inst.id = options.id || (++context_c);
        if( options.env ) { 
            if( O.instanceOf(options.env, env.Env) ) { inst.env = options.env; }
            else { inst.env = env.Env.create(options.env); }
        } else {
            inst.env = env.Env.create();
        }
        if( options.commands ) { 
            if( O.instanceOf(options.commands, command_list.CommandList ) ) { 
                inst.commands = options.commands; 
            } else {
                inst.commands = command_list.CommandList.create(options.commands);
            }
        } else {
            inst.commands = command_list.CommandList.create(this.default_commands);
        }
        
        var ret = O.spawn(Context, inst);
        return ret;
    }
};


exports.Context = Context;

O.default_registry.add(Context);
