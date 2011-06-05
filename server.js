var express = require('express'),
    Context = require('./context').Context,
    defer = require('./deferred'),
    _ = require('underscore'),
    fs = require('fs');

require('express-resource');


var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

var contexts = {},
    context_c = 0;

var context_res = app.resource('context', {
    load: function(id, fn) { 
        fn(null, contexts[id]);
    },
    create: function(req, res) { 
        console.log('here');
        var id = context_c ++,
            context = contexts[id] = new Context();

        res.send( {
            id: id,
            path: context.path,
            env: context.env
        } );
    },
    show: function(req, res) { 
        console.log(req.context);
        res.send(true);
    }
});

context_res.add(app.resource('fs', {
    index: function(req, res) { 
        console.log('fs', req.query.path);
        fs.stat(req.query.path, function(err, s) { 
            console.log('fs', s);
            res.send(s);
        });
    }
}));

context_res.add(app.resource('command', {
    create: function(req, res) { 
        console.log(req.body);

        var cmd = req.context[req.body.cmd];
        console.log('cmd', cmd);
        console.log('args', req.body.args);
        cmd.apply(req.context, req.body.args).then(function(ret) { 
            res.send(ret.serialize());
        });
    }
}));

context_res.add(app.resource('chain', {
    create: function(req, res) { 
        var calls = req.body.chain.calls,
            context = new Context();
        context.path = req.body.context.path;
        context.execute_chain({calls: calls, debug: req.body.debug})
            .then(function(r) { 
                res.send(r);
            })
        ;
    }
}));

console.log('listening on 3000');
app.listen(3000);

var io = require('socket.io'); 
var socket = io.listen(app); 
socket.on('connection', function(client) { 
    console.log('connection!', client);    
    client.on('message', function(call){ 
        var context = new Context();
        context.path = call.context.path;
        context.execute_chain({calls: call.chain.calls, debug: call.chain.debug})
            .then(function(r) { 
                client.send({id: call.id, ret: r});
            })
        ;
    }); 
    client.on('disconnect', function(){ console.log('disconect', arguments); });
});


