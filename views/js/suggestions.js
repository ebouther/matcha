
var loc_input = new google.maps.places.Autocomplete(document.getElementById('geoloc'));
//http://maps.googleapis.com/maps/api/geocode/json?latlng=48.8537,2.549
//http://ip-api.com/json/62.210.34.252


function appendSuggestion(data) {
	if (data.users) {
		data.users.forEach(function (user) {
			//console.log("USER : ", user);

			$("<div>").load("templates/user_mini.html", function() {
				var _this = $(this);

				$(this).find("#panel-title").text(user.firstname + " " + user.lastname);
				$(this).find("#profile_pic").attr("src", user["picture" + user.profile_pic] ? user["picture" + user.profile_pic] : "img/profile_default.jpg");
				$(this).find("#affinity").text(Math.round(user.sort_weight));
				$(this).find("#dist").text(Math.round(user.dist_from_me));
				$(this).find("#common_tags").text(Math.round(user.commonTags));

				$(this).find("#panel-heading").click(function () {
					window.location.href = '/user?username=' + user.username;
				});
				$(this).find("#panel-body").click(function () {
					window.location.href = '/user?username=' + user.username;
				});

				// LIKE BUTTON
				if (data.me && data.me.profile_pic && data.me.profile_pic !== "") {
					var $like_b = $('<a data-original-title="Like" data-toggle="tooltip" type="button" class="like_b btn btn-sm btn-danger"><i class="glyphicon glyphicon-heart"></i></a>');

					// => Init color
					if (data.me.like && data.me.like.indexOf(user.username) !== -1) {
						$like_b.css("background-color", "white");
						$like_b.children().css("color", "red");
					}
					// => on click
					$like_b.click(function() {
						like(user.username, _this);
					});

					// => append like button
					$(this).find("#panel-footer").prepend($like_b);

				}


				// BLOCK BUTTON
				$(this).find("#block").click(function () {
					block(user.username, _this);
				});
				//    => Init color
				if (data.me.block && data.me.block.indexOf(user.username) !== -1) {
					$(this).find("#block").css("background-color", "white");
					$(this).find("#block").children().css("color", "orange");
				}

				// REPORT BUTTON
				$(this).find("#report").click(function () {
					report(user.username, _this);
				});
				//    => Init color
				if (user.report && user.report.indexOf(data.me.username) !== -1) {
					$(this).find("#report").css("background-color", "white");
					$(this).find("#report").children().css("color", "red");
				}

				$("#suggestions").append($(this));
			});
		});
	}
}

$(function () {

	$("#suggestions").empty();

	$.post('suggestions', {}, function (data) {
			appendSuggestion(data);
		});
});

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

	//console.log("SEARCH ", search);

	// var url = '/suggestions?' +
	// 					'age_min='   + encodeURIComponent(search.age_min)   + '&' +
	// 					'age_max='   + encodeURIComponent(search.age_max)   + '&' +
	// 					'pop_min='   + encodeURIComponent(search.age_min)   + '&' +
	// 					'pop_max='   + encodeURIComponent(search.pop_max)   + '&' +
	// 					'lat='       + encodeURIComponent(search.lat)       + '&' +
	// 					'lng='       + encodeURIComponent(search.lng)       + '&' +
	// 					'interests=' + encodeURIComponent(search.interests) + '&' +
	// 					'sort='      + encodeURIComponent(search.sort);
		$("#suggestions").empty();
		$.post('suggestions',
			{ search: search }, function (data) {
				appendSuggestion(data);
			}
		);

	//window.location.href = url;
});



//
// $("<div>").load("load.php #posts", function() {
//       $("#hi").append($(this).find("#posts").html());
// });


function report(username, user_blk) {
	$.post('profile',
		{
				field: "report",
				content: username
		}
	);
	var $block_b = user_blk.find("#report");

	if ($block_b.css("background-color") === "rgb(255, 255, 255)") {
		$block_b.css("background-color", "red");
		$block_b.children().css("color", "white");
	} else {
		$block_b.css("background-color", "white");
		$block_b.children().css("color", "red");
	}
}

function block(username, user_blk) {
	$.post('profile',
		{
				field: "block",
				content: username
		}
	);


	var $block_b = user_blk.find("#block");

	if ($block_b.css("background-color") === "rgb(255, 255, 255)") {
		$block_b.css("background-color", "orange");
		$block_b.children().css("color", "white");
	} else {
		$block_b.css("background-color", "white");
		$block_b.children().css("color", "orange");
	}
}


function like(username, user_blk) {
	$.post('profile',
		{
				field: "like",
				content: username
		}
	);
	var $like_b = user_blk.find(".like_b");

	if ($like_b.css("background-color") === "rgb(255, 255, 255)") {
		$like_b.css("background-color", "red");
		$like_b.children().css("color", "white");
	} else {
		$like_b.css("background-color", "white");
		$like_b.children().css("color", "red");
	}
}

$('#ex1').slider({
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

$('input#search_by_tag').on('itemAdded', function(event) {
	 var tag = event.item;
	 //console.log("ADD: " + event.item + " VALS : " + $('input#interests').val());
	 $.post('profile',
		 {
				 field: "interests",
				 content: $('input#interests').val()
		 }
	 );
 });

 $('input#search_by_tag').on('itemRemoved', function(event) {
		var tag = event.item;

		//console.log("RM: " + event.item + " VALS : " + $('input#interests').val());
		$.post('profile',
			{
					field: "interests",
					content: $('input#interests').val()
			}
		);
	});
