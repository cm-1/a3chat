$(document).ready(function() {
	console.log("yo yo, worldaka");
	let socket = io();
	let messages = $("#message-pane");
	let userIdentifier = 0;
	
	let nicknames = {};	//Will store objects in the form {... userID: {nickname, colour}, ...}
						//Colour will be in string form, "#~~~~~~"
	let online= [];
	
	messages.scrollTop(messages.prop("scrollHeight"));
	
	let addMessage = function(msgData){
		/*https://www.w3schools.com/howto/howto_css_chat.asp
		I'm using a modification of this for now, to test bottom-alignment and scrolling.
		CHANGE THE HTML! CHANGE THE CSS!
		*/
		
		/*console.log("names:");
		console.log(names);
		console.log("msgData:");
		console.log(msgData);*/
		
		msgTime = new Date(msgData.timestamp);
		
		let minutesString = msgTime.getUTCMinutes().toString();
		if (minutesString.length < 2) minutesString = "0" + minutesString;
		
		let $msgDiv = $("<div></div>").addClass("message");
		let $userString = $("<span></span>").addClass("nickname").text(nicknames[msgData.userID].nickname);
		let $youString = $("<span></span>").addClass("you-string");
		let $timeString = $("<span></span>").addClass("timestamp").text(msgTime.getUTCHours() + ":" + minutesString);
		let $msgString = $("<span></span>").addClass("message-data").text(msgData.message);
		
		$userString.css({"color":nicknames[msgData.userID].colour});
		
		if (msgData.userID === userIdentifier){
			$youString.text(" (You)");
			$userString.addClass("your-username");
			$msgDiv.addClass("you");
			$msgString.addClass("your-text");
		}

		$msgDiv.append($userString, $youString, ":", $timeString, "<br><br>", $msgString);
				
		$("#message-pane").append($msgDiv);
	};

	$("form").submit(function(e){
		e.preventDefault(); // prevents page reloading
		socket.emit("new message", {message: $("#msg-input").val(), userID: userIdentifier});
		$("#msg-input").val("");
		messages.scrollTop(messages.prop("scrollHeight")); //Scrolls to bottom of message pane
		return false;
	});
	
	socket.on("new message", function(msgData){
		//Check if we're at the bottom of the message pane, scroll-wise
		//The below check is discussed nicely at https://stackoverflow.com/questions/25505778/automatically-scroll-down-chat-div
		let atBottomOfMessages = messages.prop("scrollTop") + messages.prop("clientHeight") === messages.prop("scrollHeight");

		//console.log(msgData);
		addMessage(msgData);
		
		if(atBottomOfMessages){
			messages.scrollTop(messages.prop("scrollHeight")); //Scrolls to bottom of message pane
		}
    });
	
	socket.on("user list change", function(newInfo){
		online = newInfo.online;
		nicknames = newInfo.nicknames;
	});
	
	
	socket.on("welcome", function(welcomeData){
		console.log(welcomeData);
		userIdentifier = welcomeData.yourIdentifier;
		online = welcomeData.online;
		nicknames = welcomeData.nicknames;
		
		for(let msg of welcomeData.msgLog){
			addMessage(msg);
		}
		
		messages.scrollTop(messages.prop("scrollHeight"));
	});
});