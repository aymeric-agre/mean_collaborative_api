var express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    cons = require('consolidate'),
    swig = require('swig'),
    app = express();
	server = require('http').createServer(app),
    io = require('socket.io').listen(server);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
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

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		console.log('Ajout'+username);
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'index';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('index');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to index');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('index').emit('updatechat', 'SERVER', username + ' has connected to this room');
		
		//Userlist
		var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
		var usernames_in_room = new Array();
		for (var clientId in clients_in_the_room ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_room.push(client_socket.username);
		}
		// Change users in room
		socket.emit('updateusers',usernames_in_room); //Update this socket
		socket.broadcast.to(socket.room).emit('updateusers', usernames_in_room);
		
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		console.log('switch room');
		// leave the current room (stored in session)
		currentroom=socket.room;
		socket.leave(socket.room);
		
		//userlist in current room
		var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
		var usernames_in_previous_room = new Array();
		for (var clientId in clients_in_the_room ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_previous_room.push(client_socket.username);
		}
		
		// Change users in previous room
		socket.broadcast.to(currentroom).emit('updateusers', usernames_in_previous_room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(currentroom).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		// update the list of users in chat, client-side
		var clients_in_the_room = io.sockets.adapter.rooms[socket.room];
		var usernames_in_new_room = new Array();
		for (var clientId in clients_in_the_room ) {
		  var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
		  usernames_in_new_room.push(client_socket.username);
		}
		socket.emit('updateusers',usernames_in_new_room); //Update this socket
		socket.broadcast.to(newroom).emit('updateusers', usernames_in_new_room); //Update the others
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		socket.broadcast.to(socket.room).emit('updateusers', findClientsSocket(socket.room));
		// echo globally that this client has left
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});


server.listen(3000);