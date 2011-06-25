var _ = require('underscore'),
    inflater = require('./inflate').default_inflater;

exports.describe = function(meta, f) { 
    f.meta = meta;
    return f;
};

function CommandNotFound(command) { 
    this.command = command;
    this.message = 'Command Not Found'
}
CommandNotFound.prototype = Error.prototype;

function CommandList(initial) { 
    this.commands = {};
    this.meta = {};
    if( initial ) this.extend(initial);
    this.default_command = null;
}
CommandList.prototype.get = function(name) { 
    var cmd = this.commands[name] || this.default_command;
    if( !cmd ) { 
        throw new CommandNotFound(name); 
    }
    return cmd;
};
CommandList.prototype.get_meta = function(name) { 
    var meta = this.meta[name] || this.default_command;
    if( !meta ) { 
        throw new CommandNotFound(name);
    }
    return meta;
};
CommandList.prototype._build_meta = function(command, name) { 
    var meta = command.meta || {};
    this.meta[name] = meta;
    meta.args = meta.args || command.length;
};
CommandList.prototype.extend = function(commands) { 
    _.each(commands, function(command, name) { 
        if( command.$datatype ) { commands[name] = inflater.inflate(command); }
    });
    _.each(commands, this._build_meta, this);
    _.extend(this.commands, commands);
    return this;
};
CommandList.prototype.extend_meta = function(metas) { 
    var self = this;
    _.each(metas, function(meta, name) { 
        self.meta[name] = meta;
    });
    return this;
};
CommandList.prototype.deflate = function() { 
    var self = this,
        commands = {};
    _.each(this.commands, function(command, name) { 
        commands[name] = { $datatype: 'command/remotecall' };
    });

    return {
        $datatype: 'commandlist',
        data: {
            meta: this.meta,
            commands: commands
        }
    };   
};
CommandList.inflate = {
    init: function() { 
        return (new CommandList())
            .extend(this.data.commands)
            .extend_meta(this.data.meta)
        ;
    }
};

exports.CommandNotFound = CommandNotFound;
exports.CommandList = CommandList;
inflater.extend({'commandlist': CommandList.inflate});

