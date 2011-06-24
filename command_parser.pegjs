start
    = (shellcommand / command)+

shellcommand 
    = _ "!" command:shellarg+ command_end { return {type: 'shell', command: command}; } 

shellarg 
    = arg:String _ { return arg; }

command 
    = _ command:command_name command_end args:arguments? {return {type: 'js', command: command, args: args}; }

command_end
    = whitespace / EOF / ";"

command_name
    = command:String 

arguments
    = args:((option / argument)*) (EOF / ";") {return args;}

option
    = ("--" / "-") option:(String) optionarg:option_arg? _
    { return {option: option, arg: optionarg}; }

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
    = str:([a-zA-Z0-9_-]+) { return str.join(''); }

not_whitespace
    = !(whitespace) 

String
    = StringLiteral / unqoted_string

StringLiteral "string"
  = parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") {
      return parts[1];
    }

DoubleStringCharacters
  = chars:DoubleStringCharacter+ { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter+ { return chars.join(""); }

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
