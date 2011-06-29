var O = require('kuya-O'),
    remote_command = require('./remote_command'),
    $ = require('jquery-browserify');

var CommandCall = {
    $deflate: { 
        id: 'CommandCall'
    },

    create: function(cmd, args, options, input) { 
        return O.spawn(CommandCall, {
            cmd: cmd,
            args: args,
            options: options,
            input: input
        });
    }
};

O.default_registry.add(CommandCall);

var JQueryRemoteCommand = O.spawn(remote_command.RemoteCommand, {
    apply: function(_this, args) { 
        try { 
        console.log(this, _this, args);
        var data = O.deflate(CommandCall.create(_this.cmd_name, args, _this.options, _this.input));
        console.log('data',data);
        return $.ajax('/context/'+this.context.id+'/execut', {
            data: data
        });
        } catch(e) { 
            console.log(e);
        }
    } 
});

exports.JQueryRemoteCommand = JQueryRemoteCommand;

O.default_registry.add(JQueryRemoteCommand);

