var _ = require('underscore'),
    O = require('kuya-O'),
    env = require('./env'),
    command_list = require('./command_list');

var context_c = 0;

var Context = {
    $type: 'context',
    $deflate: {
        id: 'context'
    },

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
        
        var ret = O.spawn(Context, inst);
        return ret;
    }
};

exports.Context = Context;

O.default_registry.add(Context);
