
var context = require('../../context');

exports.test_commands = new context.CommandList({
    truefunc: function() { 
        this.result.resolve(true);
    },
    passthru_args: function(args) { 
        this.result.resolve(args);
    },
    passthru_options: function() { 
        this.result.resolve(this.options);
    },
    passthru_input: function() { 
        this.result.resolve(this.input.data);
    },
    append_to_input: function(arg) { 
        this.result.resolve(this.input ? (this.input.data +' '+arg) : arg);
    },
    always_fail: function(arg) { 
        this.result.reject('fail!');
    },
    can_run_in_browser: context.describe({
        out_of_server: true,
    },function() { 
        return true;
    }),
    command_with_description: context.describe({
        description: 'i am a function'
    }, function() { 
        this.result.resolve(true);
    }),
    command_with_options_meta: context.describe({
        options: {
            foo: {
                type: 'string', 
                description: 'i am a string option'
            }
        }
    }, function() { 
        this.result.resolve(this.options.foo);
    }),
});

