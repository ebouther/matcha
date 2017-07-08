$(document).ready(function() {

  $("#chat").load("templates/chat_box.html");

  editProfileField("edit-firstname", "firstname");
  editProfileField("edit-lastname", "lastname");
  editProfileField("edit-email", "email");
  editProfileField("edit-biography", "biography");
  editProfileField("edit-interests", "interests");
  editProfileField("edit-age", "age");

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

    function readURL(input, img_id, index) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $(img_id).attr('src', e.target.result).fadeIn('slow');
                // console.log("SIZE:" + input.files[0].size);
                if (input.files[0].size < 2000000) {
                  $.post('profile',
                    {
                      field: "picture",
                      content: reader.result,
                      index: index
                    }
                  );
                } else {
                  alert("Image too big to be saved");
                }
            }
            reader.readAsDataURL(input.files[0]);
            console.log("INPUT FILE " + JSON.stringify(input.files[0]));
        }
    }

    for (var i = 1; i <= 5; i++) {
      (function (i) {
        $("#upload-pic" + i).change(function(){
          readURL(this, "#profile-pic" + i, i);
        });
        var pic = $("#profile-pic" + i);
        pic.click(function(){
          //console.log("'" + pic.attr('src') + "'");
          if (pic.attr('src') != "") {
            $("#profile-pic").attr("src", pic.prop('src'));
            $.post('profile',
              {
                field: "profile_pic",
                content: i,
              }
            );
          }
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

var loc_input = new google.maps.places.Autocomplete(document.getElementById('geoloc'));

loc_input.addListener('place_changed', function() {
  var place = loc_input.getPlace();

  if (place.geometry) {
    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();
    $.post('profile',
      {
        field: "location",
        content: place.address_components[0].long_name //place.place_id//
      }
    );
    $.post('profile',
      {
        field: "lat_lng",
        content: [lat, lng]
      }
    );
  }
});
