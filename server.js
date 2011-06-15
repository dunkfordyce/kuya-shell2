var express = require('express'),
    Context = require('./context').Context,
    defer = require('./deferred'),
    _ = require('underscore'),
    fs = require('fs');

require('express-resource');

var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());


app.get('/constants/fs.json', function(req, res) { 
    res.send(process.binding('constants'));
});

app.get('/constants/mime.json', function(req, res) { 
    res.send(require('mime').types);   
});

var mime_icons = {};
(function() { 
    var lines = fs.readFileSync('/usr/share/mime/generic-icons', 'ascii').split(/[\r\n]+/);
    lines.forEach(function(line) { 
        var p = line.split(':');
        mime_icons[p[0]] = p[1];
    });
})();
mime_icons['text/plain'] = 'text-x-generic';

app.get('/icon/mime', function(req, res) { 
    var mtype = req.query.type;
    res.contentType('image/png');
    fs.readFile('/usr/share/icons/gnome/16x16/mimetypes/'+mime_icons[mtype]+'.png', function(err, data) { 
        if( err ) { 
            fs.readFile('/usr/share/icons/gnome/16x16/mimetypes/unknown.png', function(err, data) { 
                res.send(data);
            });
        } else {
            res.send(data);
        }
    });
});

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

context_res.add(app.resource('command', {
    create: function(req, res) { 
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


