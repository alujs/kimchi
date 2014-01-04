var Firebase = require('firebase');
var express = require('express'),
    port = 8081,
    root = __dirname + '/impact/',
    app = express();
var io = require('socket.io');
var game = require('./server/game_server.js'); // <-- The real meat of the server, refer to game_server.js 
var server = require('http').createServer(app)
    io = io.listen(server);

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  //app.use(app.router);
});

// This
app.use(express.static(__dirname));

app.use('/signin', function( req, res, next ) { // <-- Log in with Admin/Admin or skip straight to /imapct/index.html
  var user = req.body.user;
  var pw = req.body.pw;

  var fb = new Firebase('https://hrproj.firebaseio.com/Users/' + user + '/pw');
    
  fb.on('value', function( snapshot ) {
    
     if( snapshot.val() === pw ) {
       next();
     } else {
       res.send('/'); 
     }
  });

  
  // next();
  // for testing uncomment out line 38 and comment out all the fb crap. 
});

app.use(function( req, res, next ) {
  console.log("Passed");
  res.send('/impact/');
});


server.listen(port);

game.setIO(io);
io.sockets.on('connection', game.handler);  // <-- The real meat of the server, refer to game_server.js 

console.log('app listening on port', port);