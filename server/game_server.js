var io = require('socket.io'),
  once = false,
  hasCulled = false,
  db = require('firebase'),
  zomb = require('./helpers/ai.js'),
  pl = require('./helpers/player.js'),
  util = require('./helpers/utilities.js');

var rooms = {};  
var ids = {};   
var base = {}; 
var name_base = {};   
var scores = {}; 
var seed = {};



exports.setIO = function( obj ) { // 
	io = obj;                    
	return console.log("IO has been set on handler"); 
}

exports.handler = function( socket ) {

  socket.on('room', function( room, instance_name ) { 
  	if(rooms[room] === undefined) { 
  		rooms[room] = {};            
  		rooms[room].playerList = {}; 
  		rooms[room].socketid = {};  
  		rooms[room].playerList[instance_name] = instance_name; // Also instances are needed so we can have
  		rooms[room].socketid[socket.id] = socket.id; // unlimited games hosted. 
  	} else {
      rooms[room].playerList[instance_name] = instance_name;
      rooms[room].socketid[socket.id] = socket.id;
  	}
  	ids[socket.id] = room; // A bit on Socket io. Each client has a unique socket id that is 'permanent'
  });                     

  socket.on('initializePlayer', function( name ) { 
  	console.log("Initializing  " + name + " with ID of " + socket.id);
    var instance = ids[socket.id];
        instance = rooms[instance];
    
    for(var i in instance.socketid) { 
  	  io.sockets.socket(instance.socketid[i]).emit('addPlayer', instance.playerList, name);
  	}
  });

  socket.on('updatemove', function( x, y, animation, client_name ) { // eventually store and do checking before broadcasting
  	var instance = ids[socket.id];
        instance = rooms[instance];

    for(var i in instance.socketid) { // My next refactoring will be to use velocity rather than x/y
  	  io.sockets.socket(instance.socketid[i]).emit('moveplayer', x, y, animation, client_name);
  	}                                
  });

  socket.on('disconnect', function() { 
  	var instance = ids[socket.id];
        instance = rooms[instance];   
    console.log("A client has disconnected from an instance:  " + instance)
    
    for(var i in instance.socketid) {
  	  io.sockets.socket(instance.socketid[i]).emit('rollcall');
  	}                            
    
    if(!hasCulled) {
    	hasCulled = true;          
      setTimeout( function(){    
      	cullPlayers(instance);
      }, 2000);
    }

  });

  socket.on('salute', function( name ) { 
  	var instance = ids[socket.id];      
        instance = rooms[instance];    

  	instance.playerList[name] = true;
  });

  var cullPlayers = function( instance ) {
    var hasPlayers = false;  
    for(var i in instance.playerList) {   
      if(instance.playerList[i] === true) { 
      	instance.playerList[i] = i;
        hasPlayers = true;       
      } else {
      	for(var x in instance.socketid) {
  	      io.sockets.socket(instance.socketid[x]).emit('deletePlayer', i)
  	    }                               
      }                                
    }
    hasCulled = false;
    if(!hasPlayers) {
      util('nukeRoom', instance)
    } 
  };
 
 socket.on('firing', function( x, y, direction, animation, gamename ) {
    var instance = ids[socket.id];  
        instance = rooms[instance]; 
    for(var i in instance.socketid) {  
      io.sockets.socket(instance.socketid[i]).emit('spawnbullet', x, y, {direction: direction, owner:gamename});
    }                               
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
 } 