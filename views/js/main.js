$(document).ready(function() {
  editProfileField("edit-firstname", "firstname");
  editProfileField("edit-lastname", "lastname");
  editProfileField("edit-email", "email");
  editProfileField("edit-biography", "biography");
  editProfileField("edit-interests", "interests");

  $('select#gender').on('change', function() {
    var selection = this.value;
    $.post('profile',
      {
          field: "gender",
          content: selection
      }
    );
  });

  $('select#sex_pref').on('change', function() {
    var selection = this.value;
    $.post('profile',
      {
          field: "sex_pref",
          content: selection
      }
    );
  });

  $('input#interests').on('itemAdded', function(event) {
     var tag = event.item;
     console.log("ADD: " + event.item + " VALS : " + $('input#interests').val());
     $.post('profile',
       {
           field: "interests",
           content: $('input#interests').val()
       }
     );
   });

   $('input#interests').on('itemRemoved', function(event) {
      var tag = event.item;

      console.log("RM: " + event.item + " VALS : " + $('input#interests').val());
      $.post('profile',
        {
            field: "interests",
            content: $('input#interests').val()
        }
      );
    });

    function readURL(input, img_id) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $(img_id).attr('src', e.target.result).fadeIn('slow');
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    for (var i = 1; i <= 5; i++) {
      (function (i) {
        $("#upload-pic" + i).change(function(){
          readURL(this, "#profile-pic" + i);
        });
        var pic = $("#profile-pic" + i);
        pic.click(function(){
          console.log("'" + pic.attr('src') + "'");
          if (pic.attr('src') != "")
            $("#profile-pic").attr("src", pic.prop('src'));
        });
      })(i);
    }

});

function editProfileField(button_id, value_id) {
  button_id = "#" + button_id;
  $(button_id).click(function() {
    var content = $('#' + value_id).text();
    $('#' + value_id).html('');
    $('<input></input>')
        .attr({
            'type': 'text',
            'name': 'fname',
            'id': value_id + "modify",
            'size': '30',
            'value': content
        })
        .appendTo($('#' + value_id));
    $('#' + value_id + "modify").focus();
  });
  $(document).on('blur','#' + value_id + "modify", function() {
      var content = $(this).val();
      $.post('profile',
          {
            field: value_id,
            content: content
          }
        );
      $('#' + value_id).text(content);
  });
}
