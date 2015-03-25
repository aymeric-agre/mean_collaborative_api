var app = angular.module('app', []);

app.directive('stickyNote', function(socket){
    var linker = function(scope, element, attrs) {
        element.draggable({
            stop: function (event, ui) {
                socket.emit('moveNote', {
                    id: scope.note.id,
                    x: ui.position.left,
                    y: ui.position.top
                });
            }
        });

        socket.on('onNoteMoved', function (data) {
            if (data.id == scope.note.id) {
                element.animate({
                    left: data.x,
                    top: data.y
                });
            }
        });

        element.css('left', '10px');
        element.css('top', '50px');
        element.hide().fadeIn();
    };

    var controller = function($scope){
        socket.on('onNoteUpdated', function(data){
            if(data.id == $scope.note.id){
                $scope.note.title = data.title;
                $scope.note.body = data.body;
            }
        });

        $scope.updateNote = function(note){
            socket.emit('updateNote', note);
        };

        $scope.deleteNote = function(id){
            $scope.ondelete({
                id: id
            });
        };
    };

    return {
        restrict: 'A',
        link: linker,
        controller: controller,
        scope: {
            note: '=',
            ondelete: '&'
        }
    };
});

app.factory('socket', function($rootScope){
    var socket = io.connect();
    return{
        on: function(eventName, callback){
            socket.on(eventName, function(){
                var args = arguments;
                $rootScope.$apply(function(){
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback){
            socket.emit(eventName, data, function(){
                var args = arguments;
                $rootScope.$apply(function(){
                    if(callback){
                        callback.apply(socket,args);
                    }
                });
            });
        }
    };
});

app.controller('PostitCtrl', function($scope, socket){
    $scope.notes = [];

    socket.on('onNoteCreated', function(data){
        $scope.notes.push(data);
    });

    socket.on('onNoteDeleted', function(data){
        $scope.handleDeletedNote(data.id);
    });

    $scope.createNote = function(){
        var note = {
            id: new Date().getTime(),
            title: 'New Note',
            body: 'Pending'
        };

        $scope.notes.push(note);
        socket.emit('createNote', note);
    };

    $scope.deleteNote = function(id){
        $scope.handleDeletedNote(id);
        socket.emit('deleteNote', {id: id});
    };

    $scope.handleDeletedNote = function(id){
        var oldNotes = $scope.notes,
            newNotes = [];

        angular.forEach(oldNotes, function(note){
            if(note.id !== id){
                newNotes.push(note);
            }
        });

        $scope.notes = newNotes;
    }
});