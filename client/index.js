var O = require('kuya-O'),
    parser = require('../command_parser99'),
    $ = require('jquery-browserify'),
    _ = window._ = require('underscore'),
    context = require('./context'),
    renderers = require('./renderers');

require('./viewtypes/filelist');
renderers.register_templates();

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
    command.meta = context.current.commands[command.data.command];
    if( !command.cursor || cursor.inside != command.cursor.inside || cursor.inside.arg !== cursor.arg ) { 
        command.cursor = cursor;
        console.log('cursor now in', cursor);
    }
    return command;
}





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

context.current_ready.then(function() { 
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
