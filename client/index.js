var O = require('kuya-O'),
    parser = require('../command_parser99'),
    $ = window.$ = require('jquery-browserify'),
    _ = window._ = require('underscore'),
    context = require('./context'),
    renderers = require('./renderers'),
    fakeinput = require('./input'),
    eventemitter = require('eventemitter2'),
    events = new eventemitter.EventEmitter2;


/*
// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
_.template = function(str, data) {
var c  = _.templateSettings;
var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
  'with(other||{}){ '+
  'with(obj||{}){__p.push(\'' +
  str.replace(/\\/g, '\\\\')
     .replace(/'/g, "\\'")
     .replace(c.interpolate, function(match, code) {
       return "'," + code.replace(/\\'/g, "'") + ",'";
     })
     .replace(c.evaluate || null, function(match, code) {
       return "');" + code.replace(/\\'/g, "'")
                          .replace(/[\r\n\t]/g, ' ') + "__p.push('";
     })
     .replace(/\r/g, '\\r')
     .replace(/\n/g, '\\n')
     .replace(/\t/g, '\\t')
     + "');}}return __p.join('');";
var func = new Function('obj', 'other', tmpl);
return data ? func(data) : func;
};
*/


require('./viewtypes/filelist');
renderers.register_templates();

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
        context.current.execute(this.data, p.resolve);
        return this.result;
    }
};


var $target = $('#output'),
    render_command_wrapper = _.template( $('#command-output').text() ),
    render_cli = window.render_cli = _.template( $('#cli-template').text() ),
    next_command = null;


function execute(command) { 
    var $command = $(render_command_wrapper({command: command})).appendTo($target);
    $target.animate({scrollTop: $target.prop("scrollHeight")} );
    command.execute().always(function(r) {
        console.log('execute', command, r|| 'no result');
        if( r ) { 
            $command.find('.command-output').html( r.render(command.view_options) );
            $target.scrollTop( $target.prop("scrollHeight") );
        }
    });
}

function update_command(v, cmd) { 
    cmd = cmd || Command.create();

    console.log('update command', v, cmd);

    var pcmd = parser.parse(v)[0],
        new_args = [], 
        new_opts = {}, 
        view_opts = {}, 
        cursor = false,
        contains_cursor = this.contains_cursor.bind(this);

    cmd.data.command = pcmd.command;
    if( contains_cursor(pcmd.command) ) {
        cursor = {inside: 'command'};
    }

    cmd.orig_args = pcmd.args || [];

    _.each(pcmd.args, function(arg, idx) { 
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
    cmd.data.args = new_args;
    cmd.data.options = new_opts;
    cmd.view_options = view_opts;
    cmd.meta = context.current.commands[cmd.data.command];
    if( !cmd.cursor 
        || cursor.inside != cmd.cursor.inside 
        || cursor.arg !== cmd.cursor.arg 
    ) { 
        cmd.cursor = cursor;
        console.log('cursor now in', cursor);
        //events.emit('cursor_inside', cmd);
    }
    events.emit('cursor_inside', cmd);
    return cmd;
}


context.current_ready.then(function() { 
    var $input = $('#cli-target').fakeinput({
        parse: function(v) { 
            console.log('parse', v);
            if( v.length == 1 ) { return v; }               
            next_command = update_command.call(this, v, next_command);
            return render_cli(next_command);
        },
        onenter: function(e, v) { 
            next_command = update_command.call(this, v, next_command);
            execute(next_command);
            next_command = null;
            this.val('');
        }
    });
    $input.click();
    ctx.on('env/changed', function(evname, changed) { 
        if( 'cwd' in changed ) { 
            $input.fakeinput('prefix').html(ctx.env.cwd);
        }
    });
});

var hints = (function() { 
    var $wrapper = $('#hint-wrapper'),
        $el = $('#hint'),
        interf = {},
        template_command = _.template( $('#template-hints-command').text() );

    return;

    function match_commands(cmd) { 
        var matching = [];
        _.each(ctx.commands, function(meta, name) { 
            console.log('match', meta, name, cmd, name.indexOf(cmd), name.charCodeAt(0), cmd.charCodeAt(0));
            if( name.indexOf(cmd) === 0 ) { 
                matching.push({name: name, meta: meta});
            }
        });
        matching.sort(function(a, b) { 
            if( a.name > b.name ) return 1;
            else if( a.name < b.name ) return -1;
            return 0;
        });
        console.log('match_commands', cmd, matching);
        return matching;
    }

    function do_command(cmd) { 
        $el.html(template_command({matching: match_commands(cmd.data.command.replace('\uFEFF', ''))}));
    }

    function do_option(cmd) {
        $el.html('option');
    }

    function do_arg(cmd) { 
        $el.html('arg');
    }

    $wrapper.show();

    events.on('cursor_inside', function(ev, cmd) { 
        console.log('hints, cursor inside', cmd);
        switch( cmd.cursor.inside ) { 
            case "command": 
                do_command(cmd);           
                break;
            case "option":
                do_option(cmd);
                break;
            case "arg":
                do_arg(cmd);
                break;
        }
    });

    return interf;
})();
