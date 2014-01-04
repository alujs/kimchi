ig.module( // move this to back end later.  LOL NOPE. 
  'plugins.ai'
)
.defines(function() {
  ig.ai = ig.Class.extend({
  
    init: function(entity) {
      ig.ai.ACTION = {Rest: 0, MoveLeft: 1, MoveRight: 2, MoveUp: 3, MoveDown: 4, Attack: 5, Block: 6};
      this.entity = entity;
      this.attackTimer = new ig.Timer(2);
    },
    doAction: function(action) { // Scroll to the decision thing. 
    	this.lastAction = action;
    	return action;
    },

    getAction: function(entity) {
      this.entity = entity;
      var playerList = ig.game.getEntitiesByType('EntityPlayer');
      var player = playerList[0];
      var distance = this.entity.distanceTo(player);
      var angle = this.entity.angleTo(player);
      var x_dist = distance * Math.cos(angle);
      var y_dist = distance * Math.sin(angle);
      var collision = ig.game.collisionMap;
      var res = collision.trace(this.entity.pos.x, this.entity.pos.y, x_dist, y_dist, this.entity.size.x, this.entity.size.y);
      if (res.collision.x) {
        if (angle > 0) {
          return this.doAction(ig.ai.ACTION.MoveUp);
        } else {
          return this.doAction(ig.ai.ACTION.MoveDown);
        }
      }
      if (res.collision.y) {
        if (Math.abs(angle) > Math.PI/2) {
          return this.doAction(ig.ai.ACTION.MoveLeft);
        } else {
          return this.doAction(ig.ai.ACTION.MoveRight);
        }
      }
      if (distance < 70) {
         if(this.attackTimer.delta()>0) {
          this.attackTimer.set(2);
          return this.doAction(ig.ai.ACTION.Attack);
         }
        // var decide = Math.random(); // <--- THIS SHIT SIR. THIIIS SHIT is funny because 
        // console.log('decide', decide); // If you think about it.. it presents a very difficult challenge for me
        // if (decide < 0.02) { // Since I can't put the AI on the server due to performance issues..
        //   return this.doAction(ig.ai.ACTION.Attack); // Each client has to manage AI.. but if each one has a random(); to it..
        // }                               // It makes syncing up an issue. We should figure out a way around this. 
        // return this.doAction(ig.ai.ACTION.Rest); // I am running on zero hours of sleep so.. =( )
      }
      if (distance > 30 && distance < 4000) {
        if (Math.abs(angle) < Math.PI / 4) {
          return this.doAction(ig.ai.ACTION.MoveRight);
        }
        if (Math.abs(angle) > 3 * Math.PI / 4) {
          return this.doAction(ig.ai.ACTION.MoveLeft);
        }
        if (angle < 0) {
          return this.doAction(ig.ai.ACTION.MoveUp);
        }
        return this.doAction(ig.ai.ACTION.MoveDown);
      }
      return this.doAction(ig.ai.ACTION.Rest);
    }
  });
});