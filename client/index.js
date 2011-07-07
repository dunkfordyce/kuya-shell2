var O = require('kuya-O'),
    parser = require('../command_parser99'),
    $ = window.$ = require('jquery-browserify'),
    _ = window._ = require('underscore'),
    context = require('./context'),
    renderers = require('./renderers'),
    fakeinput = require('./input');

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
    next_command = null;


function parse(input, command) { 
    return command;
}

function execute(command) { 
    var $command = $(render_command_wrapper({command: command})).appendTo($target);
    $target.animate({scrollTop: $target.prop("scrollHeight")} );
    command.execute().always(function(r) {
        if( r ) { 
            $command.find('.command-output').html( r.render(command.view_options) );
            $target.scrollTop( $target.prop("scrollHeight") );
        }
    });
}

var render_cli = window.render_cli = _.template($('#cli-template').text());


function update_command(v, cmd) { 
    cmd = cmd || Command.create();

    console.log('update command', v, cmd);

    var pcmd = parser.parse(v)[0],
        new_args = [], 
        new_opts = {}, 
        view_opts = {}, 
        cursor = false;

    cmd.data.command = pcmd.command;
    if( this.contains_cursor(pcmd.command) ) {
        cursor = {inside: 'command'};
    }

    cmd.orig_args = pcmd.args || [];

    _.each(pcmd.args, function(arg, idx) { 
        if( arg.option ) { 
            if( !cursor ) { 
                if( this.contains_cursor(arg.option) ) { 
                    cursor = {inside: 'option', idx: idx}; 
                } else if( typeof arg.arg == 'string' && this.contains_cursor(arg.arg) ) { 
                    cursor = {inside: 'optionarg', idx: idx};
                }
            }
            if( arg.prefix[0] == '-' ) { 
                new_opts[arg.option] = arg.arg || true; 
            } else { 
                view_opts[arg.option] = arg.arg || true; 
            }
        } else {
            if( !cursor && this.contains_cursor(arg.arg) ) { 
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
    }
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
});

/*
var hints = (function() { 
    var $el = $('#hint-wrapper'),
        exports = {};

    

    return exports;
})();
*/
