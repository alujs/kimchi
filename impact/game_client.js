var socket = io.connect();
var instance_name = prompt("Player Name"); 
var room_name = "Room2"; 
var _loaded = false;
var counter = 50;

socket.emit('room', room_name, instance_name);

socket.emit('account', instance_name, room_name);


socket.on('addPlayer', function( name ) { 
	console.log("Initializing " + name);			 
	ig.game.spawnEntity(EntityOtherPlayer, 1178, 861, {gamename: name });
});

socket.on('root', function() {
  console.log("The player that initializes the room should spawn these.")
  socket.emit('zombie', 'render');
  _loaded = true;  	
});

socket.on('snapShot', function( flags ) { 
  var results; 
  if( flags !== undefined ) {
    results = gameState();
    console.log('Syncing.. for I am the master')
    socket.emit('snapReply', results, flags);
  } else {
    results = gameState();
    socket.emit('snapReply', results);
  }
});

socket.on('staged', function( flags ) {
  if(_loaded === false) {
  	socket.emit('ready');
    return;
  }
  if(flags !== undefined) {
    socket.emit('ready', 'sync');
  }
});


socket.on('draw', function( snapshot ) {
  if(_loaded === false) {
    redraw(snapshot);
  	_loaded = true;
    socket.emit("insert_player", instance_name);
  }
});

socket.on('reMap', function( snapshot ) {
  if(_loaded === false) {
    return;
  }
  remap(snapshot);
});

socket.on('moveplayer', function( x, y, animation, client_name, velx, vely) {
	var playermove = ig.game.getEntitiesByType(EntityOtherPlayer); 
	for(var i = 0; i < playermove.length; i++) {
		if(playermove[i].gamename === client_name) { 
      playermove[i].vel.x = 0;
      playermove[i].vel.y = 0;
			playermove[i].animation = animation; 
      playermove[i].vel.x = velx;
      playermove[i].vel.y = vely;
			return;
		}
	}
});


