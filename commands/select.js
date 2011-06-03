var JSONSelect = require('JSONSelect');

exports.select = function(pattern) { 
    if( !this.input ) { 
        this.result.reject({message: "no input"});
        return;
    } 
    if( !pattern ) { 
        this.result.reject({message: "no pattern"});
    }

    try { 
        this.result.resolve({
            schema: 'select',
            data: JSONSelect.match(pattern, this.input.data)
        });
    } catch(e) { 
        this.result.reject(e);
    }
};
