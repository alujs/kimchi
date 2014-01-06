var socket = io.connect();
var instance_name = prompt("Player Name"); 
var room_name = "Room1"; 
var stat = false;

socket.emit('room', room_name, instance_name);
	
socket.emit('account', instance_name, room_name);


socket.on('addPlayer', function( list, name, coords ) { 
	console.log("Initializing " + name)			 
	
	for(var i in list) {						
		if(list[i] !== instance_name) {
			var temp = '' + list[i];
			    temp = {gamename: list[i]};
			console.log(temp)
			ig.game.spawnEntity(EntityOtherPlayer, 1178, 861, temp);
		}
	}
});

socket.on('root', function() {
  console.log("The player that initializes the room should spawn these.")
  socket.emit('zombie', 'render', {room: room_name});
  stat = true;  	
});

socket.on('snapShot', function() { // I should just use _.extend ;_;
  if(stat === false) {
  	return;
  }
  console.log("Old players are now uploading")
  var results = {};
      results.players = {};
      results.mobs = {};
  var players = ig.game.getEntitiesByType(EntityOtherPlayer);
  var client = ig.game.getEntitiesByType(EntityPlayer);
  // I suspect we'll get more than one.. due to child references. 
  var mobs_a = ig.game.getEntitiesByType(EntityEnemy); // Need ot consolidate this if I can use child references.
  var mobs_b = ig.game.getEntitiesByType(EntityEnemy2);

      players = players.concat(client);
      mobs_a = mobs_a.concat(mobs_b);

  for(var i = 0; i < players.length; i++) {
    results.players[i] = {};
    results.players[i].tag = players[i].gamename;
    results.players[i].x = players[i].pos.x;
    results.players[i].y = players[i].pos.y; 
  };

  for(var x = 0; x < mobs_a.length; x++) {
  	results.mobs[x] = {};
  	results.mobs[x].tag = mobs_a[x].tag;
  	results.mobs[x].x = mobs_a[x].pos.x;
  	results.mobs[x].y = mobs_a[x].pos.y;
  	results.mobs[x].type = mobs_a[x].type; 
  }
  console.log(results)
  socket.emit('snapReply', results)
});

socket.on('staged', function() {
	
  if(stat === false) {
  	console.log("I am new so I should get this message")
  	socket.emit('ready');
  }

});

socket.on('draw', function( snapshot ) {
  console.log("I am ready to draw but are these .. functions valid?")
  console.log(snapshot);
  var mobs = snapshot.mobs;
  var players = snapshot.players; 
  var m_type;
  for(var i in mobs) { 
  	if(mobs[i].type === 'basic') {
  	  m_type = EntityEnemy;
  	} else {
  	  m_type = EntityEnemy2;
  	};
  	ig.game.spawnEntity(m_type, mobs[i].x, mobs[i].y, {tag: mobs[i].tag});
  }
  for(var x in players) {
  	ig.game.spawnEntity(EntityOtherPlayer, players[x].x, players[x].y, {gamename: players[x].tag})
  }
	stat = true;
});



socket.on('moveplayer', function( x, y, animation, client_name) {
	var playermove = ig.game.getEntitiesByType(EntityOtherPlayer); 
	for(var i = 0; i < playermove.length; i++) {
		if(playermove[i].gamename === client_name) { 
			playermove[i].state = animation; 
			playermove[i].pos.x = x;
			playermove[i].pos.y = y; 
			return;
		}
	}
});


socket.on('rollcall', function() { 
	socket.emit( 'salute', instance_name, room_name);
});

socket.on('deletePlayer', function( name ) { 
	console.log("Received")
  var deleteTarget = ig.game.getEntitiesByType(EntityOtherPlayer);
  for(var i = 0; i < deleteTarget.length; i++) { 
    if(deleteTarget[i].gamename === name) {
      deleteTarget[i].kill();
    }
    console.log("Successfully culled " + name);
    return;
  }
});

socket.on('spawnbullet', function( x, y, obj) { 
	ig.game.spawnEntity(EntityProjectile, x, y, obj); 
});


socket.on('sync', function( entArr ) { // now is resync 
  var tag;
  var zombies = ig.game.getEntitiesByType(EntityEnemy); 
  for(var i = 0; i < zombies.length; i++) { 
    tag = zombies[i].tag;
  	zombies[i].pos.x = entArr[tag].pos.x;
  	zombies[i].pos.y = entArr[tag].pos.y; 
  	zombies[i].animation = entArr[tag].pos.animation;
  	return; 
  }
});

socket.on('syncCall', function() { // receives a sync request and answers it with entities
  var myEntities = ig.game.getEntitiesByType(EntityEnemy); 
  socket.emit('myData', myEntities); 
});

socket.on('zrender', function( arr ) { // Renders the zombies. 
  console.log("count")
	for(var i = 0; i < arr.length; i++) {		
		ig.game.spawnEntity(EntityEnemy2, arr[i].x, arr[i].y, arr[i].settings );
	}
});

// socket.on('terminate', function( identity ) { 
// });

