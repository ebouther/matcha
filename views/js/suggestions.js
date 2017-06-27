console.log(me);
console.log(users);

$("#search").click(function () {
	var search = {
		age_min: $("#age_min").val(),
		age_max: $("#age_max").val(),
		pop_min: $("#pop_min").val(),
		pop_max: $("#pop_max").val(),
		dist_max: $("#dist_max").val()
	}

	var url = '/suggestions?' +
						'age_min=' + encodeURIComponent(search.age_min) + '&' +
						'age_max=' + encodeURIComponent(search.age_max) + '&' +
						'dist_max=' + encodeURIComponent(search.dist_max) + '&' +
						'pop_min=' + encodeURIComponent(search.age_min) + '&' +
						'pop_max=' + encodeURIComponent(search.pop_max);
	console.log("URL ", url);
	window.location.href = url;
});


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
		if (me.like.indexOf(username) !== -1) {
			if ((user = (users.find( function(user){return user.username === username} )))
					&& user.like.indexOf(me.username) !== -1)
				return;
		}
		$(this).css("display", "none");
	});

	$(".like_b").each(function(){
		if (me.like.indexOf($(this).attr('id')) !== -1) {
			$(this).css("background-color", "white");
			$(this).children().css("color", "red");
		}
	});
}

reloadButtons();
