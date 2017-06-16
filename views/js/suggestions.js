console.log(me);
console.log(users);

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
