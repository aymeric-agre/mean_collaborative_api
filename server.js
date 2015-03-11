var express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    cons = require('consolidate'),
    swig = require('swig'),
    app = express();
server = require('http').createServer(app),
    io = require('socket.io').listen(server);

/**
 * Rendering engine
 */
app.engine('html', cons.swig);

app.set('view engine', 'html');
app.set('views', __dirname + '/public/views');

/**
 * Definition of middlewares
 */
app.use(bodyParser());

/**
 * Routing
 */
app.route('/*')
    .get(function(req, res){
    res.render('index');
    })
    .post(function(req, res) {
	res.redirect('/'+req.body.room);
	console.log('You sent the code "' + req.body.room + '".');
    });

server.listen(3000);