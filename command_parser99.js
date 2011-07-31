function parse(str) { 

    var ctx = {
        str: str,
        p: 0,
        always: function() { 
            return test_eol(ctx) && test_eoc(ctx);
        }
    };

    var commands = [], cmd;

    while( test_eol(ctx) ) {
        console.log('start loop', ctx.str.substring(ctx.p));
        parse_whitespace(ctx);
        cmd = {
            command: parse_string(ctx),
            args: []
        };
        commands.push(cmd);
        parse_whitespace(ctx);
        var opt=null, view_opt=null, arg=null;
        while( ctx.always() && ((opt = parse_option(ctx)) || (opt = parse_view_option(ctx)) || (arg = parse_string(ctx))) ) { 
            if( opt ) { 
                //console.log('option', opt);
                cmd.args.push(opt);
            } else { 
                //console.log('arg', arg);
                cmd.args.push({arg: arg});
            }
            parse_whitespace(ctx);
            opt = view_opt = arg = null;
        };

        parse_whitespace(ctx);
        if( !test_eoc(ctx) ) { 
            ctx.p ++;
        }
        if( !cmd.args.length ) { 
            delete cmd.args;
        }
    }
    return commands;
};

exports.parse = parse;

function test_eol(ctx) { 
    //console.log('test_eol', ctx);
    if( ctx.p >= ctx.str.length ) {
        return false;
    }
    return true;
}

function test_eoc(ctx) { 
    if( ctx.str[ctx.p] == ';' ) { 
        return false;
    }
    return true;
}

var _whitespace = /[ \t\uFEFF]/;
function parse_whitespace(ctx) { 
    var ret = '';
    while( ctx.always() && _whitespace.test(ctx.str[ctx.p]) ) { 
        ret += ctx.str[ctx.p];
        ctx.p ++;
    }
    return ret;
};

var _string = /[^ \t]/;
function parse_string(ctx, exclude) { 
    var ret;
    if( ret = parse_quoted_string(ctx) ) { 
        return ret;
    }
    if( ret = parse_single_string(ctx) ) { 
        return ret;
    }
    return false;
};

function parse_single_string(ctx, exclude) { 
    var ret = '';

    while( ctx.always() && ((!exclude || exclude.indexOf(ctx.str[ctx.p]) == -1) && _string.test(ctx.str[ctx.p]) || ctx.str[ctx.p] == '\\') ) {
        ret += ctx.str[ctx.p];
        ctx.p ++;
    }
    return ret;

}

function parse_quoted_string(ctx) { 
    if( ctx.str[ctx.p] != '"' && ctx.str[ctx.p] != "'") { 
        return false;
    }   
    var waitfor = ctx.str[ctx.p],
        ret = '';
    ctx.p ++;
    while( test_eol(ctx) && (ctx.str[ctx.p] == '\\' || ctx.str[ctx.p] != waitfor ) ) { 
        ret += ctx.str[ctx.p];
        ctx.p ++;
    }
    ctx.p ++;
    return ret;
};

function skip_cursor(ctx) { 
    if( ctx.str[ctx.p] == CURSOR ) { 
        ctx.p ++;
    }
}

function make_option_parser(prefixer, type) { 
    return function parse_option(ctx) { 
        skip_cursor(ctx);
        if( ctx.str[ctx.p] != prefixer ) { 
            return false;
        }
        var prefix = ctx.str[ctx.p];
        ctx.p ++;
        skip_cursor(ctx);
        if( ctx.str[ctx.p] == prefixer ) { 
            prefix += prefixer;
            ctx.p++;
        }
        var opt = parse_single_string(ctx, '=');
        var argopt = '';
        if( ctx.str[ctx.p] == '=' ) { 
            ctx.p ++;
            argopt = parse_string(ctx);
        }
        return {option: opt, arg: argopt, prefix: prefix, type: type};
    };
}

var parse_option = make_option_parser('-', 'opt');
var parse_view_option = make_option_parser('+', 'viewopt');
