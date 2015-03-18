var socket = io.connect('http://localhost:3000'); //On connecte la socket
socket.on('message', function(message,room) { // On teste si on reçoit un message
    alert('Le serveur a un message pour vous : ' + message.content + ' de la salle '+message.room+". Vous êtes en "+socket.room);
    $(document.createElement('span'))
        .text(message.content)
        .appendTo($('#dropzone'));

});