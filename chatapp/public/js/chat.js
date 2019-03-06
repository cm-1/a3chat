$(document).ready(function() {
	console.log("yo yo, worldaka");
	let socket = io();

	$('form').submit(function(e){
		e.preventDefault(); // prevents page reloading
		socket.emit('chat message', $('#m').val());
		$('#m').val('');
		return false;
	});
	
	socket.on('chat message', function(msg){
		/*https://www.w3schools.com/howto/howto_css_chat.asp
		I'm using a modification of this for now, to test bottom-alignment and scrolling.
		CHANGE THE HTML! CHANGE THE CSS!
		*/
		$('#message-pane').append("<div class=\"message\">  <p>" + msg + "</p>  <span class=\"timestamp\">11:00</span></div>");
    });
});