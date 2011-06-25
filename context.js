var _ = require('underscore'),
    defer = require('./deferred'),
    inflater = require('./inflate').default_inflater,
    env = require('./env'),
    command_list = require('./command_list');


function DataTypeError(message) {
    this.message = message || '';
}
DataTypeError.prototype = Error.prototype;
exports.DataTypeError = DataTypeError;


function RemoteCommand() {};
exports.RemoteCommand = RemoteCommand;

var context_c = 0;

function Context(options) { 
    options = options || {};
    this.id = options.id || (++context_c);
    if( options.env ) { 
        if( options.env.$datatype ) { this.env = inflater.inflate(options.env); }
        else if( options.env instanceof env.Env ) { this.env = options.env; }
        else { this.env = new env.Env(options.env); }
    } else {
        this.env = new Env();
    }
    if( options.commands && options.commands.$datatype ) { 
        this.commands = inflater.inflate(options.commands);
    } else {
        this.commands = options.commands || (new command_list.CommandList());
    }
}
Context.prototype.deflate = function() { 
    return {
        $datatype: 'context',
        data: {
            id: this.id,
            env: this.env.deflate(),
            commands: this.commands.deflate()
        }
    };
};
Context.inflate = {
    init: function() { 
        return new Context(this.data);
    }
};

exports.Context = Context;

inflater.extend({'context': Context.inflate});
