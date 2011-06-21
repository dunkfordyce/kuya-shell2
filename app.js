var express = require('express'),
    browserify = require('browserify'),
    context = require('./server-context'),
    app = express.createServer();

app.use(express.static(__dirname+'/public'));
app.use(browserify({require: {
    inflate: __dirname+'/inflate.js',
    deferred: __dirname+'/deferred.js',
    _: 'underscore'
}}));
app.use(express.bodyParser());

app.error(function(err, req, res, next) { 
    res.send({
        $datatype: 'error',
        data: err
    }, 200);
});

app.post('/context/', context.create);
app.all ('/context/:id/:op?', context.load_context);
app.post('/context/:id/execute', context.execute);
app.get ('/context/:id/commands', context.commands);

exports.app = app;

if( !module.parent ) { 
    console.log('listening on 3000');
    app.listen(3000);
}
