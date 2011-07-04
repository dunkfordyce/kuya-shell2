var O = require('kuya-O'),
    parser = require('./command_parser'),
    $ = require('jquery-browserify'),
    eventemitter = require('eventemitter2'),
    _ = window._ = require('underscore');

var remote = null,
    ctx = null,
    ready = $.Deferred();

var RemoteContext = O.spawn(eventemitter.EventEmitter2.prototype, {
    create: function(props) { 
        var inst = O.spawn(this, props);
        eventemitter.EventEmitter2.call(inst);
        return inst;
    }
});

DNode.connect(function (in_remote) {
    remote = window.remote = in_remote;

    ready.resolve();

    remote.context.create(function(in_ctx) {
        ctx = window.ctx = RemoteContext.create(in_ctx);
        ctx.on('env/changed', function(evname, changed) { 
            console.log('env changed', changed);
            _.extend(ctx.env, changed);
            console.log('env now...');
            console.dir(ctx.env);
        });
        ctx.init_remote({
            emit: function(ev, args) { 
                console.log('emit', ev, args, arguments);
                ctx.emit(ev, args);
            }
        });
    });
});

function parse(input) { 
    var command = parser.parse(input)[0].command;
    var new_args = [], new_opts = {}, view_opts = {};
    _.each(command.args, function(arg) { 
        if( arg.option ) { new_opts[arg.option] = arg.arg || true; }
        else if( arg.viewoption ) { view_opts[arg.viewoption] = arg.arg || true; }
        else { new_args.push(arg.argument); }
    });
    command.args = new_args;
    command.options = new_opts;
    command.view_options = view_opts;
    console.log('parsed', input, command);
    return command;
}

var Renderers = {
    create: function(initial) { 
        return O.spawn(this, {modes: {}}).extend(initial);
    },
    get: function(mode) { 
        var r = this.modes[mode];
        if( !r ) { throw new Error('no such mode "'+mode+'"'); }
        return r;
    },
    add: function(mode, func) { 
        this.modes[mode] = func;
        return this;
    },
    extend: function(more) { 
        var self = this;
        _.each(more, function(func, mode) { self.add(mode, func); });
        return this;
    }
};

var FileList = {
    $deflate: {
        id: 'FileList'/*,
        inflate: function(obj, ctx) { 
            var o = O.default_inflate(obj, ctx);
    
            return o;
        }
    */
    },
    renderers: Renderers.create(),
    render: function(view_opts) { 
        if( !this.sorted && view_opts.d ) { 
            this.files.sort(function(a, b) { 
                if     ( a.filename > b.filename ) return 1;
                else if( a.filename < b.filename ) return -1;
                return 0;
            });
        }
        return this.renderers.get(view_opts.mode || 'default').call(this);
    }
};
O.default_registry.add(FileList);


$('script[type=text/html][data-template-for]').each(function() { 
    var $script = $(this),
        cls_name = $script.data('template-for'),
        cls = O.default_registry.get(cls_name),
        mode = $script.data('template-mode'),
        template = _.template($script.text());   
    console.log($script, cls_name, cls, mode, template);
    cls.renderers.add(mode, function() { return template(this); });
});


var Command = {
    create: function(data) { 
        return O.spawn(this, {
            data: _.extend(data, {
                id: _.uniqueId()
            }),
            result: $.Deferred()
        });
    },


    execute: function() { 
        var self = this,
            p = $.Deferred().done(function(r) { self.result.resolve(O.inflate(r)); });
        console.log('execute', this.data);
        ctx.execute(this.data, p.resolve);
        return this.result;
    }
};

var $target = $('#output');

var render_command_wrapper = _.template( $('#command-output').text() );

function execute(input, cb) { 
    var command = Command.create(parse(input));
    console.dir(command);
    window.c = command;
    command.execute().always(function(r) {
        console.log(r);
        if( r ) { 
            $target.append(
                render_command_wrapper({
                    output: r.render(command.data.view_options)
                })
            );
        }
    });
    console.log('done execute');
}

window.p = parse;
window.e = execute;

var render_cli = _.template($('#cli').text());

var last = null;

var $input = $('#input').keyup(function(e) { 
    console.log(e.which);
    var v = $input.val();
    if( last !== v ) {
        last = v;
        var command = parse($input.val());
        console.dir(command);
        $('#output').html( render_cli(command) );
    }
}).focus();
