var io = require('socket.io'),
  once = false,
  hasCulled = false,
  db = require('firebase'),
  zomb = require('./helpers/ai.js'),
  pl = require('./helpers/player.js');
    // refactor all the player stuff into this file to clean up room. 
                                       // pass rooms and IDs to player.js for functionality.

var rooms = {};  // Holds the instance and ID's associated with the instance.
var ids = {};   // Holds the IDs and the room each iD belongs to. 
var base = {}; // Holds all the Firebase crap so I don't proliferate memory with repeated new calls.
var name_base = {};   
var scores = {}; // Is mainly used to cache the high score then store it later int he Firebase 
// ^-- These variables are the ARE THE KEY  


exports.setIO = function( obj ) { // This is super important. Because IO is initialized in server.js 
	io = obj;                    // I need to somehow transfer it over. So I do it here.
	return console.log("IO has been set on handler"); 
}

exports.handler = function( socket ) {

  socket.on('room', function( room, instance_name ) { // this shit is pretty confusing eh?
  	if(rooms[room] === undefined) { // Basically I am establishing a whole list of instance links
  		rooms[room] = {};            // like I mentioned above with those variables. 
  		rooms[room].playerList = {}; // The ultimate goal is to be able to make "rooms"
  		rooms[room].socketid = {};  // and to identify players in those rooms so I know 
                                  // Who to broad cast signals to and conserve bandwidth
  		rooms[room].playerList[instance_name] = instance_name; // Also instances are needed so we can have
  		rooms[room].socketid[socket.id] = socket.id; // unlimited games hosted. 
  	} else {
      rooms[room].playerList[instance_name] = instance_name;
      rooms[room].socketid[socket.id] = socket.id;
  	}
  	ids[socket.id] = room; // A bit on Socket io. Each client has a unique socket id that is 'permanent'
  });                     // so it is useful to track players by such.

  socket.on('initializePlayer', function( name ) { // more initialization .
  	console.log("Initializing  " + name + " with ID of " + socket.id);
    var instance = ids[socket.id];
        instance = rooms[instance];
    
    for(var i in instance.socketid) { // need to fix this because all players spawn in the same spot.
  	  io.sockets.socket(instance.socketid[i]).emit('addPlayer', instance.playerList, name);
  	}
  });

  socket.on('updatemove', function( x, y, animation, client_name ) { // eventually store and do checking before broadcasting
  	var instance = ids[socket.id];
        instance = rooms[instance];

    for(var i in instance.socketid) { // My next refactoring will be to use velocity rather than x/y
  	  io.sockets.socket(instance.socketid[i]).emit('moveplayer', x, y, animation, client_name);
  	}                                // However, I'll use a resync method with xy to make sure stuff stays glued reasonably
  });

  socket.on('disconnect', function() { // This will need a bit of explanation...
  	var instance = ids[socket.id];
        instance = rooms[instance];   // Once a player DCs I emit a roll call to the room
    console.log("A client has disconnected from an instance:  " + instance)
    
    for(var i in instance.socketid) {
  	  io.sockets.socket(instance.socketid[i]).emit('rollcall');
  	}                            // For every player that does respond I set them to true on the
    
    if(!hasCulled) {
    	hasCulled = true;          // variable list I had at the start. Then I have a set time out
      setTimeout( function(){    // and call the cull function which you will see at bottom...
      	cullPlayers(instance);
      }, 2000);
    }

  });

  socket.on('salute', function( name ) { // part of the culling/disconnect function series. 
  	var instance = ids[socket.id];      // Each player that responds the server sets their name 
        instance = rooms[instance];    // as true then cull will hit about 2 sec later.

  	instance.playerList[name] = true;
  });

  var cullPlayers = function( instance ) { // Cull takes a list and uses the element's name
    for(var i in instance.playerList) {   // to overwrite 'true'
      if(instance.playerList[i] === true) { // this is necessary because I still  use the name and 
      	instance.playerList[i] = i;      // cull relies on a true/false to delete so.. yeah..
      } else {
      	for(var x in instance.socketid) { // So each player that isn't true gets axed by the clients 
  	      io.sockets.socket(instance.socketid[x]).emit('deletePlayer', i)
  	    }                                // And I also make sure cull can only be called at a certain rate
      }                                 // this prevents overlapping culls which may lead to desync issues.
    }
    hasCulled = false; 
  };
 
 socket.on('firing', function( x, y, direction, animation, gamename ) {
    var instance = ids[socket.id];  // I kind of have beef with you in regards with firing
        instance = rooms[instance]; // You changed the projectile to receive x/y/direction
                                    // Rather than x/y/settings  ; settings allows yout o initialize with directions
    for(var i in instance.socketid) {  // but more importantly I can assign OWNERSHIP to the bullet 
      io.sockets.socket(instance.socketid[i]).emit('spawnbullet', x, y, {direction: direction, owner:gamename});
    }                               // This is necessary to keep track of who gets the killing blow for score!
  });


 socket.on('zombie', function( type, obj ) {// This messed up code is going to be weird to read
    var instance = ids[socket.id];   // Basically all this is just fancy routing 
        instance = rooms[instance];  // which makes the code more modular but in this case impossible to read
    if(base[obj.room] === undefined) { // So that's like -100 pts. 
      base[obj.room] = new db("https://hrproj.firebaseio.com/Rooms/" + obj.room + "/Zombies");
      zomb.ai['spawner'](base[obj.room]); 
    }
    for(var i in instance.socketid) {
      zomb.ai[type]( io.sockets.socket(instance.socketid[i]), base[obj.room], obj);
    }
 });

 // When you send a message to a zombie sub system . You send 'zombie' then the type so 'move',
 // 'spawn' , 'whatever' and then attach an object as an option argument. zomb.ai[type] is an object
 // filled with functions.  Anyways this stuff isn't as important. 

 // These next few functions are all score related. It follows the same concept as before using
 // objects to temporarily cache and hold different instances of things for sorting. 
 // The helper functions are all but empty btw. Only ai.js in /helpers has any value.. and even then not really.
 socket.on('account', function( name, room ) {
   name_base[name] = new db('https://hrproj.firebaseio.com/Rooms/' + room + "/Users/" + name + "/");
   name_base[name].child('health').set(300);
   name_base[name].child('kills').set(0);
   name_base[name].child('score').set(0);

   scores[room] = {};
   scores[room].name = {};
   scores[room].name[name] = {};
   scores[room].name[name].kills = 0;
   scores[room].name[name].score = 0;   

 });

 socket.on('score', function( kb, points ) {
    var instance = ids[socket.id]; 
    scores[instance].name[kb].kills += 1; 
    scores[instance].name[kb].score += points;

    name_base[kb].child('kills').set( scores[instance].name[kb].kills );
    name_base[kb].child('score').set( scores[instance].name[kb].score );
 });
 // write a syncing function; a BIG to-DO next to refining the AI. 
 } // end of handler;