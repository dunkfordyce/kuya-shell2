var express = require('express'),
    browserify = require('browserify'),
    context = require('./server-context'),
    app = express.createServer();

app.use(express.static(__dirname+'/public'));

app.use(express.bodyParser());

app.error(function(err, req, res, next) { 
    res.send({
        $datatype: 'error',
        data: err
    }, 200);
});

app.get ('/context/new', context.create);
app.all ('/context/:id/*', context.load_context);
app.post('/context/:id/execute', context.execute);

app.use(browserify({
    require: [
        './client'
    ],
    watch: true
}));

exports.app = app;

if( !module.parent ) { 
    console.log('listening on 3000');
    app.listen(3000);
}
