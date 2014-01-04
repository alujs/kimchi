var socket = io.connect();
var instance_name = prompt("Player Name"); // I suggest Admin. 
var room_name = "Room1"; // For now everyone is going to be stuck in room1, I have the 
						// option to make it multiple instances but for testing/firebase
						// it's simply easier
						// The next big step is to use cookies so I don't have a pop up prompt.
socket.emit('room', room_name, instance_name);
	// Remember those variable initializer we had in game_server? These three, room/zombie/account
socket.emit('zombie', 'render', {room: room_name}); // all do that

socket.emit('account', instance_name, room_name);


socket.on('addPlayer', function( list, name ) { // This adds a player, really primitive REALLY 
	console.log("Initializing " + name)			// needs to be refactored. 
	console.log(list)
	for(var i in list) {						// So much damn work. So many small details...
		if(list[i] !== instance_name) {
			ig.game.spawnEntity(EntityOtherPlayer, 160, 240, {gamename:list[i]});
		}
	}
});

socket.on('moveplayer', function( x, y, animation, client_name ) { // Needs to be refactored to
																// use predictive movement 
	var playermove = ig.game.getEntitiesByType(EntityOtherPlayer); // and velocity
																// btw Let me deal with this..
	for(var i = 0; i < playermove.length; i++) {
		if(playermove[i].gamename === client_name) {
			playermove[i].pos.x = x;
			playermove[i].pos.y = y; 
			playermove[i].animation = animation;
			return;
		}
	}
});


socket.on('rollcall', function() { // For culling. If you don't reply with a salute you get culled. 
	socket.emit( 'salute', instance_name, room_name);
});

socket.on('deletePlayer', function( name ) { // Cull from server results in this.
	console.log("Received")
  var deleteTarget = ig.game.getEntitiesByType(EntityOtherPlayer);
  for(var i = 0; i < deleteTarget.length; i++) { // is this a DOM manipulation? if so , we should cache the length
    if(deleteTarget[i].gamename === name) {
      deleteTarget[i].kill();
    }
    console.log("Successfully culled " + name);
    return;
  }
});

socket.on('spawnbullet', function( x, y, obj) { // When designing things keep original functionality
											   // initialize through settings or the third argument. 
	ig.game.spawnEntity(EntityProjectile, x, y, obj); // that costed me a lot of pain =( 
});

// socket.on('spawnzombie', function( x, y, settings ) {
// 	ig.game.spawnEntity(EntityEnemy, x, y, settings);
// });

socket.on('movezombie', function( x, y, animation, id) { // Totally irrelevant and not used. 
  var zombies = ig.game.getEntitiesByType(EntityEnemy); // Zombie movement on server side is too costly
  for(var i = 0; i < zombies.length; i++) { // So I have to modify the AI . It sucks but I discovere dit the hard way.
  	if(zombies[i].tag === id) {
	  	zombies[i].vel.x = x;
	  	zombies[i].vel.y = y; 
	  	zombies[i].animation = animation;
	  	return; 
    }
  }
});

socket.on('zrender', function( arr ) { // Renders the zombies. 
  console.log("count")
	for(var i = 0; i < arr.length; i++) {		
		ig.game.spawnEntity(EntityEnemy2, arr[i].x, arr[i].y, arr[i].settings );
	}
});

socket.on('terminate', function( identity ) { // Culls the zombies. Eventually.
											// not functional obviously :( 
												// I made small mods to enemy/player/and projectile. 
});											// I will start with projectile. 