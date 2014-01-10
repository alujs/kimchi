ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
	'game.levels.level1',
	'game.entities.player',
	'game.entities.enemy',
	'game.entities.enemy2',
	'game.entities.projectile',
	'impact.debug.debug',
	'plugins.ai',
	'plugins.functions.spawnlocations',
	'plugins.hud.hud'
)
.defines(function(){
	GameInfo = new function() {
		this.killCount = 0;
		this.score = 0;
	},
    GameEnd = ig.Game.extend({ // GAME END SCREEN. 
		EndImage : new ig.Image('media/endgame.png'),

		init: function() {
			ig.input.bind(ig.KEY.SPACE, "LoadGame");
		},

		update: function() {
		},

		draw: function() {
			this.parent();
			var font = new ig.Font('media/04b03.png');
			this.EndImage.draw(0, 0);
		}
    }),
    MissionFail = ig.Game.extend({
		EndImage : new ig.Image('media/missionfail.png'),

		init: function() {
		},

		update: function() {
			if (ig.input.pressed('LoadGame')) {
				ig.system.setGame(MyGame);
				GameInfo.killCount = 0;
				GameInfo.score = 0;
			}
		},

		draw: function() {
			this.parent();
			var font = new ig.Font('media/04b03.png');
			this.EndImage.draw(0, 0);
		}
    }),
	MyGame = ig.Game.extend({
		
		font: new ig.Font( 'media/04b03.png' ),
		hud: new ig.hud(),
		spawnTimer: new ig.Timer(2),
		//spaw: new ig.spawnlocations(),
		
		addKillCount: function () {
			GameInfo.killCount += 1;
		},

		increaseScore: function(points) {
			GameInfo.score += points;
		},

		setScore: function( obj ) {
			GameInfo.score = obj.score; 
			GameInfo.killCount = obj.kills; 
		},

		retrieveScore: function() {
			return GameInfo.score; 
		},

		gameLost: function() {
			console.log("Called lost");
			ig.system.setGame(MissionFail);
		},
		
		init: function() {
			ig.input.bind(ig.KEY.A, 'left');
			ig.input.bind(ig.KEY.S, 'down');
			ig.input.bind(ig.KEY.W, 'up');
			ig.input.bind(ig.KEY.D, 'right');
			ig.input.bind(ig.KEY.ENTER, 'fire');
			this.loadLevel (LevelLevel1);
			var player = ig.game.getEntitiesByType('EntityPlayer')[0];
			this.hud.setMaxHealth(player.health);
			var mainMusic = new ig.Sound('media/sounds/background.mp3');
		    mainMusic.play();
		},
		
		update: function() {
			this.parent();
			var player = this.getEntitiesByType(EntityPlayer)[0];
			if (player) {
				this.screen.x = player.pos.x - ig.system.width/2;
				this.screen.y = player.pos.y - ig.system.height/2;
			}
		},
		
		draw: function() {
			var player = this.getEntitiesByType(EntityPlayer)[0];
			
			player.messageBoxTimer = player.messageBoxTimer - 1;

			if (player.messageBoxTimer < 1) {
				player.messageBoxTimer = 100;
				var newText = '';
				var messageCollection = player.messageBox.split('\n');
				for (var i = 0; i < messageCollection.length; i++) {
					if (i === 0) {
						newText = newText + messageCollection[i];
					} else if (i > 1) {
						newText = newText + '\n' + messageCollection[i];
					}
				}
				player.messageBox = newText;
			}
			
			this.font.draw( player.messageBox, 10, 10);
			this.parent();
		}
	});


	// Start the Game with 60fps, a resolution of 320x240, scaled
	// up by a factor of 2
	ig.main( '#canvas', MyGame, 60, 800, 600, 1 );

});
