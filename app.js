var O = require('kuya-O'),
    _ = require('underscore'),
    express = require('express'),
    browserify = require('browserify'),
    Context = require('./context-server').ServerContext,
    app = express.createServer();

app.use(express.static(__dirname+'/public'));

app.use(express.bodyParser());

app.error(function(err, req, res, next) { 
    res.send({
        $datatype: 'error',
        data: err
    }, 200);
});

//app.get ('/context/new', context.create);
//app.all ('/context/:id/*', context.load_context);
//app.post('/context/:id/execute', context.execute);

app.use(browserify({
    require: [
        './client'
    ],
    watch: true
}));

var sio = require('socket.io'),
    io = sio.listen(app),
    contexts = {};

console.error(io);

var default_commands = {
        ls: require('./commands/ls').ls,
        select: require('./commands/select').select
    },
    default_env = {
        home: process.env.HOME,
        cwd: process.env.HOME
    };

var dnode = require('dnode');
var server = dnode({
    context_create: function (cb) { 
        var ctx = Context.create({commands: default_commands, env: default_env});
        contexts[ctx.id] = ctx;
        cb(O.deflate(ctx, {mode:'remote'}));
        console.log('created context', ctx);
    },
    context_refresh: function(ctx_ref, cb) { 
        cb(O.deflate(contexts[ctx_ref.$ref]));
    },
    context_foo: function(cb) { 
        console.log('context_foo', arguments);
        var ctx = Context.create({commands: default_commands, env: default_env});
        contexts[ctx.id] = ctx;
        cb(ctx);
    }
});
server.listen(app);

/*
io.sockets.on('connection', function (socket) {
    socket.on('createcontext', function() { 
        var ctx = Context.create({commands: default_commands, env: default_env});
        contexts[ctx.id] = ctx;
        socket.emit('createcontext/reply', O.deflate(ctx, {mode:'remote'})); 
        console.log('created context', ctx);
    });
    socket.on('context/execute_command', function(ctxref, cmd, cb) {
        console.log('looking for ctx', ctxref.$ref);
        var ctx = contexts[ctxref.$ref];
        console.log(contexts);
        console.log('got context', ctx);
        var p = ctx.execute_command.apply(ctx, cmd).always(cb);
    });
});
*/

exports.app = app;

if( !module.parent ) { 
    console.log('listening on 3000');
    app.listen(3000);

}

