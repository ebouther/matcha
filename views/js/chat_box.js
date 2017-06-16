var chat_window = undefined;

function getContacts() {
  $.ajax({
       url: '/contacts',
       type: 'GET',
       success: function(data){
          alert('Success : ' + data)
       }
    })
 });
  //$("<li><a href='#' id='new_chat>Toto</a></li>");
}

$(function () {
  chat_window = $( "#chat_window_1" ).clone();
  console.log(chat_window);
  getContacts();
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
