start
    = command+

command
    = env:envoverrides _ command:(shellcommand / jscommand) 
    { 
        var r = {command: command};
        if( env ) { 
            r.env = env;
        }
        return r;
    }

envoverrides
    = envs:envoverride* 
    {
        if( !envs.length ) { return undefined; }
        var r = {};
        envs.forEach(function(env) { 
            r[env.key] = env.val;
        });
        return r;
    }

envoverride
    = key:String "=" val:String whitespace 
    { 
        return {key: key, val: val}; 
    }

shellcommand 
    = _ "!" command:shellarg args:shellarg* command_end 
    { 
        var r = {type: 'shell', command: command};
        if( args.length ) { 
            r.args = args;
        }
        return r;
    } 

shellarg 
    = arg:String _ 
    { 
        return arg; 
    }

jscommand 
    = _ command:command_name command_end args:arguments? 
    {
        return {type: 'js', command: command, args: args}; 
    }

command_end
    = whitespace / EOF / ";"

command_name
    = command:String 

arguments
    = args:((option / argument)*) (EOF / ";") 
    { 
        return args.length ? args : undefined; 
    }

option
    = ("--" / "-") option:(String) optionarg:option_arg? _
    { 
        var r = {option: option};
        if( optionarg ) { 
            r.arg = optionarg;
        }
        return r;
    }

option_arg
    = "=" arg:String { return arg; }

argument
    = argument:String  _
    {
        return {argument: argument};
    }

argument_unquoted
    = argument:unqoted_string 

argument_quoted
    = StringLiteral

unqoted_string
    = str:([a-zA-Z0-9_-]+) 
    { 
        return str.join(''); 
    }

not_whitespace
    = !(whitespace) 

String
    = StringLiteral / unqoted_string

StringLiteral "string"
    = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") 
    {
        return parts[1];
    }

DoubleStringCharacters
    = chars:DoubleStringCharacter+ 
    { return chars.join(""); }

SingleStringCharacters
    = chars:SingleStringCharacter+ 
    { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) char_:SourceCharacter { return char_; }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) char_:SourceCharacter { return char_; }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" sequence:LineTerminatorSequence { return sequence; }

LineTerminator
  = [\n\r\u2028\u2029]


SourceCharacter
  = .

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line spearator
  / "\u2029" // paragraph separator

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = char_:['"\\bfnrtv] {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }

NonEscapeCharacter
  = (!EscapeCharacter / LineTerminator) char_:SourceCharacter { return char_; }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

DecimalDigits
  = digits:DecimalDigit+ { return digits.join(""); }

DecimalDigit
  = [0-9]

HexDigit
  = [0-9a-fA-F]

HexEscapeSequence
  = "x" h1:HexDigit h2:HexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2));
    }

UnicodeEscapeSequence
  = "u" h1:HexDigit h2:HexDigit h3:HexDigit h4:HexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

EOF 
    = !.

_ 
    = whitespace*

whitespace 
    = [ \t]
