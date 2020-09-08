---
title: Cocos2d-JS实现的打飞机
date: 2016-07-10 18:17
categories: cocos2d-js
tags: [cocos2d-js,打飞机,cvp]
---
### 前言
今天我们来讲一个最最最常见的一个小游戏——打飞机！是的，打飞机！还记得小时候在玩儿的雷电，应该是打飞机最早的样子了吧。直到现在，也有微信打飞机，全民飞机大战，全民打飞机等游戏的出现，这些游戏基本都是在我们小时候玩儿的打飞机的原型上增加特效音效以及更多新的玩儿法，在这基础上进行的创新。<!--more-->其实作为开发者来说，仔细看这款游戏，也并不是什么高大上的游戏，其他很多元素、逻辑，都是我们常见的，比如滚动背景，定时产生敌人等。真正开发一款打飞机游戏，其实只要一天就够了，但这个游戏的经典玩法却是很难超越的，在这里，我不得不向这款游戏的原创致敬。
### 游戏分析
游戏中的元素基本可以确定，有玩家，三种敌机，两种道具，子弹和滚动的背景。而游戏的场景，也就是开始场景，游戏场景，帮助场景（这个都是可有可无的），暂停场景和结束场景。游戏中的逻辑其实也很简单，无非就是灵活运用定时器，定时产生敌人，定时产生子弹，定时产生道具，再然后就是玩家与道具，玩家与敌人，子弹与敌人的碰撞检测。我们可以把以上提到的元素全部抽象成类，每个类封装自己的实现接口，在游戏场景中调用相应类的对应的方法即可。
### 游戏实现
#### 全局类
游戏中所有用到的常量都可以放在一个全局类中，在实际开发中可根据需求动态修改，也方便管理维护。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Global = {
    // 子弹移动速度
    bulletSpeed:10,
    // 敌机移动速度
    enemySpeed:function(type){
        switch(type){
            case 1:
                return 5;
            break;
            case 2:
                return 3;
            break;
            case 3:
                return 2;
            break;
        };
    },
    // 敌机创造速度
    createEnemySpeed:function(type){
        switch(type){
            case 1:
                return 1;
            break;
            case 2:
                return 3;
            break;
            case 3:
                return 5;
            break;
        };
    },
    // 敌机生命
    enemyHp:function(type){
        switch(type){
            case 1:
                return 1;
            break;
            case 2:
                return 5;
            break;
            case 3:
                return 10;
            break;
        };
    },
    // 道具移动速度
    toolSpeed:function(type){
        switch(type){
            case 1:
                return 2;
            break;
            case 2:
                return 3;
            break;
        };
    },
    // 道具创造速度
    createToolSpeed:function(type){
        switch(type){
            case 1:
                return 30;
            break;
            case 2:
                return 50;
            break;
        };
    },
    // 射击速度
    shootSpeed:0.2,
    // 双倍射击时长
    doubleShootTimes:100
};
```
#### 背景类
游戏中用到的背景也可以提出来为一个背景类，游戏中的背景是滚动的，滚动背景的实现方式就是用两张相同的图片拼接起来，不断往下移动，当下面那张完全移出屏幕的时候，再将这张图片移动到前一张的上面，这样一直循环往复，就形成了不断滚动的背景。实现代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
 var Background = cc.Sprite.extend({
     ctor: function (isOver) {
        if(isOver){
            this._super();
            var bg = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("gameover.png"));
            bg.setScale(750/480);
            this.addChild(bg);
        }else{
            this._super();
            this.setScale(750/480);
            // 滚动背景图1
            var menuBg1 = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("background.png"));
            menuBg1.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
            menuBg1.setScale(750 / 480);
            menuBg1.setTag(1);
            this.addChild(menuBg1);
            // 滚动背景图2
            var menuBg2 = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("background.png"));
            menuBg2.setPosition(cc.winSize.width / 2, cc.winSize.height / 2 + cc.winSize.height - 4);
            menuBg2.setScale(750 / 480);
            menuBg2.setTag(2);
            this.addChild(menuBg2);
            this.schedule(this.update);
        }
        return true;
     },
     stopMove:function(){
        this.unschedule(this.update);
     },
     update: function () {
         var menuBg1 = this.getChildByTag(1);
         var menuBg2 = this.getChildByTag(2);
         if (menuBg1.getPositionY() <= -cc.winSize.height / 2 + 20) {
             menuBg1.setPositionY(cc.winSize.height / 2 + cc.winSize.height);
         } else {
             menuBg1.setPositionY(menuBg1.getPositionY() - 1);
         }
         if (menuBg2.getPositionY() <= -cc.winSize.height / 2 + 20) {
             menuBg2.setPositionY(cc.winSize.height / 2 + cc.winSize.height);
         } else {
             menuBg2.setPositionY(menuBg2.getPositionY() - 1);
         }
     }
 });
```
#### 子弹类
玩家不断发出子弹，子弹类需要包含移动和移除两个方法，子弹一旦被创建，就按照一个轨迹移动，直到碰撞到敌机或飞出屏幕才移除子弹，碰撞检测在游戏场景中实现，碰撞之后调用子弹类的移除方法。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Bullet = cc.Sprite.extend({
    gameLayer:null,
    ctor: function (type,isUp,gameLayer) {
        this.gameLayer = gameLayer;
        this._super(cc.spriteFrameCache.getSpriteFrame("bullet"+type+".png"));
        if(isUp){
            this.schedule(this.moveUp);
        }else{
            this.schedule(this.moveDown);
        }
        return true;
    },
    moveUp:function(){
        this.setPositionY(this.getPositionY() + Global.bulletSpeed);
        if(this.getPositionY()>=cc.winSize.height+this.height/2){
            // 飞出屏幕删除
            this.remove();
        }
    },
    moveDown:function(){
        this.setPositionY(this.getPositionY() - Global.bulletSpeed);
        if(this.getPositionY()<=-this.height/2){
            // 飞出屏幕删除
            this.remove();
        }
    },
    remove:function(){
        var index = this.gameLayer.bullets.indexOf(this);  
        if (index > -1) {  
            this.gameLayer.bullets.splice(index, 1);  
        }
        this.removeFromParent();
    }
});
```
#### 玩家类
游戏中的主角就是玩家类，玩家控制玩家类在屏幕中移动飞行，并不断射击子弹，玩家类中包含单行子弹射击和吃完道具之后的双行子弹射击两个方法，玩家还有移动方法，飞入屏幕方法和爆炸方法。同时飞机重复播放飞行动画。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Player = cc.Sprite.extend({
    lock:true,
    gameLayer:null,
    doubleCount:0,
    ctor: function (gameLayer) {
        this._super(cc.spriteFrameCache.getSpriteFrame("hero1.png"));
        this.gameLayer = gameLayer;
        this.doubleCount = 0;
        this.lock = true;
        // 飞行动画
        var heroHoldFrames = [
            cc.spriteFrameCache.getSpriteFrame("hero1.png"),
            cc.spriteFrameCache.getSpriteFrame("hero2.png")
        ];
        var holdAnimation = new cc.Animation(heroHoldFrames, 0.1);
        this.runAction(cc.repeatForever(cc.animate(holdAnimation)));
        this.moveIn();
        this.schedule(this.shootSingleBullet,Global.shootSpeed);
        return true;
    },
    shootSingleBullet:function(){
        if (!this.lock) {
            var bullet = new Bullet(2,true,this.gameLayer);
            bullet.setPosition(this.getPositionX(),this.getPositionY()+this.height/2);
            this.gameLayer.addChild(bullet);
            this.gameLayer.bullets.push(bullet);
            // 发射子弹音效
            cc.audioEngine.playEffect("res/sound/bullet.mp3");
        }
    },
    shootDoubleBegin:function(){
        this.unschedule(this.shootSingleBullet);
        this.schedule(this.shootDoubleBullet,Global.shootSpeed-0.1);
        this.doubleCount = 0;
    },
    shootDoubleBullet:function(){
        if (!this.lock) {
            if(this.doubleCount>=Global.doubleShootTimes){
                this.unschedule(this.shootDoubleBullet);
                this.schedule(this.shootSingleBullet,Global.shootSpeed);
            }else{
                this.doubleCount += 1;
                var bulletLeft = new Bullet(2,true,this.gameLayer);
                var bulletRight = new Bullet(2,true,this.gameLayer);
                bulletLeft.setPosition(this.getPositionX()-35,this.getPositionY()+5);
                bulletRight.setPosition(this.getPositionX()+35,this.getPositionY()+5);
                this.gameLayer.addChild(bulletLeft);
                this.gameLayer.addChild(bulletRight);
                this.gameLayer.bullets.push(bulletLeft);
                this.gameLayer.bullets.push(bulletRight);
                // 发射子弹音效
                cc.audioEngine.playEffect("res/sound/bullet.mp3");
            }
        }
    },
    moveIn:function(){
        this.runAction(cc.sequence(
            cc.moveTo(1, cc.p(cc.winSize.width/2, cc.winSize.height/2)),
            cc.moveBy(2, cc.p(0, -400)),
            cc.callFunc(function(player){
                // 播完动画解锁操作
                player.lock = false;
            },this,this)
        ));
    },
    moveBy:function(x,y) {
        if (!this.lock) {
            this.setPosition(this.getPositionX() + x, this.getPositionY() + y);
        }
    },
    blowUp:function(){
        this.lock = true;
        // 爆炸动画
        var blowUpFrames = [
            cc.spriteFrameCache.getSpriteFrame("hero_blowup_n1.png"),
            cc.spriteFrameCache.getSpriteFrame("hero_blowup_n2.png"),
            cc.spriteFrameCache.getSpriteFrame("hero_blowup_n3.png"),
            cc.spriteFrameCache.getSpriteFrame("hero_blowup_n4.png")
        ];
        var blowUpAnimation = new cc.Animation(blowUpFrames, 0.1);
        this.stopAllActions();
        this.runAction(cc.sequence(cc.animate(blowUpAnimation),cc.callFunc(function(hero){
            hero.removeFromParent();
        },this,this)));
    }
});
```
#### 敌机类
敌机分为三种，小型飞机，中型飞机和大型飞机，三种飞机的血量，速度都不相同，其中，大型飞机还能在每三秒创建三个小型飞机。敌机同样包含移动，击中和爆炸方法。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Enemy = cc.Sprite.extend({
    type:1,
    hp:0,
    gameLayer:null,
    ctor: function (type,gameLayer) {
        this.type = type;
        this.hp = Global.enemyHp(type);
        this.gameLayer = gameLayer;
        if(type==3){
            // 大型飞机的动画
            this._super(cc.spriteFrameCache.getSpriteFrame("enemy"+type+"_n1.png"));
            var holdFrames = [
                cc.spriteFrameCache.getSpriteFrame("enemy"+type+"_n1.png"),
                cc.spriteFrameCache.getSpriteFrame("enemy"+type+"_n2.png")
            ];
            var holdAnimation = new cc.Animation(holdFrames, 0.1);
            this.runAction(cc.repeatForever(cc.animate(holdAnimation)));
        }else{
            this._super(cc.spriteFrameCache.getSpriteFrame("enemy"+type+".png"));
        }
        this.schedule(this.moveDown);
        if(this.type==3){
            // 大飞机每3s产生3个小飞机
            this.schedule(function(){
                this.createEnemy();
            },3);
        }
        return true;
    },
    // 创造三个小型飞机
    createEnemy:function(){
        var enemy1 = new Enemy(1,this.gameLayer);
        var enemy2 = new Enemy(1,this.gameLayer);
        var enemy3 = new Enemy(1,this.gameLayer);
        var x1 = this.getPositionX()-this.width/2+enemy1.width/2;
        var x2 = this.getPositionX();
        var x3 = this.getPositionX()+this.width/2-enemy3.width/2;
        enemy1.setPosition(x1,this.getPositionY());
        enemy2.setPosition(x2,this.getPositionY());
        enemy3.setPosition(x3,this.getPositionY());
        this.gameLayer.addChild(enemy1);
        this.gameLayer.addChild(enemy2);
        this.gameLayer.addChild(enemy3);
        this.gameLayer.enemies.push(enemy1);
        this.gameLayer.enemies.push(enemy2);
        this.gameLayer.enemies.push(enemy3);
    },
    moveDown:function(){
        this.setPositionY(this.getPositionY() - parseInt(Global.enemySpeed(this.type)));
        if(this.getPositionY()<=-this.height/2){
            // 飞出屏幕删除
            this.remove();
        }
    },
    remove:function(){
        var index = this.gameLayer.enemies.indexOf(this);  
        if (index > -1) {  
            this.gameLayer.enemies.splice(index, 1);  
        }
        this.removeFromParent();
    },
    // 击中
    hit:function(){
        // 击中动画
        this.hp -= 1;
        if(this.hp<=0){
            this.blowUp();
        }else{
            var holdFrame = this.type==3?"enemy"+this.type+"_n1.png":"enemy"+this.type+".png";
            var hitFrames = [
                cc.spriteFrameCache.getSpriteFrame(holdFrame),
                cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_hit.png")
            ];
            var hitAnimation = new cc.Animation(hitFrames, 0.1);
            this.runAction(cc.sequence(cc.animate(hitAnimation),cc.callFunc(function(enemy){
                enemy.setSpriteFrame(cc.spriteFrameCache.getSpriteFrame(holdFrame));
            },this)));
        }
    },
    // 爆炸
    blowUp:function(){
        if(this.type==3){
            // 大飞机爆炸产生3个小飞机
            this.createEnemy();
        }
        this.unschedule(this.moveDown);
        var index = this.gameLayer.enemies.indexOf(this);  
        if (index > -1) {  
            this.gameLayer.enemies.splice(index, 1);  
        }
        // 爆炸动画
        var blowUpFrames = [
            cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down1.png"),
            cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down2.png"),
            cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down3.png"),
            cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down4.png")
        ];
        if(this.type==3){
            blowUpFrames = blowUpFrames.concat([
                cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down5.png"),
                cc.spriteFrameCache.getSpriteFrame("enemy"+this.type+"_down6.png")
            ]);
        }
        // 播放爆炸音效
        if(this.type==3){
            cc.audioEngine.playEffect("res/sound/enemy3_down.mp3");
        }else{
            cc.audioEngine.playEffect("res/sound/enemy1_down.mp3");
        }
        var blowUpAnimation = new cc.Animation(blowUpFrames, 0.1);
        this.stopAllActions();
        this.runAction(cc.sequence(cc.animate(blowUpAnimation),cc.callFunc(function(enemy){
            enemy.removeFromParent();
        },this,this)));
        // 加分
        this.gameLayer.addScore(this.type);
    }
});
```
#### 道具类
游戏中会定时掉落道具，道具类包含向下移动方法，移除方法和旋转方法。道具与玩家的碰撞检测在游戏场景中实现。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Tool = cc.Sprite.extend({
    gameLayer:null,
    type:0,
    ctor: function (type,gameLayer) {
        this._super(cc.spriteFrameCache.getSpriteFrame("ufo"+type+".png"));
        this.type = type;
        this.gameLayer = gameLayer;
        // 旋转特效
        this.rotate();
        // 向下移动
        this.schedule(this.moveDown);
        return true;
    },
    moveDown:function(){
        this.setPositionY(this.getPositionY()-Global.toolSpeed(this.type));
        if(this.getPositionY()<=-this.height/2){
            // 飞出屏幕删除
            this.remove();
        }
    },
    remove:function(){
        var index = this.gameLayer.tools.indexOf(this);  
        if (index > -1) {  
            this.gameLayer.tools.splice(index, 1);  
        }
        this.runAction(cc.sequence(cc.scaleTo(0.1,0),cc.callFunc(function(tool){
            tool.removeFromParent();
        },this,this)));
    },
    rotate:function(){
        var rotateAction = cc.repeatForever(cc.sequence(cc.rotateTo(1,30),cc.sequence(cc.rotateTo(1,-30))));
        this.runAction(rotateAction);
    }
});
```
#### 载入类
载入类只是在开始场景中的一个载入的循环播放的动画。
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var Loading = cc.Sprite.extend({
    ctor: function () {
        this._super(cc.spriteFrameCache.getSpriteFrame("game_loading1.png"));
        var loadingFrames = [
            cc.spriteFrameCache.getSpriteFrame("game_loading1.png"),
            cc.spriteFrameCache.getSpriteFrame("game_loading2.png"),
            cc.spriteFrameCache.getSpriteFrame("game_loading3.png"),
            cc.spriteFrameCache.getSpriteFrame("game_loading4.png")
        ];
        var loadingAnimation = new cc.Animation(loadingFrames, 0.5);
        this.runAction(cc.repeatForever(cc.animate(loadingAnimation)));
        return true;
    }
});
```
#### 开始场景
开始场景是游戏的入口场景，进入之后首先进入开始场景，开始场景包含开始游戏按钮和帮助按钮，点击帮助按钮进入帮助场景，点击开始按钮进入游戏场景。开始场景还包含一个滚动的背景图和一个载入动画。
开始场景的效果如下：
![开始场景](http://7xnnwn.com1.z0.glb.clouddn.com/MenuScene.gif)
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var MenuLayer = cc.Layer.extend({
    loadCount: 1,
    ctor: function () {
        this._super();
        this.loadCount = 1;
        // 加载plist
        cc.spriteFrameCache.addSpriteFrames(res.shoot_background_plist);
        // 添加背景图
        var bg = new Background(false);
        bg.setPosition(0,0);
        this.addChild(bg);
        // logo
        var copyright = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("shoot_copyright.png"));
        copyright.setPosition(cc.winSize.width / 2, cc.winSize.height / 2 + 270);
        copyright.runAction(cc.repeatForever(cc.sequence(cc.scaleTo(1, 1.5), cc.scaleTo(1, 1))));
        this.addChild(copyright);
        // 游戏按钮
        var startBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/game_start.png"),
            new cc.Sprite("res/game_start_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.director.runScene(new cc.TransitionFade(1, new GameScene()));
            }, this);
        var helpBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/game_help.png"),
            new cc.Sprite("res/game_help_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.director.runScene(new cc.TransitionFade(1, new HelpScene()));
            }, this);
        helpBtn.setPositionY(startBtn.getPositionY() - startBtn.height / 2 - 100);
        var menu = new cc.Menu(startBtn, helpBtn);
        this.addChild(menu);
        // loading动画
        var loading = new Loading();
        loading.setPosition(cc.winSize.width/2,200);
        this.addChild(loading);
        return true;
    }
});

var MenuScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new MenuLayer();
        this.addChild(layer);
    }
});
```
#### 游戏场景
从开始场景点击开始游戏按钮之后进入游戏场景，游戏场景包含所有的游戏逻辑，包括滚动背景，玩家，定时产生的敌机，定时产生的道具，玩家与敌机、敌机与子弹、以及玩家与道具的碰撞检测，玩家的移动操作，使用爆炸道具等。
游戏开始之前有一个玩家飞入屏幕的动画，效果图如下：
![玩家飞入](http://7xnnwn.com1.z0.glb.clouddn.com/MoveIn.gif)
玩家飞入之后，就可以定时创建子弹、道具与敌机，游戏场景的效果图如下：
![游戏场景](http://7xnnwn.com1.z0.glb.clouddn.com/GameScene.gif)
掉落的道具有发射双排子弹和炸弹两种，双排子弹效果图如下：
![双排子弹](http://7xnnwn.com1.z0.glb.clouddn.com/DoubleShoot.gif)
拾取到炸弹道具会累加到左下角的计数中，点击炸弹就可以使用，炸弹可让屏幕中所有飞机全部爆炸，效果图如下：
![炸弹](http://7xnnwn.com1.z0.glb.clouddn.com/Bomb.gif)
游戏中的敌机，子弹以及道具，都用数组来存储，每一帧都要遍历数组来进行碰撞检测，但玩家与子弹碰撞，玩家与敌机碰撞，以及敌机与子弹碰撞时，调用相应的类的逻辑，代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var GameLayer = cc.Layer.extend({
    touchStartX:0,
    touchStartY:0,
    bullets:[],
    enemies:[],
    tools:[],
    ctor: function () {
        this._super();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.bullets = [];
        this.enemies = [];
        this.tools = [];
        // 播放背景音乐
        cc.audioEngine.playMusic("res/sound/game_music.mp3",true);
        // 加载plist
        cc.spriteFrameCache.addSpriteFrames(res.shoot_background_plist);
        cc.spriteFrameCache.addSpriteFrames(res.shoot_plist);
        // 添加背景图
        var bg = new Background(false);
        bg.setPosition(0,0);
        this.addChild(bg);
        // 添加飞机
        var player = new Player(this);
        player.setPosition(cc.winSize.width / 2, -player.height / 2);
        this.addChild(player);
        player.setTag(1);
        // 产生敌机
        this.schedule(function(){
            this.createEnemy(1);
        },Global.createEnemySpeed(1));
        this.schedule(function(){
            this.createEnemy(2);
        },Global.createEnemySpeed(2));
        this.schedule(function(){
            this.createEnemy(3);
        },Global.createEnemySpeed(3));
        // 产生道具
        this.schedule(function(){
            this.createTool(1);
        },Global.createToolSpeed(1));
        this.schedule(function(){
            this.createTool(2);
        },Global.createToolSpeed(2));
        // 添加爆炸道具
        var bombNor = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("bomb.png"));
        var bombSelected = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("bomb.png"));
        bombSelected.setPosition(-bombSelected.width/4,-bombSelected.height/4);
        bombSelected.setScale(1.5);
        var bombBtn = new cc.MenuItemSprite(
            bombNor,
            bombSelected,
            function () {
                var bombNum = this.getChildByTag(3);
                if(parseInt(bombNum.getString().slice(1))==0){
                    return;
                }
                // 全屏爆炸
                var blowEnemy = [];
                for(var i in this.enemies){
                    var enemy = this.enemies[i];
                    blowEnemy.push(enemy);
                }
                for(var j in blowEnemy){
                    blowEnemy[j].blowUp();
                }
                // 数量减一
                bombNum.setString("X"+(parseInt(bombNum.getString().slice(1))-1));
            }, this);
        bombBtn.setPosition(50+bombBtn.width/2,50+bombBtn.height/2);
        var bombMenu = new cc.Menu(bombBtn);
        bombMenu.setPosition(0,0);
        bombMenu.setAnchorPoint(0,0);
        this.addChild(bombMenu);
        // 爆炸道具数量
        var bombNum = new cc.LabelBMFont("X2",res.font);
        bombNum.setAnchorPoint(0,0.5);
        bombNum.setPosition(bombBtn.getPositionX()+bombBtn.width/2+50,bombBtn.getPositionY());
        bombNum.setTag(3);
        this.addChild(bombNum);
        // 暂停开始按钮
        var pauseBtn = new cc.MenuItemSprite(
            new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("game_pause_nor.png")),
            new cc.Sprite(cc.spriteFrameCache.getSpriteFrame("game_pause_pressed.png")),
            function () {
                // 暂停音乐音效
                cc.audioEngine.pauseAllEffects();
                cc.audioEngine.pauseMusic();
                pauseBtn.setEnabled(false);
                cc.director.pause();
                this.addChild(new PauseLayer(pauseBtn),10);
            }, this);
        var pauseMenu = new cc.Menu(pauseBtn);
        pauseMenu.setPosition(20+pauseBtn.width/2,cc.winSize.height-pauseBtn.height/2-20);
        pauseMenu.setAnchorPoint(0,0);
        this.addChild(pauseMenu);
        // 分数
        var score = new cc.LabelBMFont("0",res.font);
        score.setAnchorPoint(0,0.5);
        score.setPosition(pauseMenu.getPositionX()+pauseBtn.width/2+50,pauseMenu.getPositionY());
        score.setTag(2);
        this.addChild(score);
        // 碰撞检测
        this.schedule(this.collision);
        return true;
    },
    collision:function(){
        var bullets = this.bullets;
        var enemies = this.enemies;
        var tools = this.tools;
        var score = parseInt(this.getChildByTag(2).getString());
        for(var i in enemies){
            var enemy = enemies[i];
            // 检测是否与玩家碰撞
            var player = this.getChildByTag(1);
            if(cc.rectIntersectsRect(enemy.getBoundingBox(),player.getBoundingBox())){
                // 游戏结束
                this.unschedule(this.collision);
                player.blowUp();
                // 停止背景音乐
                cc.audioEngine.stopMusic("res/sound/game_music.mp3");
                cc.audioEngine.playEffect("res/sound/game_over.mp3");
                this.scheduleOnce(function() {
                    cc.director.runScene(new cc.TransitionFade(1,new OverScene(score)));
                },2);
            }
            // 检测是否吃到道具
            for(var m in tools){
                var tool = tools[m];
                if(cc.rectIntersectsRect(tool.getBoundingBox(),player.getBoundingBox())){
                    switch(tool.type){
                        case 1:
                            // 双排子弹道具
                            cc.audioEngine.playEffect("res/sound/get_double_laser.mp3");
                            player.shootDoubleBegin();
                            break;
                        case 2:
                            // 清屏道具
                            cc.audioEngine.playEffect("res/sound/get_bomb.mp3");
                            var bomb = this.getChildByTag(3);
                            bomb.setString("X"+(parseInt(bomb.getString().slice(1))+1));
                            bomb.runAction(cc.sequence(cc.scaleTo(0.1,1.2),cc.scaleTo(0.1,1)));
                            break;
                    }                  
                    tool.remove();
                }
            }
            for(var j in bullets){
                var bullet = bullets[j];
                // 检测是否与子弹碰撞
                if(cc.rectIntersectsRect(enemy.getBoundingBox(),bullet.getBoundingBox())){
                    enemy.hit();
                    bullet.remove();
                }
            }
        }
    },
    addScore:function(type){
        var score = this.getChildByTag(2);
        var addScore = 0;
        var curScore = parseInt(score.getString());
        switch(type){
            case 1:
                addScore = 100 + Math.ceil(Math.random()*(curScore/1000));
            break;
            case 2:
                addScore = 200 + Math.ceil(Math.random()*(curScore/1000));
            break;
            case 3:
                addScore = 500 + Math.ceil(Math.random()*(curScore/1000));
            break;
        }
        score.setString(curScore+addScore);
    },
    createEnemy:function(type){
        var enemy = new Enemy(type,this);
        var randomX = Math.random()*(cc.winSize.width-enemy.width/2-enemy.width/2)+enemy.width/2;
        enemy.setPosition(randomX,cc.winSize.height+enemy.height/2);
        this.addChild(enemy);
        this.enemies.push(enemy);
    },
    createTool:function(type){
        var tool = new Tool(type,this);
        var randomX = Math.random()*(cc.winSize.width-tool.width/2-tool.width/2)+tool.width/2;
        tool.setPosition(randomX,cc.winSize.height+tool.height/2);
        this.addChild(tool);
        this.tools.push(tool);
    },
    onEnter:function(){
        this._super();
        // 添加触摸事件
        cc.eventManager.addListener({
            event:cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches:true,
            onTouchBegan:this.touchbegan,
            onTouchMoved:this.touchmoved,
            onTouchEnded:this.touchended
        },this);
        return true;
    },
    touchbegan:function(touch,event){
        event.getCurrentTarget().touchStartX = touch.getLocation().x;
        event.getCurrentTarget().touchStartY = touch.getLocation().y;
        return true;
    },
    touchmoved:function(touch,event){
        var touchX = touch.getLocation().x;
        var touchY = touch.getLocation().y;
        var touchStartX = event.getCurrentTarget().touchStartX;
        var touchStartY = event.getCurrentTarget().touchStartY;
        var player = event.getCurrentTarget().getChildByTag(1);
        if(player!=null){
            player.moveBy(touchX-touchStartX,touchY-touchStartY);
            event.getCurrentTarget().touchStartX = touchX;
            event.getCurrentTarget().touchStartY = touchY;
        }
        return true;
    },
    touchended:function(touch,event){
        return true;
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
    }
});
```
#### 暂停场景
在游戏场景点击暂停按钮进入暂停场景，暂停场景实际上只是一个半透明的层盖在游戏场景上，进入暂停场景后游戏暂停，暂停场景包含继续按钮，结束按钮和重新开始按钮。
暂停场景效果图如下：
![暂停场景](http://7xnnwn.com1.z0.glb.clouddn.com/PauseMenu.gif)
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var PauseLayer=cc.LayerColor.extend({
    ctor:function (pauseBtn) {
        // 初始化为黑色
        this._super(cc.color(0,0,0,100));
        this.width = cc.winSize.width;
        this.height = cc.winSize.height;
        // 继续按钮
        var resumeBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/game_continue.png"),
            new cc.Sprite("res/game_continue_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.audioEngine.resumeMusic();
                cc.director.resume();
                pauseBtn.setEnabled(true);
                this.removeFromParent();
            }, this);
        resumeBtn.setPosition(0,100);
        // 结束游戏按钮
        var overBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/game_over.png"),
            new cc.Sprite("res/game_over_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.audioEngine.stopMusic("res/sound/game_music.mp3");
                cc.director.resume();
                cc.director.runScene(new cc.TransitionFade(1, new MenuScene()));
            }, this);
        overBtn.setPosition(0,0);
        // 重新开始按钮
        var reagainBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/game_Reagain.png"),
            new cc.Sprite("res/game_Reagain_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.audioEngine.stopMusic("res/sound/game_music.mp3");
                cc.director.resume();
                cc.director.runScene(new cc.TransitionFade(1, new GameScene()));
            }, this);
        reagainBtn.setPosition(0,-100);
        var menu = new cc.Menu(resumeBtn,overBtn,reagainBtn);
        this.addChild(menu);
        return true;
    }
});
```
#### 结束场景
在游戏场景中，如果在碰撞检测中检测到玩家与敌机碰撞，则游戏结束，游戏结束进入结束场景，结束场景包含玩家的最终分数，以及展示最高历史分数和保存最高历史分数。
结束场景的效果如下：
![结束场景](http://7xnnwn.com1.z0.glb.clouddn.com/OverScene.gif)
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var OverLayer=cc.Layer.extend({
    ctor:function (score) {
        this._super();
        var bg = new Background(true);
        bg.setPosition(cc.winSize.width/2,cc.winSize.height/2);
        this.addChild(bg);
        var highest = cc.sys.localStorage.getItem("highest");
        highest = highest==null?0:highest;
        // 分数存储
        if(parseInt(score)>parseInt(highest)){
            cc.sys.localStorage.setItem("highest" ,score);
            highest = score;
        }
        // 历史最高分数
        var highestFnt = new cc.LabelBMFont(highest.toString(),res.font);
        highestFnt.setPosition(250,cc.winSize.height-highestFnt.height/2-75);
        highestFnt.setAnchorPoint(0,0.5);
        this.addChild(highestFnt);
        // 分数显示
        var scoreFnt = new cc.LabelBMFont(score,res.font);
        scoreFnt.setPosition(cc.winSize.width/2,cc.winSize.height/2);
        this.addChild(scoreFnt);
        this.scheduleOnce(function(){
            cc.audioEngine.playEffect("res/sound/out_porp.mp3");
            scoreFnt.runAction(cc.sequence(cc.scaleTo(0.2,1.5),cc.scaleTo(0.2,1)));
        },1);
        // 菜单按钮
        var restartBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/btn_finish.png"),
            new cc.Sprite("res/btn_finish_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.director.runScene(new cc.TransitionFade(1, new MenuScene()));
            }, this);
        restartBtn.setPosition(scoreFnt.getPositionX(),scoreFnt.getPositionY()-scoreFnt.height/2-100);
        var menu = new cc.Menu(restartBtn);
        menu.setPosition(0,0);
        menu.setAnchorPoint(0,0);
        this.addChild(menu);
        return true;
    }
});

var OverScene=cc.Scene.extend({
    ctor:function(score){
        this._super();
        var layer=new OverLayer(score);
        this.addChild(layer);
    }
});
```
#### 帮助场景
帮助场景就是一个展示游戏帮助提示的场景，其实只有文字和返回游戏按钮。
帮助场景的效果如下：
![帮助场景](http://7xnnwn.com1.z0.glb.clouddn.com/HelpScene.gif)
代码如下：
```javascript
/**
 * Created by Henry on 16/7/6.
 */
var OverLayer=cc.Layer.extend({
    ctor:function (score) {
        this._super();
        var bg = new Background(true);
        bg.setPosition(cc.winSize.width/2,cc.winSize.height/2);
        this.addChild(bg);
        var highest = cc.sys.localStorage.getItem("highest");
        highest = highest==null?0:highest;
        // 分数存储
        if(parseInt(score)>parseInt(highest)){
            cc.sys.localStorage.setItem("highest" ,score);
            highest = score;
        }
        // 历史最高分数
        var highestFnt = new cc.LabelBMFont(highest.toString(),res.font);
        highestFnt.setPosition(250,cc.winSize.height-highestFnt.height/2-75);
        highestFnt.setAnchorPoint(0,0.5);
        this.addChild(highestFnt);
        // 分数显示
        var scoreFnt = new cc.LabelBMFont(score,res.font);
        scoreFnt.setPosition(cc.winSize.width/2,cc.winSize.height/2);
        this.addChild(scoreFnt);
        this.scheduleOnce(function(){
            cc.audioEngine.playEffect("res/sound/out_porp.mp3");
            scoreFnt.runAction(cc.sequence(cc.scaleTo(0.2,1.5),cc.scaleTo(0.2,1)));
        },1);
        // 菜单按钮
        var restartBtn = new cc.MenuItemSprite(
            new cc.Sprite("res/btn_finish.png"),
            new cc.Sprite("res/btn_finish_selected.png"),
            function () {
                cc.audioEngine.playEffect("res/sound/button.mp3");
                cc.director.runScene(new cc.TransitionFade(1, new MenuScene()));
            }, this);
        restartBtn.setPosition(scoreFnt.getPositionX(),scoreFnt.getPositionY()-scoreFnt.height/2-100);
        var menu = new cc.Menu(restartBtn);
        menu.setPosition(0,0);install
        menu.setAnchorPoint(0,0);
        this.addChild(menu);
        return true;
    }
});

var OverScene=cc.Scene.extend({
    ctor:function(score){
        this._super();
        var layer=new OverLayer(score);
        this.addChild(layer);
    }
});
```
### 运行效果
最后的运行效果如下
![打飞机效果图](http://7xnnwn.com1.z0.glb.clouddn.com/Plane.gif)
通过CVP平台的项目托管可看到实际运行效果，地址如下：
http://www.cocoscvp.com/usercode/3d1775ea3aea1f12e986b7d8ebbb079fca12c064/
### 源代码
所有源代码均上传到github，欢迎交流学习，地址：
https://github.com/hjcenry/plane

- 原文博客：http://hjcenry.github.io