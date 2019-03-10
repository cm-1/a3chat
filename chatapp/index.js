// A3 - Chat App for Web Based Systems
// Normally, my name and University ID number go here, but I don't want it online.
// The Readme pdf I submitted contains this info
// .................
// Socket.IO's chat tutorial was the starting point for this, as per the prof's suggestions.
// https://socket.io/get-started/chat/
// I recommend checking it out.
// That being said, a LOT has been added/changed into what's here now
// (Also, while we're talking about tutorials, Travery Media's "Node.js & Express From Scratch" is fantastic and you should check it out!)

const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const cookie = require('cookie');

const LOGSIZE = 500;	//Number of messages that are stored in memory (no DB support for this assignment)

let nextUserID = 0; //Used for actual user numbers
let nextuserIdentifierSuffix = 0; //Used for actual user NAMES (default names, that is)

let msgLog = []; //Will store objects in the form {message, userID, timestamp}

let nicknames = {};	//Will store objects in the form {... userID: {nickname, colour}, ...}
					//Colour will be in string form, "#~~~~~~"
					
let idMap = {}; //Form: {socketID: userID}

let online = []; //List of userIDs (socket IDs, in the case of this assignment) of online users

//Function let's you know if any user going by <username> is online.
let isUsernameOnline = function(username){
	//Test if a user with that nickname is online
	let userOnline = false;
	for (let userIdentifier of online){	//Iterate through the "online" array
		if (nicknames[userIdentifier].nickname === username)
				userOnline = true;
	}
	return userOnline;
};

//Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSL
//hue is in range 0-360
//sat is in range 0-1
//light is in range 0-1
//
//Return value is in form #~~~~~~, e.g. #FF0000
let fromHslToRgb = function(hue, sat, light){
	hue = hue % 360;
	if (hue < 0) hue = 360 + hue;
	
	let chroma = (1 - Math.abs(2*light - 1)) * sat;
	let h2 = hue/60;
	let x = chroma * (1 - Math.abs((h2 % 2) - 1));
	
	//console.log("hue:", hue, ", h2: ", h2, ", x:", x, ", chroma", chroma);
	
	let r1 = 0;
	let g1 = 0;
	let b1 = 0;
	
	if (0 <= h2 && h2 <= 1){
		r1 = chroma; g1 = x;
	} else if (1 <= h2 && h2 <= 2){
		r1 = x; g1 = chroma;
	} else if (2 <= h2 && h2 <= 3){
		g1 = chroma; b1 = x;
	} else if (3 <= h2 && h2 <= 4){
		g1 = x; b1 = chroma;
	} else if (4 <= h2 && h2 <= 5){
		r1 = x; b1 = chroma;
	} else if (5 <= h2 && h2 <= 6){
		r1 = chroma; b1 = x;
	}
	//console.log("(", r1, g1, b1, ")");
	let m = light - chroma/2;
	
	//Convert back to 0-255 RGB range
	let finalCol = {r: Math.floor((r1 + m)*255), g: Math.floor((g1 + m)*255), b: Math.floor((b1 + m)*255)};
	//Convert THAT to hexadecimal, and prepend a "#". Then return.
	return "#" + finalCol.r.toString(16).padStart(2, '0') + finalCol.g.toString(16).padStart(2, '0') + finalCol.b.toString(16).padStart(2, '0');
};

//Returns HSL lightness value
//UNUSED in assignment submission.
//	(Was CONSIDERING testing if users' colours have a lightness that won't show up well.)
let lightness = function(r, g, b){
	let maxVal = Math.max(r, g, b);
	let minVal = Math.min(r, g, b);
	return 0.5 * (maxVal + minVal);
};

//CSS, Socket.IO, and client JS stored in /public
app.use(express.static(__dirname + "/public"));

//index.html is the html site for the chat app
app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");
});