socket.on('rollcall', function() { 
	socket.emit('salute', instance_name, room_name);
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

socket.on('kill_mob', function( obj ) {
  var m_type = ig.game.getEntitiesByType(obj.mob);
  for(var i = 0; i < m_type.length; i++) {
    if(m_type[i].tag === obj.tag) {
      m_type[i].kill('despawn');
    }
  }
});


socket.on('zrender', function( arr ) {
	for(var i = 0; i < arr.length; i++) {		
		ig.game.spawnEntity(EntityEnemy, arr[i].x, arr[i].y, arr[i].settings );
	}
});

socket.on('damageTaken', function( damage ) {
  console.log('Ouch!')
  var player = ig.game.getEntitiesByType(EntityPlayer);
  player[0].receiveDamage( damage );
});

socket.on('killPlayer', function( name ) {
  var target = ig.game.getEntitiesByType(EntityOtherPlayer);
  for(var i = 0; i < target.length; i++ ) {
    if(target.gamename === name) {
       target.kill(); 
       console.log(name + " has been slain! ")
       return;
    }
  }
});

socket.on('updateScore', function( obj ) {
  ig.game.setScore(obj);
});

// socket.on('defeat', function() {
//   ig.game.gameLost();
//   alert("Your failure was inevitable, but as a consolation prize here's your score: " + ig.game.retrieveScore())
// });



var redraw = function( snapshot ) {
  var mobs = snapshot.mobs;
  var players = snapshot.players; 
  for(var i in mobs) { 
    ig.game.spawnEntity(mobs[i].type, mobs[i].x, mobs[i].y, {tag: mobs[i].tag});
  };
  for(var x in players) {
    ig.game.spawnEntity(EntityOtherPlayer, players[x].x, players[x].y, {gamename: players[x].tag})
  };
}


var gameState = function() {
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
    results.mobs[x].type = mobs_a[x].mob; 
  };
  return results; 
}

var remap = function( snapshot ) {
  
  var pents = playerents();
  var ments = mobsents();
  var plength = pents.length;
  var mlength = ments.length;
  for(var i = 0; i < plength; i++) {
    for(var x in snapshot.players) {
      if(snapshot.players[x].tag === pents[i].gamename) {
        if(close_or_far(pents[i],snapshot.players[x])) {
          pents[i].pos.x = snapshot.players[x].x; 
          pents[i].pos.y = snapshot.players[x].y;
        }
      }
    }
  }
  for(var k = 0; k < mlength; k++) {
    for(var z in snapshot.mobs) {
      if(snapshot.mobs[z].tag === ments[k].tag && snapshot.mobs[z].type === ments[k].mob) {
        if(close_or_far(ments[k],snapshot.mobs[z])) {
          ments[k].pos.x = snapshot.mobs[z].x;
          ments[k].pos.y = snapshot.mobs[z].y;
        }
      }
    }
  } 
};

var playerents = function() {
  var results = ig.game.getEntitiesByType(EntityPlayer);
      results = results.concat(ig.game.getEntitiesByType(EntityOtherPlayer));
  return results; 
}

var mobsents = function() {
  var results = ig.game.getEntitiesByType(EntityEnemy);
      results = results.concat(ig.game.getEntitiesByType(EntityEnemy2)); 
  return results;
}


var close_or_far = function(ent, reference) { // resync detector. 
  var ab = Math.abs;
  var ex = ab(ent.pos.x);
  var ey = ab(ent.pos.y);
  var rx = ab(reference.x);
  var ry = ab(reference.y);

  if(ex < rx){//
    if((rx - ex) >= 8){
      return false; 
    }
  };
  if(rx < ex){
    if((ex - rx) >= 8){
      return false; 
    }
  };
  if(ey < ry){
    if((ry - ey) >= 8){
      return false; 
    }
  };
  if(ey > ry){
    if((ey - ry) >= 8){
      return false; 
    }
  };
  return true;
};


socket.on('Scale', function( difficulty ) {
  console.log("RAWR!")
  dif = difficulty.diff;
  if(dif === 1) {
    return; 
  };

  var thing = function(){
    if(dif === 2){
      val = 'two';
    };
    if(dif === 3){
      val = 'three';
    };
    if(dif === 4){
      val = 'four';
    };
    if(dif === 5){
      val = 'five';
    };
    return val;
  }();

  ig.music.fadeOut(2000);
  setTimeout( function(){
    ig.music.play(thing);
  }, 2000);

  ig.game.horde.play();
  activateSpawn(dif);

  var temp = ig.game.getEntitiesByType(EntityEnemy);
      temp.concat(ig.game.getEntitiesByType(EntityEnemy2));
  
  for(var i = 0; i < temp.length; i++ ) {
      switch(true) {
        case (dif >= 2): // Mad Nug - time to move like a gundam
          temp[i].health += 50;
          temp[i].speed += 20;  
        case (dif >= 3): // wesker - time to avoid them command grabs 
          temp[i].speed += 30; 
        case (dif >= 4): // Cat Groove - time to dance 
          temp[i].speed += 40;
          temp[i].health += 50; 
        case (dif >= 5): // Bonus
          temp[i].pts += 200; 
          temp[i].speed += 10;
          temp[i].health += 100;
      }
  }
});

var activateSpawn = function( dif ) {
  switch(true) {
    case (dif === 2):
      setInterval(function(){
        for(var x = 0; x < 4; x++) {
          counter++; 
          ig.game.spawnEntity(EntityEnemy, 651, 1148, {tag: counter, speed: 300, pts: 150});
        }
      }, 8000);
    break;
    case (dif === 3):
      setInterval(function(){
        for(var x = 0; x < 10; x++) {
          counter++;
          ig.game.spawnEntity(EntityEnemy, 921, 1131, {tag: counter, speed: 50, health: 2000, pts: 120, deeps: 40});
        }
      }, 4000);
    break;
    case (dif === 4):
      setInterval(function(){
        for(var x = 0; x < 3; x++) {
         counter++;
         ig.game.spawnEntity(EntityEnemy, 1371, 1085, {tag: counter, health: 5, speed: 400, pts: 10, deeps: 80});
        }
      }, 6000);
      setInterval(function(){
        for(var x = 0; x < 15; x++) {
          counter++;
          ig.game.spawnEntity(EntityEnemy, 1322, 485, {tag: counter, health: 800, speed: 130, pts: 130, deeps: 25});
        }
      }, 3000);
    break;
    case (dif === 5):
      setInterval(function(){
        for(var x = 0; x < 25; x++) {
          counter++;
          ig.game.spawnEntity(EntityEnemy, 1723, 490, {tag: counter, health: 900, speed: 170, pts: 200, deeps: 80});
        }
      }, 7000);
    break;
  }
};



