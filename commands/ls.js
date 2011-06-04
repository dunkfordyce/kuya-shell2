var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    defer = require('jsdeferred'),
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

function FileList(context) { 
    this.context = context;
    this.files = [];
}
FileList.prototype.toString = function() { 
    return "FileList: "+this.files.join(', ');
};
FileList.prototype.serialize = function() { 
    return {
        schema: "filelist",
        data: this.files
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
FileList.prototype.stats = function() { 
    var ps, 
        ret = [],
        rr = defer.Deferred();
    defer.when.apply(null, _.map(this.files, function(fn) { 
        var r = defer.Deferred();
        fs.stat(fn, function(err, s) { 
            s.filename = fn;
            ret.push(s);
            r.resolve();
        });
        return r;
    })).then(function() { 
        rr.resolve(ret);
    });
    return rr;
};
FileList.prototype.filter = function(pat) { 
    this.files = _.select(this.files, function(f) { return glob.fnmatch(pat, f); });
};

exports.ls = function() { 
    var fl = new FileList(this.context),
        self = this;
    defer.when.apply(null, _.map(arguments.length ? arguments : '*', fl.add, fl)).then(function() { 
        if( self.options.x ) { 
            fl.stats().done(function(data) { 
                self.result.resolve({schema: 'filelist', data: data, extended: true});
            });
        } else {
            self.result.resolve(fl.serialize());
        }
    });
};
