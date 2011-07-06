var O = require('kuya-O'),
    parser = require('./command_parser99'),
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
        }, ready.resolve);
    });
});



var CURSOR = '\uFEFF';

function contains_cursor(s) { return s.indexOf(CURSOR) !== -1; }

function parse(input, command) { 
    command = command || Command.create();
    var pcmd = parser.parse(input)[0];
    var new_args = [], new_opts = {}, view_opts = {}, cursor = false;
    command.data.command = pcmd.command;
    if( contains_cursor(pcmd.command) ) {
        cursor = {inside: 'command'};
    }
    command.orig_args = pcmd.args || [];
    _.each(pcmd.args, function(arg, idx) { 
        console.log(arg, idx);
        if( arg.option ) { 
            if( !cursor ) { 
                if( contains_cursor(arg.option) ) { 
                    cursor = {inside: 'option', idx: idx}; 
                } else if( typeof arg.arg == 'string' && contains_cursor(arg.arg) ) { 
                    cursor = {inside: 'optionarg', idx: idx};
                }
            }
            if( arg.prefix[0] == '-' ) { 
                new_opts[arg.option] = arg.arg || true; 
            } else { 
                view_opts[arg.option] = arg.arg || true; 
            }
        } else {
            if( !cursor && contains_cursor(arg.arg) ) { 
                cursor = {inside: 'arg', idx: idx};
            }
            new_args.push(arg.arg); 
        }
    });
    command.data.args = new_args;
    command.data.options = new_opts;
    command.view_options = view_opts;
    command.meta = ctx.commands[command.data.command];
    if( !command.cursor || cursor.inside != command.cursor.inside || cursor.inside.arg !== cursor.arg ) { 
        command.cursor = cursor;
        console.log('cursor now in', cursor);
    }
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
    options_meta: {
        sort: {
            type: {choice: ['ctime', 'mtime', 'size', 'name']}
        },
        "sort-reverse": { 
            type: 'bool' 
        }
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
    //console.log($script, cls_name, cls, mode, template);
    cls.renderers.add(mode, function() { return template(this); });
});


var Command = {
    create: function(data) { 
        return O.spawn(this, {
            data: _.extend(data || {}, {
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

var next_command = null;

function execute(command) { 
    console.dir(command);
    window.c = command;
    var $command = $(render_command_wrapper({command: command})).appendTo($target);
    command.execute().always(function(r) {
        console.log(r);
        if( r ) { 
            $command.find('.command-output').html( r.render(command.view_options) );
        }
    });
    console.log('done execute');
}

window.p = parse;
window.e = execute;

var render_cli = window.render_cli = _.template($('#cli-template').text());

var last = null;

ready.then(function() { 

    $('#cli-target').fakeinput({
        parse: function(v) { 
            console.log('parse', v);
            if( v.length == 1 ) { return v; }               
            next_command = parse(v, next_command);
            return render_cli(next_command);
        }
    }).click();
    var $input = $('#cli-target').fakeinput('input').keyup(function(e) { 
        if( e.which == 13 ) { 
            var v = $input.val().replace('\uFEFF', '');
            next_command = parse(v, next_command);
            execute(next_command);
            next_command = null;
            $input.val('').change();
        }
    });
});

/*
var $input = $('#input').keyup(function(e) { 
    var v = $input.val();
    if( e.which == 13 ) { 
        execute(next_command);
        next_command = null;
        $input.val('');
    } else {
        if( last !== v ) {
            last = v;
            next_command = parse($input.val(), next_command);
            console.dir(next_command);
            $('#cli').html( render_cli(next_command) );
        }
        console.log($input[0].selectionStart);
    }
}).focus();
*/

var hints = (function() { 
    var $el = $('#hint-wrapper'),
        exports = {};

    

    return exports;
})();