/*
	HERE BEGINS ALL THE IMPORTANT SOCKET/NETWORK/LOGIC STUFF!
*/
io.on("connection", function(socket){
	//console.log("User Connection Occurred");
	
	let connUserID = -1; //-1 as default for debugging purposes
	
	//Test for cookies.
	let c = {};
	if (socket.request.headers.cookie)
		c = cookie.parse(socket.request.headers.cookie);
	
//IMPLEMENT: If cookies, test if someone else "snatched" the username since their disconnect

	//Test to make sure cookies don't mess anything up
	//Tests:
	//		- Does the cookie contain a userID we can use?
	//		- Is this a recognized userID, i.e. does it have a nickname?
	//If both are okay, we can just use this user's previous information, and update the socket-user mapping
	if(c.userID && nicknames[parseInt(c.userID)]){
		//parseInt is required because client code uses "===", which will not match strings and ints
		connUserID = parseInt(c.userID);
		console.log("UserID: ", connUserID);
		idMap[socket.id] = connUserID;
	}
	else{	//Otherwise, we have to create some new info for the user, especially a nickname
	
		//Makes username in form "User-Number", e.g. "User-1" or "User-23".
		
		//Eventually wrap usernames back around, so we don't get User-9999999999999999999 after so many connections
		let maxuserIdentifierSuffix = 10000;	
		
		let autoNickname = "User-" + nextuserIdentifierSuffix.toString();
		nextuserIdentifierSuffix = (nextuserIdentifierSuffix + 1) % maxuserIdentifierSuffix; //Modulus increment

		
		//Keep updating the username as necessary, in case of a conflict, somehow...
		while (isUsernameOnline(autoNickname)){
			autoNickname = "User-" + nextuserIdentifierSuffix.toString();
			nextuserIdentifierSuffix = (nextuserIdentifierSuffix + 1) % maxuserIdentifierSuffix;
		}
		
		//Create colour with random hue (range 0-360), middling saturation, middling lightness
		let col = fromHslToRgb(Math.floor((Math.random() * 360) + 1), 0.5, 0.5);
		
		idMap[socket.id] = nextUserID;
		connUserID = nextUserID;
		//In future versions, maybe use nextUserID = (nextUserID + 1) % Number.MAX_SAFE_INTEGER; to reset the next counter?
		nextUserID += 1;
		nicknames[connUserID] = {nickname: autoNickname, colour: col};
	}
	
	
	//console.log(col);
	
	//This if statement is MOSTLY if a single user opens up the chat in multiple tabs, sharing 1 cookie
	if (online.indexOf(connUserID) < 0)
		online.push(connUserID);
	
	//console.log(msgLog);
	
	//Socket.emit only sends message to connecting socket. It gets more info, because it's new
	socket.emit("welcome", {yourIdentifier: connUserID, online: online, nicknames: nicknames, msgLog: msgLog});
	
	//Socket.broadcast.emit sends message to all BUT the connecting socket. 
	//They just get the new user info
	socket.broadcast.emit("user list change", {online: online, nicknames: nicknames});
	
	//console.log("nicknames: " + nicknames);
	//console.log("online: " + online);

	//If a user leaves:
	socket.on("disconnect", function(){
		let curID = idMap[socket.id]; //Get user id
		//console.log("User " + curID + " Disconnected");
		let userIndex = online.indexOf(curID);
		
		//Quick check if the user's opened the chat in multiple tabs, all sharing the same cookie...
		let userConnectionCount = 0;
		for(let sock in idMap){
			if (idMap[sock] === curID)
				userConnectionCount += 1;
		}
		
		if (userIndex >= 0 && userConnectionCount < 2) {
			online.splice(userIndex, 1); //Remove user from online list
		}
		io.emit("user list change", {online: online, nicknames: nicknames});
		delete idMap[socket.id];	//Delete the socket-userID mapping
		//console.log("online: " + online);
	});

	//If a user submits a chat message:
	socket.on("new message", function(msg){
		let curID = idMap[socket.id]; //Get user id
		date = new Date();	//Timestamp
		
		let newMsg = {message: msg.message, userID: curID, timestamp: date.toUTCString()};
		msgLog.push(newMsg);
		
		//Only store so many messages, since we're using memory and not a database
		if (msgLog.length > LOGSIZE){
			msgLog = msgLog.slice(msgLog.length - LOGSIZE);
		}
		
		//Send everyone this new message that our lovely user sent
		io.emit("new message", newMsg);		
		
		//Regex test for "/nick " command
		// ^ is for start, \/nick is for /nick, (\s|$) tests for space (or end of string) after,
		//  and "i" is for case-insensitive
		if (/^\/nick(\s|$)/i.test(msg.message)){
			//Get the "argument" of the command
			let newNickname = msg.message.substr("/nick ".length, msg.message.length).trim();
			if (newNickname.length <= 0){
				io.emit("warning", {warning: "Command failed. You have to specify a username.<br>Usage: /nick myNewUsernameHere"});
			}
			else if (isUsernameOnline(newNickname)){
				io.emit("warning", {warning: "Command failed. Username is already in use, and is thus invalid.<br>Usage: /nick myNewUsernameHere"});
			} else {
				//If none of the above happen, we can successfully update the nickname...
				nicknames[curID].nickname = newNickname;
				//...and broadcast a message to all sockets to let them know.
				io.emit("user change", {userID: curID, nickname: nicknames[curID].nickname, colour: nicknames[curID].colour});
			}
		}
		//Regex test for "/nick ..." command. Same idea as with /nick, really
		else if (/^\/nickcolor(\s|$)/i.test(msg.message)){
			let newCol = msg.message.substr("/nickcolor ".length, msg.message.length).trim();
			
			//Test if a colour is valid 6-digit hexadecimal:
			// ^ is start of string, $ is end, "i" at end means case-insensitive, 
			// {6} means six chars from [0-9] or [A-F].
			let colValid = /^[0-9, A-F]{6}$/i.test(newCol);
			
//Test if new colour is too dark?

			if (colValid){
				nicknames[curID].colour = "#" + newCol; //Need to prepend "#"
				io.emit("user change", {userID: curID, nickname: nicknames[curID].nickname, colour: nicknames[curID].colour});
			}
			else {
				io.emit("warning", {warning: "Command failed. New colour is not properly formatted.<br>Usage: /nickcolor RRGGBB, e.g. /nickcolor FF33A4 "});
			}
		}
		
	});

});

//Starting the app on port 3000!
http.listen(3000, function(){
	console.log("A3 chat app is listening on port number 3000.");
});




/*
The below is some username-generation code I want to preserve,
 but ultimately thought was too stylistically "risky" for this assignment.
It was usernames in the form of Char-digit-char-digit.
E.g. a username of K5Y1

let userNum = 290;
let letters = "abcdefghijklmnopqrstuvwxyz";

let firstChar = letters.charAt(userNum % 26);
let secondChar = Math.floor(userNum / 26) % 10;
let thirdChar = letters.charAt(Math.floor(userNum / 260) % 26);
let fourthChar = Math.floor(userNum / (26*26*10)) % 10;
let username = firstChar.toUpperCase() + secondChar + thirdChar + fourthChar;*/
//Then check it's not already in use
//Keep trying until you find one not in use
