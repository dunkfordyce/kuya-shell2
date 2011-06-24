var vows = require('vows'),
    assert = require('assert'),
    parser = require('../command_parser'),
    sys = require('sys');

function test(input) { 
    return function() { 
        var ret = parser.parse(input);
        console.log('input:', input); console.log('output:', sys.inspect(ret, 0, null));
    }
}

vows.describe('command_parser')
    .addBatch({
        'just command': test('xyc'),
        'one arg': test('xyc ab'),
        'more than one arg': test('xyc ab dc ef'),
        'quoted arg': test('xyc "ab dc ef"'),
        'quoted and non qyoted args': test('xyc "ab dc ef" gh kl'),
        'quoted arg with escaped quote': test('xyc "ab \\"dc ef" gh kl'),
        'multiple commands': test('xyc "ab \\"dc ef";gh kl'),
        'multiple commands extra space': test('xyc "ab \\"dc ef"; gh kl'),
        'one option': test('xyc -v'),
        'one option and one arg': test('xyc -v b'),
        'one option, one arg, one option': test('xyc -v b --c'),
        'quoted option name': test('xyc -v b --"c and d"'),
        'option value': test('xyc -v b --"c and d"=z'),
        'equals inside option name': test('"xyc foo" -v b --"c and d=x"="thought youd fooled me"'),
        'shell': test('!foo'),
        'shell more args': test('!foo zxy abc "ef gh"')
    })
    .export(module)
;

