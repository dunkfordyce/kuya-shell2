var express = require('express'),
    context = require('./server-context'),
    app = express.createServer();

app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());

app.post('/context/execute', context.execute);
app.post('/context/chain', context.chain);

exports.app = app;

if( !module.parent ) { 
    console.log('listening on 3000');
    app.listen(3000);
}
