/**
 * Created by aymeric on 11/03/2015.
 */
var express = require('express'),
    bodyParser = require('body-parser');
    app = express();
server = require('http').createServer(app),
    io = require('socket.io').listen(server);
		
/**
 * Definition of middlewares
 */
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.post('/*', function(req, res) {
	res.redirect('index.html/'+req.body.room);
	res.send('You sent the code "' + req.body.room + '".');
});

server.listen(3000);