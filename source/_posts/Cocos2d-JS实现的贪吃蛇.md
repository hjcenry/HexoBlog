---
title: Cocos2d-JS实现的贪吃蛇
date: 2016-05-16 15:38
categories: cocos2d-js
tags: [cocos2d-js,贪吃蛇]
---
### 前言
相信贪吃蛇大家都玩儿过，我对贪吃蛇的印象就是在电子词典上，一只像素蛇在屏幕游走，饥渴难耐，看着豆子就要去吃，吃到豆子就会长一节，当蛇的身体越来越长的时候，它才发现这个世界变了，每走一步，都是寸步难行。<!--more-->当它的蛇头触碰到任意的物体，无论是屏幕边界还是自己的身体，游戏都将结束。这款游戏应该是比较经典的一个童年记忆。刚接触游戏开发的人可能比较喜欢以这款游戏入手，因为贪吃蛇包含了很多游戏开发中的原理，并且难度也不大，而我刚好在学习Cocos CVP的课程，学习在一个中间阶段，我也来拿这个练练手，以下就把我做贪吃蛇的过程分享出来。
### 游戏分析
#### 身体关节
贪吃蛇的实现可能有多种方法，但今天，我想用面向对象的思想来对游戏进行设计，到今天，任何的程序开发都离不开面向对象的思想，通过面向对象的思想我们能把很多抽象的问题具象化，方便我们解决很多问题。而在贪吃蛇中，面向对象的思想依然实用。
在贪吃蛇中，我们可以把一条游走的蛇的每个关节当做是一个对象，而蛇本身是由多个关节组成的整体，当每个关节在移动时，我们就能看到整个蛇的移动，每个关节的位置以及移动方向都跟它的上一个关节息息相关，那么我们就可以把关节与它的上一个关节关联起来，实现如下结构：
![蛇关节关系图](http://7xnnwn.com1.z0.glb.clouddn.com/snake1.png)
#### 移动方向
如上文所说，按照上面的关节关系来实现，那么蛇的移动方向就是与父节点的移动方向相关联，每一个关节应该有一个当前移动方向和下次移动方向，每一步的移动，都是跟着当前移动方向走的，而父关节的当前移动的方向即为子关节的下次移动方向，这样，只需要调整蛇头关节的下次移动方向，整条蛇就能顺着各自的父关节方向移动，蛇的移动方向图如下：
![蛇的移动方向图](http://7xnnwn.com1.z0.glb.clouddn.com/snakemove.png)
### 开发设计
#### 项目结构
按照前面的设计，我们可以大致可以划分出游戏场景类和关节类，进入游戏场景类，再将一些全局的变量单独存在一个类中，项目结构可划分如下图：
![项目结构图](http://7xnnwn.com1.z0.glb.clouddn.com/snake%E7%BB%93%E6%9E%84%E5%9B%BE.png)
#### 全局变量类
游戏中的全局变量，提炼为一个全局变量类，其中参数可以根据需求灵活变动配置
```javascript
var Constants = {
    frequency: 0.2,// 刷新频率
    speed: 31,// 每帧移动距离,身体节点大小+1像素间隔
    errDistance: 10,// 偏差举例
}
```
#### 关节类
按照以上设计的结构，每一个关节对象都应该包含蛇的当前方向、下次方向和蛇的父节点三个属性，代码如下：
```javascript
var SnakeBody = cc.Sprite.extend({
    frontBody: null,//上一个身体关节,没有则为头部
    nextDirection: 0,// 1-上,2-下,3-左,4-右
    direction: 0,// 1-上,2-下,3-左,4-右
    ctor: function (frontBody, direction) {
        this._super();
        this.frontBody = frontBody;
        this.direction = direction;
        this.nextDirection = direction;
        return true;
    }
}
```
上面说的，关节的位置跟它的福关节的位置是息息相关的，那么初始化的时候，我们就需要根据父关节的移动方向来进行次关节的位置设置，这部分代码，我们可以放在onEnter方法中，代码如下：
```javascript
onEnter: function () {
  this._super();
  if (this.frontBody == null) {
      // 蛇头部关节,设置头部纹理
      switch (this.direction) {
          case 1:
              this.setTexture(res.head_up);
              break;
          case 2:
              this.setTexture(res.head_down);
              break;
          case 3:
              this.setTexture(res.head_left);
              break;
          case 4:
              this.setTexture(res.head_right);
              break;
      }
  } else {
      // 蛇身体关节
      // 设置纹理
      this.setTexture(res.body);
      // 设置关节位置
      var frontX = this.frontBody.getPositionX();
      var frontY = this.frontBody.getPositionY();
      var frontWidth = this.frontBody.width;
      var frontHeight = this.frontBody.height;
      var width = this.width;
      var height = this.height;
      switch (this.frontBody.direction) {
          // 根据父关节的当前移动方向,决定此关节的位置
          case 1:// 上
              this.setPosition(frontX, frontY - frontHeight / 2 - height / 2 - 1);
              break;
          case 2:// 下
              this.setPosition(frontX, frontY + frontHeight / 2 + height / 2 + 1);
              break;
          case 3:// 左
              this.setPosition(frontX + frontWidth / 2 + width / 2 + 1, frontY);
              break;
          case 4:// 右
              this.setPosition(frontX - frontWidth / 2 - width / 2 - 1, frontY);
              break;
      }
  }
  return true;
}
```
有了这三个属性，每一个节点还应该有最重要的游戏逻辑——move方法，每一个关节分别调用move方法，从游戏场景中就能看到整条蛇按照预定方向进行移动，而整条蛇的运动方向就是跟着头部关节的方向走，头部关节的方向则通过点击屏幕区域控制。
在move方法中，我们需要做以下事情：
```
1.按照关节的下次移动方向移动本身长度的像素的距离
2.如果是头部关节，需要改变关节纹理
```
同时，如果是头部关节，我们还需要判断以下三个临界条件：
```
1.头部关节是否触碰到屏幕边界
2.头部关节是否吃到屏幕中的豆子
3.头部关节是否触碰到自身关节
```
其中1、3条件达成，则判定游戏结束，2条件达成，则能增加游戏分数，并且游戏继续。
move方法代码如下：
```javascript
// 关节移动方法
move: function (layer) {
    var star = layer.star;
    var direct;
    if (this.frontBody == null) {
        // 头部关节按照自身的下次方向行走
        direct = this.nextDirection;
    } else {
        // 身体关节按照父关节的当前方向行走,并将福关节的当前方向设置为自身的下次方向
        this.nextDirection = direct = this.frontBody.direction;
    }
    switch (direct) {
        case 1:// 上
            this.setPosition(this.getPositionX(), this.getPositionY() + Constants.speed);
            // this.runAction(cc.moveBy(Constants.frequency, cc.p(0, Constants.speed), 0))
            break;
        case 2:// 下
            this.setPosition(this.getPositionX(), this.getPositionY() - Constants.speed);
            // this.runAction(cc.moveBy(Constants.frequency, cc.p(0, -Constants.speed), 0))
            break;
        case 3:// 左
            this.setPosition(this.getPositionX() - Constants.speed, this.getPositionY());
            // this.runAction(cc.moveBy(Constants.frequency, cc.p(-Constants.speed, 0), 0))
            break;
        case 4:// 右
            this.setPosition(this.getPositionX() + Constants.speed, this.getPositionY());
            // this.runAction(cc.moveBy(Constants.frequency, cc.p(Constants.speed, 0), 0))
            break;
    }
    if (this.frontBody == null) {
        switch (this.nextDirection) {
            // 头部关节需要设置头部不同方向的纹理
            case 1:// 上
                this.setTexture(res.head_up);
                break;
            case 2:// 下
                this.setTexture(res.head_down);
                break;
            case 3:// 左
                this.setTexture(res.head_left);
                break;
            case 4:// 右
                this.setTexture(res.head_right);
                break;
        }
        // 头部关节判断是否触碰到边界
        var size = cc.winSize;
        if ((this.getPositionX() > size.width - this.width / 2)
            || (this.getPositionX() < this.width / 2)
            || (this.getPositionY() > size.height - this.height / 2)
            || (this.getPositionY() < this.height / 2)) {
            // 判断触碰边界
            cc.log("game over");
            return false;
        }
        // 判断是否触碰到自己身体关节
        for (var index in layer.bodys) {
            if (layer.bodys[index] != this && cc.rectIntersectsRect(this.getBoundingBox(), layer.bodys[index].getBoundingBox())) {
                return false;
            }
        }
        // 判断是否吃到星星
        if (star != null) {
            if (cc.rectIntersectsRect(this.getBoundingBox(), star.getBoundingBox())) {
                star.runAction(
                    cc.sequence(cc.spawn(
                        cc.scaleTo(0.2, 3),
                        cc.fadeOut(0.2)
                    ), cc.callFunc(function (star) {
                        star.removeFromParent();
                    }, star))
                );
                // 清除星星
                layer.star = null;
                // 添加身体
                layer.canNewBody = 1;
                // 改变分数
                layer.score.setString("" + (Number(layer.score.getString()) + Math.round(Math.random() * 3 + 1)));
                layer.score.runAction(cc.sequence(cc.scaleTo(0.1, 2), cc.scaleTo(0.1, 0.5), cc.scaleTo(0.1, 1)));
            }
        }
    }
    return true;
}
```
#### 游戏场景类
在游戏场景中我们需要以下几个变量：
```
1. 贪吃蛇数组：用于存储贪吃蛇所有的关节节点
2. 贪吃蛇尾部：每添加一个关节节点 ，都将此变量指向这个新加的节点，以便下次继续再尾部节点添加
3. 吃的星星：屏幕中随机产生的星星，用于判断头部关节是否与它产生碰撞
4. 是否添加节点：如果在定时任务中判断到吃到星星，那么可以次变量为1，代表可以添加一个节点
5. 分数：存储游戏中累加的分数
```
在cc.Layer的构造函数中对以上变量进行初始化，代码如下：
```javascript
var GameLayer = cc.Layer.extend({
  bodys: [],// snake body
  tail: null,// snake tail
  star: null,// star
  canNewBody: 0,// 0-无,1-有
  score: null,// 分数Label
  ctor: function () {
      // 初始化全局参数
      this._super();
      this.bodys = [];
      this.canNewBody = 0;
      this.star = null;
      this.tail = null;
      this.score = null;
      return true;
  }
}
```
之后，我们首先需要在场景中绘制出一条蛇，初始化定义为1个头部关节，5个身体关节，由于我们对关节类做了很好的封装，所以初始化一条蛇的代码很简单，我们在onEnter方法中进行初始化，如下所示：
```javascript
// 初始化一条蛇
// 初始化头部
var head = new SnakeBody(null, 4);
head.setPosition(300, 300);
this.addChild(head);
this.bodys.push(head);
head.setTag(1);
this.tail = head;
// 循环添加5个身体
for (var i = 0; i < 5; i++) {
    var node = new SnakeBody(this.tail, this.tail.direction);
    this.addChild(node);
    this.bodys.push(node);
    this.tail = node;
}
```
初始化完了之后蛇是不会动的，如何让它动起来呢，我们就要用到在关节类中封装的move方法了，我们每隔一个时间，对所有的关节类执行一次move方法，就能实现蛇的移动，首先在onEnter中添加定时任务：
```javascript
// 蛇移动的定时任务
this.schedule(this.snakeMove, Constants.frequency);
```
在这个snakeMove定时调用的方法中，我们要写出所有关节移动的逻辑，在这个方法中，我们需要完成以下几件事：
```
1. 遍历蛇的所有关节，每个关节执行一遍move方法，并在move完了之后，将下次移动方法变为本次移动方向
2. 如果需要新增关节，在遍历完成之后，新增一个关节类，并将其父节点指向之前的蛇尾节点，并把蛇尾指向新加的这个关节
```
代码如下：
```javascript
// 蛇关节移动方法
snakeMove: function () {
    for (var index in this.bodys) {
        // 循环执行移动方法,并返回移动结果,false即视为游戏结束
        if (!this.bodys[index].move(this)) {
            // 执行移动方法,移动失败,游戏结束
            this.unschedule(this.snakeMove);
            this.unschedule(this.updateStar);
            var overScene = new OverScene(Number(this.score.getString()), false);
            cc.director.runScene(new cc.TransitionFade(1, overScene));
        }
    }
    for (var index in this.bodys) {
        // 本轮所有关节移动结束,所有节点的当前方向赋值为下一次的方向
        this.bodys[index].direction = this.bodys[index].nextDirection;
    }
    if (this.canNewBody == 1) {
        // 如果新增关节为1,增加关节
        var node = new SnakeBody(this.tail, this.tail.direction);
        this.addChild(node);
        this.bodys.push(node);
        this.tail = node;
        this.canNewBody = 0;
    }
}
```
目前为止这条蛇是只会按照我们初始化的方向一直走到碰壁，然后游戏结束的，如何改变蛇的运动轨迹呢？前面说到了，蛇头部节点的下次移动方向的改变，即可对整个蛇的移动轨迹进行改变，这里我们可以通过点击屏幕实现蛇头的下次移动方向的改变。
首先在onEnter方法中添加触摸事件监听：
```javascript
// 添加屏幕触摸事件
cc.eventManager.addListener({
    event: cc.EventListener.TOUCH_ONE_BY_ONE,
    swallowTouches: true,
    onTouchBegan: this.touchbegan,
    onTouchMoved: this.touchmoved,
    onTouchEnded: this.touchended
}, this);
```
然后在onTouchBegan方法中实现点击事件，我们可以允许点击有一个10像素的误差：
```javascript
// 点击转向
touchbegan: function (touch, event) {
    var x = touch.getLocation().x;
    var y = touch.getLocation().y;
    var head = event.getCurrentTarget().getChildByTag(1);
    var headX = head.getPositionX();
    var headY = head.getPositionY();
    switch (head.direction) {
        case 1:// 上
        case 2:// 下
            if (x <= headX - Constants.errDistance) {// 转左
                head.nextDirection = 3;
            } else if (x >= headX + Constants.errDistance) {// 转右
                head.nextDirection = 4;
            }
            break;
        case 3:// 左
        case 4:// 右
            if (y <= headY - Constants.errDistance) {// 转下
                head.nextDirection = 2;
            } else if (y >= headY + Constants.errDistance) {// 转上
                head.nextDirection = 1;
            }
            break;
    }
    return true;
}
```
最后我们只差最后一步，就是蛇要吃的星星，我们可以在屏幕中任意位置随机产生一颗星星（又或者叫豆子，这都无所谓），只要这个星星满足以下条件，那么它就可以被绘制出来，否则我们需要重新随机这个星星的位置：
```
1. 星星在游戏场景的屏幕范围内
2. 星星不能与蛇的身体部分重叠
```
代码如下：
```javascript
// 更新星星
updateStar: function () {
    if (this.star == null) {
        this.star = new cc.Sprite(res.bean);
        var randomX = Math.random() * (cc.winSize.width - this.star.width) + this.star.width;
        var randomY = Math.random() * (cc.winSize.height - this.star.width) + this.star.height;
        this.star.setPosition(randomX, randomY);
        this.addChild(this.star);
        // 产生的星星只要在屏幕外,或与蛇的身体部分重叠,则本次任务不产生
        if ((randomX > cc.winSize.width - this.star.width / 2)
            || (randomX < this.star.width / 2)
            || (randomY > cc.winSize.height - this.star.height / 2)
            || (randomY < this.star.height / 2)) {
            cc.log("update star:out of screen");
            this.removeChild(this.star);
            this.star = null;
            return;
        }
        for (var index in this.bodys) {
            if (cc.rectIntersectsRect(this.bodys[index].getBoundingBox(), this.star.getBoundingBox())) {
                cc.log("update star:intersect with self");
                this.removeChild(this.star);
                this.star = null;
                return;
            }
        }
    }
}
```
至此，游戏的主要逻辑就大功告成了！贪吃蛇不仅能在屏幕中游走，还能吃星星，并且碰到自身或边缘都会GameOver！
#### 开始/结束场景类
说到GameOver，那么就必须要有一个Over的场景类了，毕竟有了开始场景，游戏场景和结束场景，才算得上一个完成的游戏流程嘛，结束场景类的实现很简单，只需要把游戏场景中获得的分数传递进来，然后在Label中展示即可，代码如下：
```javascript
var OverLayer = cc.Layer.extend({
    sprite: null,
    score: 0,
    ctor: function (score) {
        this._super();
        this.score = score;
        return true;
    },
    onEnter: function () {
        this._super();
        var size = cc.winSize;
        var over = new cc.LabelTTF("Game Over,你的分数是:" + this.score, "Arial", 38);
        over.setPosition(size.width / 2, size.height / 2);
        this.addChild(over);
        over.runAction(cc.sequence(cc.scaleTo(0.2, 2), cc.scaleTo(0.2, 0.5), cc.scaleTo(0.2, 1)));
        var start = new cc.MenuItemFont("再来一次", function () {
            cc.director.runScene(new cc.TransitionFade(1, new HelloWorldScene()));
        }, this);
        start.setPosition(over.getPositionX(), over.getPositionY() - over.height / 2 - 50);
        var menu = new cc.Menu(start);
        this.addChild(menu);
        menu.setPosition(0, 0);
        return true;
    }
});

var OverScene = cc.Scene.extend({
    score: 0,
    ctor: function (score) {
        this._super();
        this.score = score;
        return true;
    },
    onEnter: function () {
        this._super();
        var layer = new OverLayer(this.score);
        this.addChild(layer);
    }
});
```
与结束场景一样，开始场景也只需一个Label一个Menu即可，代码如下：
```javascript
var HelloWorldLayer = cc.Layer.extend({
    sprite: null,
    ctor: function () {
        this._super();
        var size = cc.winSize;
        var helloLabel = new cc.LabelTTF("贪吃蛇", "Arial", 38);
        helloLabel.x = size.width / 2;
        helloLabel.y = size.height / 2 + 200;
        this.addChild(helloLabel, 5);
        var start = new cc.MenuItemFont("开始游戏", function () {
            cc.director.runScene(new cc.TransitionFade(1, new GameScene()));
        }, this);
        var menu = new cc.Menu(start);
        this.addChild(menu);
        return true;
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});
```
这样，我们就能形成一个完成游戏流程了，游戏加载进入游戏开始场景，点击开始游戏进行如主游戏场景，游戏结束后进入结束场景，结束场景点击“再来一次”又可以回到开始场景。
### 运行效果
最后的运行效果如下
![贪吃蛇效果图](http://7xnnwn.com1.z0.glb.clouddn.com/snake.gif)
通过CVP平台的项目托管可看到实际运行效果，地址如下：
http://www.cocoscvp.com/usercode/2e17b3cd9586a574140e0bb765bad21673fc7686/
### 源代码
所有源代码均上传到github，欢迎交流学习，地址：
https://github.com/hjcenry/snake