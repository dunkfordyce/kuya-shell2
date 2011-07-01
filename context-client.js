var O = require('kuya-O'),
    context = require('./context'),
    Context = context.Context;
    //socketio = require('socket.io-client');

var ClientContext = O.spawn(Context, {

    $deflate: { 
        id: 'Context'
    },

    execute_command: function(cmd, args, options, input) { 
        console.log('exec cmd'); 
        this.socket.emit('context/execute_command', 
            O.deflate(this, {mode: 'ref'}),
            [cmd, args, options, input],
            function(ret) {
                console.log('execute command ret', ret);
            }
        );
    },

    execute_chain: function(chain, return_all) { 
        this.socket.emit('context/execute_chain', cmd, args, options, input);
    }
});

exports.ClientContext = ClientContext;
O.default_registry.add(ClientContext);

