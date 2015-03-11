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
var numeroSalle = ""; //On récupère le numero de la salle

app.get('/*',function(req, res){
		res.render('index');
		console.log("GET");
    })
    .post('/*',function(req, res) {
		res.redirect('/'+req.body.room);
		console.log("POST");
		numeroSalle=req.body.room;
    });

/**
 * Sockets
 */
io.sockets.on('connection', function (socket,room) {
	console.log('client connected');
	//Changement de la salle
	socket.on('valeurSalle', function(room) {
        socket.room = room;
	});
	
	//On teste si on est dans une salle à chaque connexion
	var str = numeroSalle.split("/"); //On sépare selon les "/"
	str=str[str.length-1]; //On prend le dernier
	var strLength = str.length; //On regarde sa taille
	//Si on est dans un .html
	if (strLength>10 || (strLength>4 && str.substring(strLength-5,strLength)==".html"))
	{
		console.log('room assigned');
		socket.room = "";
	}
	else
	{
		console.log("str:"+str);
		socket.room = str;
	}
	
	socket.emit('message', { content: "Vous êtes bien connecté en salle "+socket.room, importance: '1', room: socket.room });
	socket.broadcast.emit('message', { content: 'Un autre client vient de se connecter ! ', importance: '1', room: socket.room });
});


server.listen(3000);