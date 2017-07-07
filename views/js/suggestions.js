console.log(me);
console.log(users);

var loc_input = new google.maps.places.Autocomplete(document.getElementById('geoloc'));
//http://maps.googleapis.com/maps/api/geocode/json?latlng=48.8537,2.549
//http://ip-api.com/json/62.210.34.252

$("#search").click(function () {
	var place = loc_input.getPlace();
	var search = {
		age_min: $("#age_min").val(),
		age_max: $("#age_max").val(),
		pop_min: $("#pop_min").val(),
		pop_max: $("#pop_max").val(),
		lat: place ? place.geometry.location.lat() : "",
		lng: place ? place.geometry.location.lng() : "",
		interests: $("#interests").val(),
		sort: $("select#sort option:checked").val()
	}

	console.log("SEARCH ", search);

	var url = '/suggestions?' +
						'age_min='   + encodeURIComponent(search.age_min)   + '&' +
						'age_max='   + encodeURIComponent(search.age_max)   + '&' +
						'pop_min='   + encodeURIComponent(search.age_min)   + '&' +
						'pop_max='   + encodeURIComponent(search.pop_max)   + '&' +
						'lat='       + encodeURIComponent(search.lat)       + '&' +
						'lng='       + encodeURIComponent(search.lng)       + '&' +
						'interests=' + encodeURIComponent(search.interests) + '&' +
						'sort='      + encodeURIComponent(search.sort);

	window.location.href = url;
});

function report(username) {
	$.post('profile',
		{
				field: "report",
				content: username
		}
	);
}

function block(username) {
	$.post('profile',
		{
				field: "block",
				content: username
		}
	);
}


function like(username) {
	$.post('profile',
		{
				field: "like",
				content: username
		}
	);
	$(".like_b").each(function(){
		if ($(this).attr('id') === username) {
			console.log($(this).css("background-color"));
			if ($(this).css("background-color") === "rgb(255, 255, 255)") {
				$(this).css("background-color", "red");
				$(this).children().css("color", "white");
			} else {
				$(this).css("background-color", "white");
				$(this).children().css("color", "red");
			}
		}
	});
}

$('#ex1').slider({
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

$('input#search_by_tag').on('itemAdded', function(event) {
	 var tag = event.item;
	 console.log("ADD: " + event.item + " VALS : " + $('input#interests').val());
	 $.post('profile',
		 {
				 field: "interests",
				 content: $('input#interests').val()
		 }
	 );
 });

 $('input#search_by_tag').on('itemRemoved', function(event) {
		var tag = event.item;

		console.log("RM: " + event.item + " VALS : " + $('input#interests').val());
		$.post('profile',
			{
					field: "interests",
					content: $('input#interests').val()
			}
		);
	});


function reloadButtons() {
	$(".chat_b").each(function(){
		var username = $(this).attr('id');
		if (me && me.like && me.like.indexOf(username) !== -1) {
			if ((user = (users.find( function(user){return user.username === username} )))
					&& user.like && user.like.indexOf(me.username) !== -1)
				return;
		}
		$(this).css("display", "none");
	});

	$(".like_b").each(function(){
		if (!me.profile_pic || me.profile_pic === "") {
			console.log("disable button");
			$(this).disable();
		}

		if (me.like.indexOf($(this).attr('id')) !== -1) {
			$(this).css("background-color", "white");
			$(this).children().css("color", "red");
		}
	});
}

reloadButtons();
