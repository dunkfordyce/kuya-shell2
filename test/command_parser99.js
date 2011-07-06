var parser = require('../command_parser99'),
    util = require('util');

console.log(util.inspect(parser.parse('foo'), false, null));
console.log(util.inspect(parser.parse('foo arg1 arg2'), false, null));
console.log(util.inspect(parser.parse('foo arg1 --opt1 arg2 --opt2=optarg1 '), false, null));
console.log(util.inspect(parser.parse('foo arg1 --opt1 arg2 --opt2="opt arg 1" '), false, null));
console.log(util.inspect(parser.parse('foo arg1 -opt1 arg2 -opt2="opt arg 1" '), false, null));
console.log(util.inspect(parser.parse('foo arg1 +opt1 arg2 -opt2="opt arg 1" '), false, null));
console.log(util.inspect(parser.parse('foo; bar'), false, null));
console.log(util.inspect(parser.parse('foo; bar; else --more; jar ++moo=1'), false, null));
