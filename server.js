var express = require('express'),
    Context = require('./context').Context,
    defer = require('jsdeferred'),
    _ = require('underscore');

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
            path: context.path
        } );
    },
    show: function(req, res) { 
        console.log(req.context);
        res.send(true);
    }
});

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
/*
 * 1 filelist
 * 2 jgrep
 *
 * 1.call()
 * 2.call() <- wait on 1
 */
context_res.add(app.resource('chain', {
    create: function(req, res) { 
        console.log(req.body);
        var calls = req.body.calls,
            context = req.context;
        _.values(calls).forEach(function(call) { 
            call.retval = null;
            call.used_output = false;
            call.ret = defer.Deferred();
            if( call.input !== null ) { call.input = calls[call.input]; }
            call._call = function() { 
                console.log('executing call', call.id);
                var cmd = context[call.cmd];
                cmd.call(context, call.args, call.options, call.input ? call.input.retval : null).then(function(ret) { 
                    console.log('finished cmd', call.cmd, call.args, ret);
                    call.retval = ret;
                    call.ret.resolve(ret);
                });
            };
            call.call = function() { 
                if( call.input ) { 
                    console.log('call', call.id, 'waiting on', call.input.id);
                    call.input.used_output = true;
                    call.input.ret.then(call._call); 
                } else { 
                    call._call(); 
                }
            };
        });
        
        defer.when.apply(null, _.map(_.values(calls), function(call) { 
            call.call();
            return call.ret;
        })).then(function() { 
            console.log('all resolved');
            var ret = {};
            _.values(calls).forEach(function(call) { 
                if( req.body.debug || !call.used_output ) { 
                    ret[call.id] = call.retval;
                }
            });
            console.log('sending', ret);
            res.send(ret);
        });
    }
}));

console.log('listening on 3000');
app.listen(3000);
