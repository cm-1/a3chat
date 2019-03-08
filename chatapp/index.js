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

const LOGSIZE = 500;

//UNUSED: let nextUserID = 0; //Used for actual user numbers
let nextuserIdentifierSuffix = 0; //Used for actual user NAMES (default names, that is)

let msgLog = []; //Will store objects in the form {message, userID, timestamp}

let nicknames = {};	//Will store objects in the form {... userID: {nickname, colour}, ...}
					//Colour will be in string form, "#~~~~~~"

let online = []; //List of userIDs (socket IDs, in the case of this assignment) of online users

//isUsernameOnline( username ) function
let isUsernameOnline = function(username){
	//Test if a user with that nickname is online
	let userOnline = false;
	for (let userIdentifier of online){
		if (nicknames[userIdentifier].nickname === username) userOnline = true;
	}
	return userOnline;
};

//Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSL
//hue is in range 0-360
//sat is in range 0-1
//light is in range 0-1
let fromHslToRgb = function(hue, sat, light){
	hue = hue % 360;
	if (hue < 0) hue = 360 + hue;
	
	let chroma = (1 - Math.abs(2*light - 1)) * sat;
	let h2 = hue/60;
	let x = chroma * (1 - Math.abs((h2 % 2) - 1));
	
	console.log("hue:", hue, ", h2: ", h2, ", x:", x, ", chroma", chroma);
	
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
	console.log("(", r1, g1, b1, ")");
	let m = light - chroma/2;
	let finalCol = {r: Math.floor((r1 + m)*255), g: Math.floor((g1 + m)*255), b: Math.floor((b1 + m)*255)};
	return "#" + finalCol.r.toString(16).padStart(2, '0') + finalCol.g.toString(16).padStart(2, '0') + finalCol.b.toString(16).padStart(2, '0');
};

//Returns HSL lightness value
let lightness = function(r, g, b){
	let maxVal = Math.max(r, g, b);
	let minVal = Math.min(r, g, b);
	return 0.5 * (maxVal + minVal);
};



//Test if a colour is valid 6-digit hexadecimal:
//		newCol = newCol.trim(); //Remove whitespace
//		let colValid = /^[0-9, A-F]{6}$/i.test(newCol);
//^ is start of string, $ is end, "i" at end means case-insensitive, {6} means six chars from [...].


//Test if new colour is too dark?
//Make new colour
//nicknames[userNum].colour = "#" + newCol;


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket){
	console.log("User Connection Occurred");
	
	//Test for cookies.
	//If cookies, test if someone else "snatched" the username since
	
	//Makes username in form "User-Number", e.g. "User-1" or "User-23".
	let maxuserIdentifierSuffix = 10000;
	
	let autoNickname = "User-" + nextuserIdentifierSuffix.toString();
	nextuserIdentifierSuffix = (nextuserIdentifierSuffix + 1) % maxuserIdentifierSuffix;
	
	//Keep updating the username as necessary, in case of a conflict, somehow...
	while (isUsernameOnline(autoNickname)){
		autoNickname = "User-" + nextuserIdentifierSuffix.toString();
		nextuserIdentifierSuffix = (nextuserIdentifierSuffix + 1) % maxuserIdentifierSuffix;
	}
	
	//Create colour with random hue (range 0-360), middling saturation, middling lightness
	let col = fromHslToRgb(Math.floor((Math.random() * 360) + 1), 0.5, 0.5);
	
	nicknames[socket.id] = {nickname: autoNickname, colour: col};
	console.log(col);
	
	online.push(socket.id);
	
	socket.emit("welcome", {yourIdentifier: socket.id, online: online, nicknames: nicknames, msgLog: msgLog});
	socket.broadcast.emit("user list change", {online: online, nicknames: nicknames});
	
	
	console.log("nicknames: " + nicknames);
	console.log("online: " + online);
	
	socket.on("disconnect", function(){
		console.log("User " + socket.id + " Disconnected");
		let userIndex = online.indexOf(socket.id);
		if (userIndex >= 0) {
			online.splice(userIndex, 1);
		}
		io.emit("user list change", {online: online, nicknames: nicknames});
		console.log("online: " + online);
	});

	socket.on("new message", function(msg){
		date = new Date();
		
		let newMsg = {message: msg.message, userID: socket.id, timestamp: date.toUTCString()};
		msgLog.push(newMsg);
		
		//Only store so many messages, since we're using memory and not a database
		if (msgLog.length > LOGSIZE){
			msgLog = msgLog.slice(msgLog.length - LOGSIZE);
		}
		console.log("===\nHere1\n===");
		io.emit("new message", newMsg);		
		console.log("===\nHere2\n===");
		
		//Regex test for "/nick ..." command
		if (/^\/nick(\s|$)/i.test(msg.message)){
			let newNickname = msg.message.substr(6, msg.message.length).trim();
			if (newNickname.length <= 0){
				io.emit("warning", {warning: "Command failed. You have to specify a username.\nUsage: /nick myNewUsernameHere"});
			}
			else if (isUsernameOnline(newNickname)){
				io.emit("warning", {warning: "Command failed. Username is already in use, and is thus invalid.\nUsage: /nick myNewUsernameHere"});
			} else {
				nicknames[socket.id].nickname = newNickname;
				io.emit("user change", {userID: socket.id, nickname: nicknames[socket.id].nickname, colour: nicknames[socket.id].colour});
			}
		}
	});

});

http.listen(3000, function(){
	console.log("A3 chat app is listening on port number 3000.");
});




/*
The below is some username-generation code I want to preserve,
 but ultimately thought was too "risky" for this assignment.
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
