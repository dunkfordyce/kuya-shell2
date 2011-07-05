var O = require('kuya-O'),
    _ = require('underscore'),
    fs = require('fs'),
    express = require('express'),
    browserify = require('browserify'),
    Context = require('./context').Context,
    app = express.createServer();

if( fs.statSync('./command_parser.pegjs').mtime > fs.statSync('./command_parser.js').mtime ) { 
    console.log('compiling command parser...');
    var parser = require('pegjs').buildParser(fs.readFileSync('./command_parser.pegjs').toString());
    fs.writeFileSync('./command_parser.js', "module.exports = "+parser.toSource() +";\n");
    console.log('done compiling');
}

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

var default_commands = {
        ls: require('./commands/ls').ls,
        cd: require('./commands/cd').cd,
        select: require('./commands/select').select
    },
    default_env = {
        home: process.env.HOME,
        cwd: process.env.HOME
    };

function context_interface(context) { 
    var other = null;
    return {
        id: context.id,
        env: context.env.data,
        commands: context.commands.get_all_meta(),
        execute: function(command, cb) { 
            console.log('execute', command);
            context.execute_command(command).always(function(r) { 
                cb(O.deflate(r));
                if( context.env.is_changed() ) { 
                    console.log('sending', context.env.changed());
                    other.emit('env/changed', context.env.changed());
                }
            });
            context.env.unset_changed();
        },
        init_remote: function(other_side, cb) { 
            other = other_side;
            cb();
        }
    };
}

function main_interface(client) {
    return {
        context: {
            create: function(cb) { 
                var ctx = Context.create({commands: default_commands, env: default_env});
                contexts[ctx.id] = ctx;
                cb(context_interface(ctx));
                console.log('created context', ctx);
            },
            get: function(id, cb) { 
                cb(context_interface(contexts[id]));
            },
            destroy: function(id, cb) { 
            }
        }
    };
}

var dnode = require('dnode');
var server = dnode(main_interface);
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

