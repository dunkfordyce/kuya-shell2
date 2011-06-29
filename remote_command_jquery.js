var O = require('kuya-O'),
    remote_command = require('./remote_command');

var JQueryRemoteCommand = O.spawn(remote_command.RemoteCommand, {
    apply: function(_this, args) { 
        console.log('jquery remote command', this);
    } 
});

exports.JQueryRemoteCommand = JQueryRemoteCommand;

O.default_registry.add(JQueryRemoteCommand);

