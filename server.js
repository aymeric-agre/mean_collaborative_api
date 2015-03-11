/**
 * Created by aymeric on 11/03/2015.
 */
var express = require('express'),
    app = express();
server = require('http').createServer(app),
    io = require('socket.io').listen(server);

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});

server.listen(3000);