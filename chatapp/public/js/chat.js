$(document).ready(function() {
	console.log("yo yo, worldaka");
	let socket = io();
	let messages = $("#message-pane");
	
	messages.scrollTop(messages.prop('scrollHeight'));

	$('form').submit(function(e){
		e.preventDefault(); // prevents page reloading
		socket.emit('chat message', $('#msg-input').val());
		$('#msg-input').val('');
		messages.scrollTop(messages.prop('scrollHeight'));
		return false;
	});
	
	socket.on('chat message', function(msg){
		/*https://www.w3schools.com/howto/howto_css_chat.asp
		I'm using a modification of this for now, to test bottom-alignment and scrolling.
		CHANGE THE HTML! CHANGE THE CSS!
		*/
		
		//https://stackoverflow.com/questions/25505778/automatically-scroll-down-chat-div
		
		let shouldScroll = messages.prop('scrollTop') + messages.prop('clientHeight') === messages.prop('scrollHeight');
		
		$('#message-pane').append("<div class=\"message\">  <p>YOU: <span class=\"timestamp\">11:00</span><br><br>" + msg + "</p>  </div>");
		
		if(shouldScroll){
			messages.scrollTop(messages.prop('scrollHeight'));
		}
    });
});