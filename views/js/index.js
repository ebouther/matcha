$(function() {

  $('#login-form-link').click(function(e) {
		$("#login-form").delay(100).fadeIn(100);
 		$("#register-form").fadeOut(100);
    $("#forgot-form").fadeOut(100);
		$('#register-form-link').removeClass('active');
    $('#forgot-form-link').removeClass('active');
		$(this).addClass('active');
		e.preventDefault();
	});
	$('#register-form-link').click(function(e) {
		$("#register-form").delay(100).fadeIn(100);
 		$("#login-form").fadeOut(100);
    $("#forgot-form").fadeOut(100);
		$('#login-form-link').removeClass('active');
    $('#forgot-form-link').removeClass('active');
		$(this).addClass('active');
		e.preventDefault();
	});
  $('#forgot-form-link').click(function(e) {
    $("#forgot-form").delay(100).fadeIn(100);
    $("#login-form").fadeOut(100);
    $("#register-form").fadeOut(100);
    $('#login-form-link').removeClass('active');
    $('#register-form-link').removeClass('active');
    $(this).addClass('active');
    e.preventDefault();
  });

});
