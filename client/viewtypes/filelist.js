var O = require('kuya-O'),
    Renderers = require('../renderers.js').Renderers;

var FileList = {
    $deflate: {
        id: 'FileList'
    },
    options_meta: {
        sort: {
            type: {choice: ['ctime', 'mtime', 'size', 'name']}
        },
        "sort-reverse": { 
            type: 'bool' 
        }
    },
    renderers: Renderers.create(),
    render: function(view_opts) { 
        if( !this.sorted && view_opts.d ) { 
            this.files.sort(function(a, b) { 
                if     ( a.filename > b.filename ) return 1;
                else if( a.filename < b.filename ) return -1;
                return 0;
            });
        }
        return this.renderers.get(view_opts.mode || 'default').call(this);
    }
};
O.default_registry.add(FileList);
