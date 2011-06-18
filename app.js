var express = require('express'),
    context = require('./server-context'),
    app = express.createServer();

app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());

app.error(function(err, req, res, next) { 
    res.send({
        datatype: 'error',
        data: err
    }, 500);
});

app.post('/context/execute', context.execute);

exports.app = app;

if( !module.parent ) { 
    console.log('listening on 3000');
    app.listen(3000);
}
