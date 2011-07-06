exports.cd = function(path) { 
    console.log('cd', path);
    this.env.set('cwd', path);
    this.result.resolve();
};
