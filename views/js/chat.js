var socket = io();

$('#chat').submit(function(e){
  e.preventDefault();
  console.log("Submit");
  socket.emit('message', $('#m').val());
  $('#m').val('');
  return false;
});

socket.on('message', function(msg){
  console.log("message");
  $('#messages').append($('<li>').text(msg));
});

socket.on('notif', function(msg){
  console.log("notif (" + msg + ")");
});
