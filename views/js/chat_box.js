var socket = io();
var chat_window = undefined;
var chats = [];

function formatMsg(message, username) {
  var msg;
  if (message.to === username) {
    msg =  $('<div class="row msg_container base_sent"> \
                      <div class="col-md-10 col-xs-10"> \
                          <div class="messages msg_sent"> \
                              <p>' + message.message +'</p> \
                              <time datetime="2009-11-13T20:00">Me</time> \
                          </div> \
                      </div> \
                      <div class="col-md-2 col-xs-2 avatar"> \
                          <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "> \
                      </div> \
                   </div>');
    } else {
      msg = $('<div class="row msg_container base_receive"> \
                      <div class="col-md-2 col-xs-2 avatar"> \
                          <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "> \
                      </div> \
                      <div class="col-md-10 col-xs-10"> \
                          <div class="messages msg_receive"> \
                              <p>' + message.message + '</p> \
                              <time datetime="2009-11-13T20:00">' + message.from + ' • 51 min</time> \
                          </div> \
                      </div> \
                    </div>');
    }
    return msg;
}

function getContacts(cb) {
  //console.log("getContacts()");
  $.ajax({
       url: '/contacts',
       type: 'GET',
       success: function(contacts) {
          cb(contacts);
       }
    });
 }
 function fillContactList () {
   $("#contacts").empty();
   getContacts(function (contacts) {
     contacts.forEach(function (contact) {
       //console.log("CONTACT : " + contact);
       if (contact)  {
         var $li = $('<li><a href="#" id="new_chat"><span>' + contact + '</span></a></li>');
         //console.log("OBJ : ");
         //console.log($li);
         $li.click(function() {
             new_chat(contact);
         });
         $("#contacts").append($li);
       }
     });
   });
 }

 function getNotifs(cb) {
   //console.log("getNotifs()");
   $.ajax({
        url: '/notifs',
        type: 'GET',
        success: function(notifs) {
           cb(notifs);
        }
     });
  }

  function fillNotifsList () {
    $("#notifications").empty();
    getNotifs(function (notifs) {
      if (notifs.length > 0)
        $('#notifs_b').css('background-color', 'red');
      notifs.forEach(function (notif) {
        //console.log("Notif: " + notif);
        if (notif)  {
          var $li = $('<li><span>' + notif + '</span></li>');
          $("#notifications").append($li);
        }
      });
    });
  }

function new_chat(username) {
    //console.log("NEW CHAT :" + username);
     var size = $( ".chat-window" ).last().css("right");
     if (size === undefined)
       size = -400;
     var size_total = parseInt(size) + 400;
     if (size_total + 400 < $( window ).width())
     {
       var new_chat = chat_window.clone().appendTo( ".chat_container" );
       chats.push({username: username, obj: new_chat});

       $.ajax({
            url: '/message',
            method: 'GET',
            data: {user: username},
            success: function(messages) {
              messages.forEach(function (message) {
                new_chat.find('#messages').append(formatMsg(message, username));
              });
            }
         });

       new_chat.css("right", size_total);
       new_chat.find("#chat_title").html(username);
       new_chat.find("#btn-chat").click(function () {
         if (new_chat.find("#btn-input").val() !== "") {
             $.post('message',
               {
                   to: username,
                   msg: new_chat.find("#btn-input").val()
               }
             );

             var msg = $('<div class="row msg_container base_sent"> \
                               <div class="col-md-10 col-xs-10"> \
                                   <div class="messages msg_sent"> \
                                       <p>' + new_chat.find("#btn-input").val() +'</p> \
                                       <time datetime="2009-11-13T20:00">Me</time> \
                                   </div> \
                               </div> \
                               <div class="col-md-2 col-xs-2 avatar"> \
                                   <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "> \
                               </div> \
                            </div>');
             new_chat.find('#messages').append(msg);
             new_chat.find("#btn-input").val('');
          }
        });
     }
  }

function initChat() {
  chat_window = $( "#chat_window_1" ).clone();
  $("#chat_window_1").remove();

  fillNotifsList();

  fillContactList();

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

  $(document).on('click', '.icon_close', function (e) {
      $(this).parentsUntil(".chat_container").remove();
  });

  socket.on('message', function(msg){
    //console.log("RECEIVED MSG");
    chats.forEach(function(chat) {
      if (chat.username === msg.from) {
        var rcv = $('<div class="row msg_container base_receive"> \
                        <div class="col-md-2 col-xs-2 avatar"> \
                            <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive "> \
                        </div> \
                        <div class="col-md-10 col-xs-10"> \
                            <div class="messages msg_receive"> \
                                <p>' + msg.message + '</p> \
                                <time datetime="2009-11-13T20:00">' + msg.from + ' • 51 min</time> \
                            </div> \
                        </div> \
                      </div>');
        chat.obj.find('#messages').append(rcv);
      }
    });
  });


  $("#contacts-dropup").click(function () {
    //console.log("LENGTH : " + $("#contacts").find("li").length);
    if ($("#contacts").find("li").length === 0) {
      $("#contacts").append($('<li><img src="https://pbs.twimg.com/profile_images/505877362873880576/mC7cTyN3.jpeg"></img></li>'));
    }
  });

  // $('#contacts-dropup').on('hide.bs.dropdown', function () {
  //   $("#contacts").empty();
  // });


  socket.on('notif', function(msg){
    //console.log("notif (" + msg + ")");
    $('#notifs_b').css('background-color', 'red');
    fillNotifsList();
    fillContactList();
  });

  // OPEN NOTIF DROPDOWN
  $("#notifs_b").click(function () {
    $('#notifs_b').css('background-color', '');
    //console.log("LENGTH : ", $("#notifications").length);
    if ($("#notifications").find("li").length === 0) {
      $("#notifications").append($('<li><span>¯\\_(ツ)_/¯</span></li>'));
    } else {
      $.post('del_notifs');
    }
  });

  // CLOSE NOTIF DROPDOWN
  $('#notifs-dropup').on('hide.bs.dropdown', function () {
    $("#notifications").empty();
  });

}
