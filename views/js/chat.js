var socket = io();

$('#chat').submit(function(e){
  e.preventDefault();
  console.log("Submit");
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});

socket.on('chat message', function(msg){
  console.log("message");
  $('#messages').append($('<li>').text(msg));
});

socket.on('notif', function(msg){
  console.log("notif (" + msg + ")");
});
