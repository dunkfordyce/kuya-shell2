var O = require('kuya-O'),
    _ = require('underscore'),
    eventemitter = require('eventemitter2');

exports.current = null;
exports.remote = null;
exports.current_ready = $.Deferred();

var RemoteContext = O.spawn(eventemitter.EventEmitter2.prototype, {
    create: function(props) { 
        var inst = O.spawn(this, props);
        eventemitter.EventEmitter2.call(inst);
        return inst;
    }
});

DNode.connect(function (in_remote) {
    exports.remote = window.remote = in_remote;

    exports.remote.context.create(function(in_ctx) {
        exports.current = window.ctx = RemoteContext.create(in_ctx);
        exports.current.on('env/changed', function(evname, changed) { 
            _.extend(exports.current.env, changed);
        });
        exports.current.init_remote({
            emit: function(ev, args) { 
                console.log('emit', ev, args, arguments);
                exports.current.emit(ev, args);
            }
        }, exports.current_ready.resolve);
    });
});
