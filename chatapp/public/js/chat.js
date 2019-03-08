$(document).ready(function() {
	console.log("Yo Yo, Worldaka");
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
		let $userString = $("<span></span>").addClass("nickname").attr("data-uID", msgData.userID).text(nicknames[msgData.userID].nickname);
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
	
	let updateUserList = function(){
		$("#user-list").empty()
		
		for (let uID of online){
			let $userString = $("<span></span>").addClass("nickname").attr("data-uid", uID).text(nicknames[uID].nickname);
			let $youString = $("<span></span>").addClass("you-string");
			
			$userString.css({"color":nicknames[uID].colour});
			
			if (uID === userIdentifier){
				$youString.text(" (You)");
				$userString.addClass("your-username");
			}
			
			$("#user-list").append($("<li></li>").append($userString, $youString));
		}
	};

	$("form").submit(function(e){
		e.preventDefault(); // prevents page reloading
		socket.emit("new message", {message: $("#msg-input").val()});
		$("#msg-input").val("");
		messages.scrollTop(messages.prop("scrollHeight")); //Scrolls to bottom of message pane
		return false;
	});
	
	socket.on("new message", function(msgData){
		//Check if we're at the bottom of the message pane, scroll-wise
		//The below check is discussed nicely at https://stackoverflow.com/questions/25505778/automatically-scroll-down-chat-div
		let atBottomOfMessages = Math.abs(messages.prop("scrollTop") + messages.prop("clientHeight") - messages.prop("scrollHeight")) <= 1;
		console.log("Scroll Info: ", messages.prop("scrollTop") + messages.prop("clientHeight") , ', ', messages.prop("scrollHeight"));
		//console.log(msgData);
		addMessage(msgData);
		
		if(atBottomOfMessages){
			messages.scrollTop(messages.prop("scrollHeight")); //Scrolls to bottom of message pane
		}
    });
	
	socket.on("warning", function(warningData){
		//Check if we're at the bottom of the message pane, scroll-wise
		//The below check is discussed nicely at https://stackoverflow.com/questions/25505778/automatically-scroll-down-chat-div
		let atBottomOfMessages = Math.abs(messages.prop("scrollTop") + messages.prop("clientHeight") - messages.prop("scrollHeight")) <= 1;
		console.log("Scroll Info (W): ", messages.prop("scrollTop") + messages.prop("clientHeight") , ', ', messages.prop("scrollHeight"));


		let $msgDiv = $("<div></div>").addClass("message").addClass("warning");
		let $topString = $("<span></span>").addClass("warning-top").text("ERROR");
		let $msgString = $("<span></span>").addClass("message-data").text(warningData.warning);
		console.log("I should be warning you!");

		$msgDiv.append($topString, ":", /*$timeString,*/ "<br><br>", $msgString);
				
		$("#message-pane").append($msgDiv);
		
		if(atBottomOfMessages){
			messages.scrollTop(messages.prop("scrollHeight")); //Scrolls to bottom of message pane
		}
    });
	
	socket.on("user list change", function(newInfo){
		online = newInfo.online;
		nicknames = newInfo.nicknames;
		
		updateUserList();
	});
	
	
	socket.on("welcome", function(welcomeData){
		console.log(welcomeData);
		userIdentifier = welcomeData.yourIdentifier;
		online = welcomeData.online;
		nicknames = welcomeData.nicknames;
		
		updateUserList();
		
		for(let msg of welcomeData.msgLog){
			addMessage(msg);
		}
		
		messages.scrollTop(messages.prop("scrollHeight"));
	});
	
	socket.on("user change", function(changeData){
		$(".nickname[data-uid|='" + changeData.userID + "']").css({"color" : changeData.colour}).text(changeData.nickname)
		nicknames[changeData.userID].nickname = changeData.nickname;
		nicknames[changeData.userID].colour = changeData.colour;
		updateUserList();
	});
});