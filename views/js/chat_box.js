var socket = io();
var chat_window = undefined;

function getContacts(cb) {
  console.log("getContacts()");
  $.ajax({
       url: '/contacts',
       type: 'GET',
       success: function(contacts) {
          cb(contacts);
       }
    });
 }
  //$("<li><a href='#' id='new_chat>Toto</a></li>");

$(function () {
  chat_window = $( "#chat_window_1" ).clone();
  console.log(chat_window);
  getContacts(function (contacts) {
    console.log(contacts);
    contacts.forEach(function (contact){
      console.log("CONTACT : " + contact);
      if (contact)
        $("#contacts").append('<li><a href="#" id="new_chat"><span>' + contact + '</span></a></li>');
    });
  });

});

$(document).on('click', '.panel-heading span.icon_minim', function (e) {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('.panel').find('.panel-body').slideUp();
        $this.addClass('panel-collapsed');
        $this.removeClass('glyphicon-minus').addClass('glyphicon-plus');
    } else {
        $this.parents('.panel').find('.panel-body').slideDown();
        $this.removeClass('panel-collapsed');
        $this.removeClass('glyphicon-plus').addClass('glyphicon-minus');
    }
});
$(document).on('focus', '.panel-footer input.chat_input', function (e) {
    var $this = $(this);
    if ($('#minim_chat_window').hasClass('panel-collapsed')) {
        $this.parents('.panel').find('.panel-body').slideDown();
        $('#minim_chat_window').removeClass('panel-collapsed');
        $('#minim_chat_window').removeClass('glyphicon-plus').addClass('glyphicon-minus');
    }
});
$(document).on('click', '#new_chat', function (e) {
    var size = $( ".chat-window" ).last().css("right");
    if (size === undefined)
      size = -400;
    var size_total = parseInt(size) + 400;
    if (size_total + 400 < $( window ).width())
    {
      var new_chat = chat_window.clone().appendTo( ".chat_container" );
      new_chat.css("right", size_total);
    }
});
$(document).on('click', '.icon_close', function (e) {
    $(this).parentsUntil(".chat_container").remove();
});

$(document).on('click', '#btn-chat', function (e) {
    socket.emit('chat message', $('#btn-input').val());
    $('#btn-input').val('');
});

socket.on('chat message', function(msg){
  var rcv = $('<div class="row msg_container base_receive"> \
                  <div class="col-md-2 col-xs-2 avatar"> \
                      <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "> \
                  </div> \
                  <div class="col-md-10 col-xs-10"> \
                      <div class="messages msg_receive"> \
                          <p>' + msg + '</p> \
                          <time datetime="2009-11-13T20:00">Timothy • 51 min</time> \
                      </div> \
                  </div> \
                </div>');
  $('#messages').append(rcv);
});

socket.on('notif', function(msg){
  console.log("notif (" + msg + ")");
});
