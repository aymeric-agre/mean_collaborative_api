var express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    cons = require('consolidate'),
    swig = require('swig'),
    app = express();
var server = require('http').createServer(app),
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
app.use(express.static(__dirname + '/public'));

/**
 * Routing
 */
app.route('/')
    .get(function(req, res){
        res.render('index');
    })
    .post(function(req, res) {
        res.redirect('/'+req.body.room);
        console.log('You sent the code "' + req.body.room + '".');
    });

app.route('/postit')
    .get(function(req, res){
        res.render('postit');
    });
/**
 * Sockets
 */
io.sockets.on('connection', function (socket) {
    console.log('a user is connected');

    socket.on('createNote', function(data){
        socket.broadcast.emit('onNoteCreated', data);
    });

    socket.on('updateNote', function(data){
        socket.broadcast.emit('onNoteUpdateData', data);
    });

    socket.on('deleteNote', function(data){
        socket.broadcast.emit('onNoteDeleteData', data);
    });

    socket.on('moveNote', function(data){
        socket.broadcast.emit('onNoteMoveData', data);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

server.listen(3000);