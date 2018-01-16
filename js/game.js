/*
 *  锅哥
 *  微信： tornodo
 *  博客：https://www.jianshu.com/u/1b05a5363c32
 *  微信公众号： guo_game
 */

var game = new Phaser.Game(600, 150, Phaser.AUTO, 'game');

game.states = {};
// 引导
game.states.boot = function() {
    this.preload = function() {
        this.load.image('loading', 'assets/image/progress.png');
    },
    this.create = function() {
        this.state.start('preloader');
    }
}
// 用来显示资源加载进度
game.states.preloader = function() {
    this.preload = function() {
		this.day = '#FFFFFF';
    	game.stage.backgroundColor = this.day;
        var loadingSprite = this.add.sprite((this.world.width - 311) / 2, this.world.height / 2, 'loading');
        this.load.setPreloadSprite(loadingSprite, 0);
        this.load.atlasJSONHash('image', 'assets/image/image.png', 'assets/image/image.json');
		game.load.bitmapFont('font', 'assets/font/font_0.png', 'assets/font/font.fnt');
        this.load.audio('die', 'assets/audio/hit.mp3');
        this.load.audio('jump', 'assets/audio/press.mp3');
    },
    this.create = function() {
        this.state.start('menu');
    }
}

// 游戏菜单
game.states.menu = function() {
    this.create = function() {
		this.day = '#FFFFFF';
    	game.stage.backgroundColor = this.day;
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.land = this.add.tileSprite(0, game.height - 14, game.width, 14, 'image', 'land.png');//添加到屏幕底部
        this.dragon = this.add.sprite(0, 0, 'image', 'stand1.png')//添加小龙
  		this.dragon.animations.add('stand', ['stand1.png', 'stand2.png'], 2, true, false);
        this.dragon.anchor.set(0.5);
  		this.dragon.animations.play('stand');
        this.dragon.x = this.dragon.width;
        this.dragon.y = game.height - this.dragon.height / 2;
        this.tip = game.add.bitmapText(0, 0, 'font', "点击开始游戏", 28);
        this.tip.anchor.set(0.5);
        this.tip.x = game.world.centerX;
        this.tip.y = game.world.centerY;
        game.input.onDown.add(this.startGame, this);
    },
    this.startGame = function() {
    	this.land.destroy();
    	this.dragon.destroy();
    	this.tip.destroy();
        game.state.start('start');
    }
}
//游戏界面
game.states.start = function() {
    this.preload = function() {
        ///初始化状态
		this.score = 0; //得分
		this.topScore = 0;//最高得分
		this.speed = -500;
		this.day = '#FFFFFF';
		this.gameOver = false;//游戏是否结束
		this.birdMinY = 67;//乌鸦在屏幕上最低点，直接根据图片像素高度计算this.dragon.y - this.dragon.height - this.bird.height;
		this.birdMaxY = 86//乌鸦在屏幕上最高点this.dragon.y - this.dragon.height - this.bird.height / 2;
		
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.stage.backgroundColor = this.day;//设置背景色为白色
        this.land = this.add.tileSprite(0, game.height - 14, game.width, 14, 'image', 'land.png');
        game.physics.arcade.enable(this.land);
        this.land.autoScroll(this.speed, 0);//自动重复滚动
        this.land.body.allowGravity = false;//不用重力
        this.land.body.immovable = true;//不可移动的，别的物体碰到后会反弹
        //加载音频
        this.die = this.add.audio('die');//撞击后播放的声音
        this.jumpAudio = this.add.audio('jump');//点击跳跃的时候播放的声音
        this.input.maxPointers = 1;
    },
    this.create = function() {
        //----------------------------------云朵初始化----------------------------------
		this.cloudGroup = game.add.group();//云朵分组，循环使用云朵，添加5个云朵对象，意思就是一屏幕最多5个云朵
		this.cloudGroup.enableBody = true;//开启物理引擎
		for (var i = 0;i < 5;i++) {
			var cloud = this.add.sprite(game.width, 0, 'image', 'cloud.png');//把云朵放到屏幕最右边
			cloud.visible = false;//默认不可见的
			cloud.alive = false;//默认是dead状态
			this.cloudGroup.add(cloud);
		}
		this.cloudGroup.setAll('checkWorldBounds',true); //边界检测
    	this.cloudGroup.setAll('outOfBoundsKill',true); //出边界后自动kill
		//----------------------------------云朵初始化完成----------------------------------
		
		//----------------------------------小龙和分数初始化----------------------------------
    	this.dragon = this.add.sprite(0, 0, 'image', 'stand1.png')//添加小龙
        game.physics.arcade.enable(this.dragon);
        this.dragon.anchor.set(0.5);
        this.dragon.x = this.dragon.width;
        this.dragon.y = game.height - this.dragon.height / 2;
        this.dragon.body.collideWorldBounds = true;
        this.dragon.animations.add('die', ['die.png'], 1, true, false);
        this.dragon.animations.add('run', ['run1.png', 'run2.png'], 10, true, false);
        this.dragon.animations.add('down_run', ['down_run1.png', 'down_run2.png'], 10, true, false);
        this.dragon.animations.play('run');
        this.dragon.body.setCircle(this.dragon.width / 2);
        this.dragon.downRun = false;//是否在趴着跑
        this.dragon.isJumping = false;//记录是否正在跳跃
        
        this.topScore = localStorage.getItem("run_topScore") === null ? 0 : localStorage.getItem("run_topScore");
        this.scoreText = game.add.bitmapText(0, 10, 'font', "", 28);
        this.scoreText.x = game.width - this.scoreText.width - 30;
		//----------------------------------小龙和分数初始化完成----------------------------------
		
		//----------------------------------小仙人掌初始化----------------------------------
		this.smallGroup = game.add.group();//小仙人掌，看素材总共有三组
		this.smallGroup.enableBody = true;//开启物理引擎
		//game.height - 35,其中35是仙人掌的图片高度，意思是放到屏幕最下面
		var small1 = this.add.sprite(game.width, game.height - 35, 'image', 'small1.png');//仙人掌默认y坐标在屏幕最下方
		var small2 = this.add.sprite(game.width, game.height - 35, 'image', 'small2.png');//仙人掌默认y坐标在屏幕最下方
		var small3 = this.add.sprite(game.width, game.height - 35, 'image', 'small3.png');//仙人掌默认y坐标在屏幕最下方
		small1.visible = small2.visible = small3.visible = false;//默认不可见的
		small1.alive = small2.alive = small3.alive = false;//默认状态是dead
		this.smallGroup.add(small1);
		this.smallGroup.add(small2);
		this.smallGroup.add(small3);
        small1.body.setCircle(small1.width / 2);
		small2.body.setCircle(small2.width / 2);
		small3.body.setCircle(small3.width / 2);
		this.smallGroup.setAll('checkWorldBounds', true); //边界检测
    	this.smallGroup.setAll('outOfBoundsKill', true); //出边界后自动kill
		
		//----------------------------------小仙人掌初始化完成----------------------------------
		
		//----------------------------------大仙人掌初始化----------------------------------
		this.bigGroup = game.add.group();//大仙人掌，看素材，同小仙人掌一样是三组
		this.bigGroup.enableBody = true;//开启物理引擎
		var big1 = this.add.sprite(game.width, game.height - 35, 'image', 'big1.png');//仙人掌默认y坐标在屏幕最下方
		var big2 = this.add.sprite(game.width, game.height - 35, 'image', 'big2.png');//仙人掌默认y坐标在屏幕最下方
		var big3 = this.add.sprite(game.width, game.height - 35, 'image', 'big3.png');//仙人掌默认y坐标在屏幕最下方
		big1.visible = big2.visible = big3.visible = false;//默认不可见的
		big1.alive = big2.alive = big3.alive = false;//默认状态是dead
		this.bigGroup.add(big1);
		this.bigGroup.add(big2);
		this.bigGroup.add(big3);
		big1.body.setCircle(big1.width / 2);
		big2.body.setCircle(big2.width / 2);
		big3.body.setCircle(big3.width / 2);
		this.bigGroup.setAll('checkWorldBounds', true); //边界检测
    	this.bigGroup.setAll('outOfBoundsKill', true); //出边界后自动kill
		//----------------------------------大仙人掌初始化完成----------------------------------
		
		//----------------------------------乌鸦初始化----------------------------------
		this.bird = this.game.add.sprite(game.width, 0, 'image', 'bird1.png');
		this.bird.animations.add('fly', ['bird1.png', 'bird2.png'], 10, true, false);
		this.bird.visible = false;//默认不可见
		this.bird.alive = false;//默认是dead状态
		this.bird.checkWorldBounds = true;//检测边界
		this.bird.outOfBoundsKill = true;//出了边界就变成dead，后面会重新使用
		game.physics.arcade.enable(this.bird);
		this.bird.body.setCircle(this.bird.height / 2);
		//----------------------------------乌鸦初始化完成----------------------------------
		
        game.input.onDown.add(this.jump, this); //给鼠标按下事件绑定龙的跳跃动作
        this.spaceKey = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
        this.upKey = game.input.keyboard.addKey(Phaser.KeyCode.UP);
        game.input.keyboard.addKeyCapture([Phaser.KeyCode.SPACEBAR, Phaser.KeyCode.UP]);
        
		game.time.events.loop(2800, this.addCloud, this); //利用时钟事件来添加云朵
		game.time.events.loop(1000, this.addProps, this); //利用时钟事件来循环添加道具
		game.time.events.loop(100, this.updateScore, this);//利用时钟事件更新分数
		
    },
    this.updateScore = function() {
    	this.score++;
    	this.scoreText.text = "" + this.score + "    最高 " + Math.max(this.score, this.topScore);
        this.scoreText.x = game.width - this.scoreText.width - 30;
    },
    this.update = function() {
    	if (this.gameOver) {
    		return;
    	}
    	if (this.spaceKey.isDown || this.upKey.isDown) {
    		this.jump();
    	}
    	if (game.input.keyboard.isDown(Phaser.KeyCode.DOWN) && this.dragon.downRun === false) {
    		this.dragon.downRun = true;
    		this.dragon.animations.stop();
    		this.dragon.animations.play('down_run');
    		this.dragon.body.setSize(this.dragon.width, this.dragon.height / 2, 0, this.dragon.height / 2);
    	} else if (!game.input.keyboard.isDown(Phaser.KeyCode.DOWN) && this.dragon.downRun === true) {
    		this.dragon.downRun = false;
    		this.dragon.animations.stop();
    		this.dragon.animations.play('run');
        	this.dragon.body.setCircle(this.dragon.width / 2);
    		this.dragon.body.offset.set(0, 0);//恢复一下偏移为0
    	}
    	
    	if (game.physics.arcade.overlap(this.dragon, this.smallGroup) //跟小仙人掌碰撞检测
    		|| game.physics.arcade.overlap(this.dragon, this.bigGroup)//跟大仙人掌碰撞检测
    		|| game.physics.arcade.overlap(this.dragon, this.bird)) {//跟乌鸦碰撞检测
			this.smallGroup.forEach(function(item){
        		item.body.stop();
        	});
        	this.bigGroup.forEach(function(item){
        		item.body.stop();
        	});
        	this.bird.animations.stop();
    		this.bird.body.stop();
    		this.failed();
		}
    },
    this.jump = function() {//跳跃方法
    	if (this.gameOver || this.dragon.isJumping || this.dragon.downRun) {
    		return;
    	}
    	this.dragon.isJumping = true;//修改小龙状态为在跳跃种
    	this.jumpAudio.play();//播放跳跃声音
    	this.jumpTween = game.add.tween(this.dragon).to({//跳跃的运动
	        y : this.dragon.y - 90
	    }, 300, Phaser.Easing.Cubic.InOut, true);
	    this.jumpTween.yoyo(true, 0);
	    this.jumpTween.onComplete.add(this.jumpOver, this, 0, this.dragon);//运动结束回掉
    },
    this.render = function() {
    	game.debug.body(this.dragon);
    	game.debug.body(this.bird);
    	this.smallGroup.forEach(function(item){
    		game.debug.body(item);
    	});
    	this.bigGroup.forEach(function(item){
    		game.debug.body(item);
    	});
    },
    this.jumpOver = function() {//跳跃完成
    	this.dragon.isJumping = false;
    },
    this.addCloud = function() {
    	if (this.gameOver) {
    		return;
    	}
    	//添加云层
    	var cloud = this.cloudGroup.getFirstDead();
		if (cloud !== null) {
			var y = game.rnd.between(cloud.height, game.height - this.dragon.height);
			cloud.reset(game.width, y);
			cloud.body.velocity.x = this.speed / 5;
		}
    },
    this.addProps = function() {//添加道具
    	if (this.gameOver) {
    		return;
    	}
    	//添加乌鸦还是仙人掌，随机来获取
    	var random = game.rnd.between(1, 100);
    	if (this.score >= 100) {//分数大于300后再随机道具里添加乌鸦
    		if (random > 60) {
    			if (this.bird.alive === false) {
    				var y = game.rnd.between(this.birdMinY, this.birdMaxY);
    				this.bird.reset(game.width, y);
					this.bird.body.velocity.x = this.speed;
					this.bird.animations.play('fly');
    			}
    		} else if (random > 30) {//大仙人掌
    			var big = this.bigGroup.getFirstDead();
				if (big !== null) {
					big.reset(game.width, game.height - big.height);
					big.body.velocity.x = this.speed;
				}
    		} else {//小仙人掌
    			var small = this.smallGroup.getFirstDead();
				if (small !== null) {
					small.reset(game.width, game.height - small.height);
					small.body.velocity.x = this.speed;
				}
    		}
    	} else {
    		if (random < 50) {//小仙人掌
    			var small = this.smallGroup.getFirstDead();
				if (small !== null) {
					small.reset(game.width, game.height - small.height);
					small.body.velocity.x = this.speed;
				}
    		} else {//大仙人掌
    			var big = this.bigGroup.getFirstDead();
				if (big !== null) {
					big.reset(game.width, game.height - big.height);
					big.body.velocity.x = this.speed;
				}
    		}
    	}
    },
    this.failed = function() {//游戏结束
    	this.die.play();//播放游戏结束的音乐
    	if (this.dragon.isJumping) {
    		this.jumpTween.stop();//如果正在跳跃，停止
    	}
    	this.dragon.animations.stop();//停止在播放的动画
    	this.dragon.animations.play('die');//切换到死亡动画
    	this.gameOver = true;//游戏结束
    	game.time.removeAll();//停止所有定时器
    	this.cloudGroup.forEach(function(item){//停止云层运动
    		item.body.stop();
    	});
    	game.input.onDown.remove(this.jump, this);//移除之前点击事件
    	game.input.onDown.add(this.gameStart, this); //添加新的点击事件
	    localStorage.setItem("run_topScore", Math.max(this.score, this.topScore));//保存最高分
	    this.land.stopScroll();//陆地停止运动
	    this.over = this.add.sprite(0, 0, 'image', 'gameover.png');//gameover
	    this.over.anchor.set(0.5);
	    this.over.x = game.world.centerX;
        this.over.y = game.world.centerY - 30;
        this.restart = this.add.sprite(0, 0, 'image', 'restart.png');//restart button
        this.restart.anchor.set(0.5);
        this.restart.x = game.world.centerX;
        this.restart.y = game.world.centerY + this.over.height;
        this.restart.inputEnabled = true;//允许点击
		this.restart.input.useHandCursor = true;//鼠标移动上去显示一个手的形状
		this.restart.events.onInputDown.add(this.gameStart, this);//点击事件
    },
    this.gameStart = function() {//清理资源，重新开始游戏
    	this.dragon.destroy();
    	this.bird.destroy();
    	this.land.destroy();
        this.die.destroy();
        this.jumpAudio.destroy();
        this.scoreText.destroy();
        this.over.destroy();
        this.restart.destroy();
        this.cloudGroup.forEach(function(cloud) {
		    cloud.destroy();
		});
		this.smallGroup.forEach(function(small) {
		    small.destroy();
		});
		this.bigGroup.forEach(function(big) {
		    big.destroy();
		});
        
        game.state.start('start');
    }
}

game.state.add('boot', game.states.boot);
game.state.add('preloader', game.states.preloader);
game.state.add('menu', game.states.menu);
game.state.add('start', game.states.start);
game.state.start('boot');