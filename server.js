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

// usernames which are currently connected to the chat
var usernames = {};

function findClientsSocket(chatroomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(chatroomId) {
                var index = ns.connected[id].chatrooms.indexOf(chatroomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id].username);
                }
            } else {
                res.push(ns.connected[id].username);
            }
        }
    }
    return res;
}
	

io.sockets.on('connection', function (socket) {

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
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		//console.log('Ajout'+username);
		// store the username in the socket session for this client
		socket.username = username;
		// store the chatroom name in the socket session for this client
		socket.chatroom = 'index';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to chatroom 1
		socket.join('index');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to index');
		// echo to chatroom 1 that a person has connected to their chatroom
		socket.broadcast.to(socket.chatroom).emit('updatechat', 'SERVER', username + ' has connected to this chatroom');
		
		//Userlist
		var clients_in_the_chatroom = io.sockets.adapter.rooms[socket.chatroom];
		var usernames_in_chatroom = new Array();
		for (var clientId in clients_in_the_chatroom ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_chatroom.push(client_socket.username);
		}
		// Change users in chatroom
		socket.emit('updateusers',usernames_in_chatroom); //Update this socket
		socket.broadcast.to(socket.chatroom).emit('updateusers', usernames_in_chatroom);
		
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.chatroom).emit('updatechat', socket.username, data);
	});

	socket.on('switchChatchatroom', function(newchatroom){
		//console.log('switch chatroom');
		// leave the current chatroom (stored in session)
		currentchatroom=socket.chatroom;
		socket.leave(socket.chatroom);
		
		//userlist in current chatroom
		var clients_in_the_chatroom = io.sockets.adapter.rooms[socket.chatroom];
		var usernames_in_previous_chatroom = new Array();
		for (var clientId in clients_in_the_chatroom ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_previous_chatroom.push(client_socket.username);
		}
		
		// Change users in previous chatroom
		socket.broadcast.to(currentchatroom).emit('updateusers', usernames_in_previous_chatroom);
		// join new chatroom, received as function parameter
		socket.join(newchatroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newchatroom);
		// sent message to OLD chatroom
		socket.broadcast.to(currentchatroom).emit('updatechat', 'SERVER', socket.username+' has left this chatroom');
		// update socket session chatroom title
		socket.chatroom = newchatroom;
		socket.broadcast.to(newchatroom).emit('updatechat', 'SERVER', socket.username+' has joined this chatroom');
		// update the list of users in chat, client-side
		var clients_in_the_chatroom = io.sockets.adapter.rooms[socket.chatroom];
		var usernames_in_new_chatroom = new Array();
		for (var clientId in clients_in_the_chatroom ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_new_chatroom.push(client_socket.username);
		}
		socket.emit('updateusers',usernames_in_new_chatroom); //Update this socket
		socket.broadcast.to(newchatroom).emit('updateusers', usernames_in_new_chatroom); //Update the others
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		socket.broadcast.to(socket.chatroom).emit('updateusers', findClientsSocket(socket.chatroom));
		// echo globally that this client has left
		socket.broadcast.to(socket.chatroom).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.chatroom);
	});
});

server.listen(3000);