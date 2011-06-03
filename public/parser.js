var r1 = /("|'|\s+)/;
var qm = /([^\\])"/;

function quote_split(input) { 

    var tokens = [],
        current = '',
        t, v,
        z =0 ;

    while( true ) { 
        input = input.trim();
        if( input[0] === '"' ) { 
            input = input.substring(1);
            v = qm.exec(input);
            t = input.substring(0, v.index+v[0].length-1);
            var off = v[0].length;
            input = input.substring(v.index + off);
            tokens.push(t);
        } else {
            v = r1.exec(input);
            if( v === null ) { 
                tokens.push(input);
                break;
            }
            t = input.substring(0, v.index);
            input = input.substring(v.index+1);
            tokens.push(t);
        }
    }
    return tokens;
}

function commands_split(tokens) { 
    var out = [],
        c = [],
        t = tokens.shift();

    while(t !== undefined ) { 
        if( t == '|' || t == ';' || t == '!' ) { 
            out.push(c);
            c = [t];
        } else {
            c.push(t);
        }
        t = tokens.shift();
    }
    out.push(c);
    return out;
}

function test() { 
    console.log(quote_split('a b c | d e f'));
    console.log(quote_split('hello "a \"b c" d').join(' '));

    console.log(commands_split(quote_split('a b c | d e f')));
}

