var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    _ = require('underscore'),
    defer = require('jsdeferred'),
    JSONSelect = require('JSONSelect');

glob.GLOB_DEFAULT =    glob.GLOB_BRACE
                     //| glob.GLOB_LIMIT
                     | glob.GLOB_STAR
                     | glob.GLOB_MARK
                     | glob.GLOB_TILDE
                     | glob.GLOB_NOSORT;

var _is_pattern = /[\*\?]/;
function is_pattern(pat) { 
    return _is_pattern.test(pat);
}

function expand(pat) { 
    var r = defer.Deferred();
    glob.glob(pat, function(err, files) { 
        if( err ) { 
            r.regect(err);
        } else { 
            r.resolve(files);
        }
    });
    return r;
}

function FileList(context) { 
    this.context = context;
    this.files = [];
}
FileList.prototype.toString = function() { 
    return "FileList: "+this.files.join(', ');
};
FileList.prototype.serialize = function() { 
    return {
        schema: "FileList",
        data: {files: this.files}
    };
};
FileList.prototype.add = function(pat) { 
    var r = defer.Deferred();
    if( pat[0] !== '/' ) pat = path.join(this.context.path, pat);
    pat = path.normalize(pat);
    if( is_pattern(pat) ) { 
        console.log('pattern', pat);
        var self = this;
        expand(pat).then(function(files) {
            self.files = self.files.concat(files);
            r.resolve(self);
        });
    } else {
        console.log('file', pat);
        this.files.push( pat );
        r.resolve(this);
    }
    return r.promise();
};
FileList.prototype.filter = function(pat) { 
    this.files = _.select(this.files, function(f) { return glob.fnmatch(pat, f); });
};

function Context() { 
    this.path = process.cwd();
}

Context.prototype.filelist = function(args, options, input) { 
    var r = defer.Deferred();
    var fl = new FileList(this);
    defer.when.apply(null, _.map(args, fl.add, fl)).then(function() { 
        r.resolve(fl.serialize());
    });
    return r.promise();
};

Context.prototype.test = function(args, options, input) { 
    var r = defer.Deferred();
    r.resolve({schema: 'test', data: {args:args, options: options, input: input}});
    return r.promise();
};

/*
Context.prototype.jgrep = function(args, options, input) { 
    var r = defer.Deferred();
    if( !input ) { 
        r.reject('no input');
    } else {
        var ret = jgrep(input.data, args[0], args[1];
    }
    return r;
};
*/

Context.prototype.select = function(args, options, input) { 
    var r = defer.Deferred();
    if( !input ) { 
        r.reject('no input');
    } else {
        r.resolve({
            schema: 'select',
            data: JSONSelect.match(args[0], input)
        });
    }
    return r;
};

function test() { 
    var c = new Context();
    var f = c.filelist('/home/dunk', 'foo', '*.txt');
    console.log(f.toString());
    f.add('bob').add('fred');
    console.log(f.toString());
    c.path = '/';
    f.add('james');
    console.log(f.toString());
    f.filter('/data/*');
    console.log(f.toString());
}

exports.Context = Context;
