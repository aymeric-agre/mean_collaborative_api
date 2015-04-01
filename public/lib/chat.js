var socket = io.connect(),
	username = '';

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
	while(username == '' || username == null){
		username = prompt("Choisissez un nom d'utilisateur: ").trim();
	}
	if(username != '' && username != null){
		socket.emit('adduser', username);
	}
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
	document.getElementById('data').focus();
	document.getElementById('conversation').scrollBy(0,300);
});

function switchRoom(room){
    socket.emit('switchRoom', room);
}

// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
		if(value == username){
			$('#users').append('<div class="userName">' + value + '</div>');
		}else{
			$('#users').append('<div class="userName">' + value + '</div>');
		}
    });
});

// on load of page
$(function(){
    // when the client clicks SEND
    $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', message);
    });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });
});

//when button clicked
$(function(){
    // when the client clicks SEND
    $('#dataRoom').click( function() {
        var message = $('#choiceRoom').val(); //On récupère la valeur dans choice
        // tell server to execute 'changeRoom' and send along one parameter
        socket.emit('switchRoom', message);
    });

    // when the client hits ENTER on their keyboard
    $('#choiceRoom').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#dataRoom').focus().click();
        }
    });
});