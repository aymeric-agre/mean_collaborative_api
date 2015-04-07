var socket = io.connect(),
	thisUserName = '',
	thisUsers = '';

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
	while(thisUserName == '' || thisUserName == null){
		thisUserName = prompt("Choisissez un nom d'utilisateur: ").trim();
	}
	if(thisUserName != '' && thisUserName != null){
		socket.emit('adduser', thisUserName);
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
    $.each(data, function(key, value) {
		if(thisUsers.indexOf(value) < 0){
			if(value == thisUserName){
				$('#users').append('<div class="user" id="user' + value + '"><video id="localVideo" autoplay></video><span class="userName">' + value + '</span></div>');
			}else{
				$('#users').append('<div class="user" id="user' + value + '"><video id="remoteVideo' + value +'" class="remoteVideo" autoplay></video><span class="userName">' + value + '</span></div>');
			}
		}
    });
	
	$.each(thisUsers, function(key, value){
		if(data.indexOf(value) < 0){
			//document.getElementById('user' + value) = '';
			$('#user'+value).remove();
		}
	});
	thisUsers = data;
});

socket.on('videoStreamed', function(data, username){
	if(username != thisUserName){
		var remVideo = document.getElementById('remoteVideo'+username);
		remVideo.src = data;
		remVideo.play();
	}	
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

//Detect the media devices
navigator.getUserMedia = navigator.getUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.msGetUserMedia;

window.audioContext = window.audioContext || 
	window.webkitAudiotContext;
	
var video = null,
	contraints = {video: true, audio: true};
	
//When the media devices are up
function onSuccess(stream) {
	window.stream = stream;
	video.src = window.URL.createObjectURL(stream);
	video.muted = true;
	video.play();
	
	socket.emit('videoStream', video.src, thisUserName);
}
//If the stream is not accessible
function onError(){
	alert('Problème d\'accès au stream');
}
//Request to client to get the video stream
function requestStreams(){
	if(navigator.getUserMedia){
		navigator.getUserMedia(contraints, onSuccess, onError);
	}else{
		alert('getUserMedia n\'est pas supporté dans ce navigateur.');
	}
}

//When the page is loaded
function init(){
	video = document.getElementById('localVideo');
	requestStreams();
};