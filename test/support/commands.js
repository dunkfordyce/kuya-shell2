
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
    can_run_in_browser: function() { 
        return true;
    }
});

exports.test_commands.commands.can_run_in_browser.meta = {
    out_of_server: true
};

