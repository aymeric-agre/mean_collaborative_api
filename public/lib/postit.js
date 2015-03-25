var app = angular.module('app', []);

app.directive('stickyNote', function(socket){
    var linker = function(scope, element, attrs) {
        element.draggable({
            stop: function (event, ui) {
                socket.emit('moveNote', {
                    date: scope.note.date,
                    xPosition: ui.position.left,
                    yPosition: ui.position.top
                });
            }
        });

        socket.on('onNoteMoved', function (data) {
            if (data.date == scope.note.date) {
                element.animate({
                    left: data.xPosition,
                    top: data.yPosition
                });
            }
        });

        element.css('left', scope.note.xPosition + 'px');
        element.css('top', scope.note.yPosition + 'px');
        element.hide().fadeIn();
    };

    var controller = function($scope){
        socket.on('onNoteUpdated', function(data){
            if(data.date == $scope.note.date){
                $scope.note.title = data.title;
                $scope.note.body = data.body;
            }
        });

        $scope.updateNote = function(note){
            socket.emit('updateNote', note);
        };

        $scope.deleteNote = function(date){
            $scope.ondelete({
                date: date
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
        $scope.handleDeletedNote(data.date);
    });

    $scope.createNote = function(){
        var note = {
            date: new Date().getTime(),
            title: 'New Note',
            body: 'Pending',
            xPosition: 450,
            yPosition: 50
        };
        $scope.notes.push(note);
        socket.emit('createNote', note);
    };

    $scope.deleteNote = function(date){
        //console.log('Delete ' + date);
        $scope.handleDeletedNote(date);
        socket.emit('deleteNote', {date: date});
    };

    $scope.handleDeletedNote = function(date){
        //console.log('Try to delete note ' + date);
        var oldNotes = $scope.notes,
            newNotes = [];

        angular.forEach(oldNotes, function(note){
            if(note.date !== date){
                newNotes.push(note);
            }
        });

        $scope.notes = newNotes;
    }
});