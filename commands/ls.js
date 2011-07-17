var O = require('kuya-O'),
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    defer = require('../deferred'),
    glob = require('glob');

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

function stat(f) { 
    var p = defer.Deferred();

    fs.stat(f, function(err, s) { 
        if( err ) p.reject(err);
        else {
            s.filename = f;
            p.resolve(s);
        }
    });

    return p;
}

var FileList = {
    $deflate: {
        id: "FileList"
    }
};

exports.ls = function() { 
    var self = this,
        ret = [],
        ps = [],
        ps2 = [];

    _.each(arguments.length ? arguments : ['*'], function(p) { 
        if( p[0] !== '/' ) { 
            p = path.join(self.context.env.get('cwd'), p);
        }
        if( is_pattern(p) ) { 
            ps.push( expand(p).then(function(files) { 
                files.forEach(function(f) { 
                    ps2.push( stat(f).then(function(s) { 
                        ret.push(s);
                    }));
                });
            }) );
        } else {
            ps.push( stat(p).then(function(s) { 
                ret.push(s);
            }) );
        }
    });

    defer.when.apply(null, ps).then(function() { 
        defer.when.apply(null, ps2).then(function() { 
            self.result.resolve(O.spawn(FileList, {files: ret}));
        });
    });
};

exports.ls.meta = {
    description: 'list files',
    args: '*',
    options: { 
        recursive: { type: 'bool' }
    }
};

/*
exports.ls.description = "list a directory";
exports.ls.default_datatype = 'filelist';
exports.ls.options = null;
exports.ls.args = [
    {type: ['path', 'pattern'], min: 0, max: null}
];
*/


