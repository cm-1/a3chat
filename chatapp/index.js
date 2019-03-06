// A3 - Chat App for Web Based Systems
// Normally, my name and UCID number go here, but I don't want it online.
// The Readme pdf I submitted contains this info
// .................
// Socket.IO's chat tutorial was the starting point for this, as per the prof's suggestions.
// https://socket.io/get-started/chat/
// I recommend checking it out.
// That being said, a LOT has been added/changed into what's here now
// (Also, while we're talking about tutorials, Travery Media's "Node.js & Express From Scratch" is fantastic and you should check it out!)

const express = require('express');
const app = express();
const http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
  
});

http.listen(3000, function(){
  console.log('A3 chat app is listening on port number 3000.');
});