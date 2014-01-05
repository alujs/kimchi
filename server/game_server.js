var io = require('socket.io'), // refactor this entire thing to use Socket.io rooms. Le sigh.
  once = false,
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
var entity = {};
var hasCulled = false; 
var hasCalled = true; 

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
      rooms[room].playerCount = 1;   
  		rooms[room].playerList[instance_name] = instance_name; // Also instances are needed so we can have
  		rooms[room].socketid[socket.id] = socket.id; // unlimited games hosted. 
  	} else {
      rooms[room].playerList[instance_name] = instance_name;
      rooms[room].socketid[socket.id] = socket.id;
      rooms[room].playerCount += 1;
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

  socket.on('updatemove', function( x, y, animation, client_name, velx, vely ) { // eventually store and do checking before broadcasting
  	var instance = ids[socket.id];
        instance = rooms[instance];

    for(var i in instance.socketid) { // My next refactoring will be to use velocity rather than x/y
  	  io.sockets.socket(instance.socketid[i]).emit('moveplayer', x, y, animation, client_name, velx, vely);
  	}                                
  });

  socket.on('disconnect', function() { 
  	var instance = ids[socket.id];
        instance = rooms[instance];
    var counter = instance.playerCount;
    var room = ids[socket.id];   
    console.log("A client has disconnected from an instance:  " + instance)
    counter -= 1; 
    if(counter === 0) {
      return util('nukeRoom', room);
    }

    for(var i in instance.socketid) {
  	  io.sockets.socket(instance.socketid[i]).emit('rollcall');
  	}                            
    
    if(!hasCulled) {
    	hasCulled = true;          
      setTimeout( function(){ 
      	cullPlayers(instance, room);
      }, 2000);
    }

  });

  socket.on('salute', function( name ) { 
  	var instance = ids[socket.id];      
        instance = rooms[instance];    

  	instance.playerList[name] = true;
  });

  var cullPlayers = function( instance, room ) { 
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
  };
 
 socket.on('firing', function( x, y, direction, animation, gamename ) {
    var instance = ids[socket.id];  
        instance = rooms[instance]; 
    for(var i in instance.socketid) {  
      io.sockets.socket(instance.socketid[i]).emit('spawnbullet', x, y, {direction: direction, owner:gamename});
    }                               
  });


 socket.on('zombie', function( type, obj ) {
    var instance = ids[socket.id];   
        instance = rooms[instance];  
    if(base[obj.room] === undefined) { 
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


 socket.on('myData', function( data ) {
   var instance = ids[socket.id];  
       instance = rooms[instance];

   if(entity[instance] === undefined) {
     entity[instance] = [];
     entity[instance].push(data);
   } else {
     entity[instance].push(data);
   }

   if(hasCalled) {
     hasCalled = false; 
     setTimeout(function() {
       var chosen = util('resync', entity[instance]);
       for(var i in instance.socketid) {  
        io.sockets.socket(instance.socketid[i]).emit('sync', chosen);
       };
       hasCalled = true;
       entity[instance] = [];  
     }, 1000);
   }

 });

 };


 exports.sync = function( self ) { 
   io.sockets.emit('syncCall');
   var that = self; // I don't even...
   setTimeout( function() {
     self(that);
   } ,10000)
 }; 