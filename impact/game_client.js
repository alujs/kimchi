var socket = io.connect();
var instance_name = prompt("Player Name"); 
var room_name = "Room1"; 

socket.emit('room', room_name, instance_name);
	
socket.emit('zombie', 'render', {room: room_name}); 

socket.emit('account', instance_name, room_name);


socket.on('addPlayer', function( list, name ) { 
	console.log("Initializing " + name)			 
	console.log(list)
	for(var i in list) {						
		if(list[i] !== instance_name) {
			ig.game.spawnEntity(EntityOtherPlayer, 160, 240, {gamename:list[i]});
		}
	}
});

socket.on('moveplayer', function( x, y, animation, client_name, velx, vely ) {
	var playermove = ig.game.getEntitiesByType(EntityOtherPlayer); 
	for(var i = 0; i < playermove.length; i++) {
		if(playermove[i].gamename === client_name) {
			playermove[i].movex = velx;
			playermove[i].pos.x = x;
			playermove[i].movey = vely;
			playermove[i].pos.y = y;  
			playermove[i].animation = animation;
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

socket.on('terminate', function( identity ) { 
});

