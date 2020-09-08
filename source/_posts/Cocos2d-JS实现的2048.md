---
title: Cocos2d-JS实现的2048
date: 2016-06-19 22:29
categories: cocos2d-js
tags: [cocos2d-js,2048,cvp]
---
### 前言
2048是之前火过一段时间的休闲数字消除类游戏，它的玩法很简单，上手很容易，可是想到要得到高分却很难，看似简单的游戏却有着很多得分的技巧，想当初这个游戏也曾是陪伴我大学课堂的游戏之一。<!--more-->虽然在得分上有着很多的技巧，但对于开发来说，这其实是一件相当容易的事情，仔细分析之后就可能大概理清楚这种消除游戏的逻辑。
### 游戏分析
这款游戏仔细想想就差不多清楚它的大致的思路，游戏中只有方块这一个我们操作的对象，这个对象包含了所在行，所在列，以及方块显示的数字三个属性，这三个属性足以表达游戏中的所有效果。除了方块，其他的就是游戏中必不可少的背景图层，开始及结束场景等。由于游戏中需要将4x4的方块们整齐排列，因此还需要一个四行四列的表格，来呈现我们的游戏效果。
### 滑动逻辑
游戏中最主要的操作就是通过手指触摸屏幕进行滑屏操作，带动场景中的方块整体移动，并且遇到相同数字的方块进行合并。滑动的逻辑就是遍历场景中所有的方块，每一个方块在滑动方向进行移动，如果前方没有方块，方块就一直滑动，如果前方有方块，判断自己的数字与这个方块的数字是否相同，相同进行合并操作，不相同则停在当前位置。
### 游戏实现
在对游戏逻辑进行了分析之后，就可以用代码进行实现了，编码，其实就是一个将游戏逻辑转换为机器语言的过程而已。
#### 方块类
首先，我们需要一个类来存储方块的长度和宽度，代码如下：
```javascript
// 保存方块长度方块
var tile = {
    width: 0,
    height: 0
};
```
方块类是对场景中可操的方块的封装，包括所在行，所在列，显示数字三个属性，代码如下：
```javascript
var Tiled = cc.Node.extend({
    num: 0,
    col: 0,
    row: 0,
    ctor: function (num) {
        this._super();
        return true;
    }
}
```
当然仅仅有以上三个属性是不够的，我们还需要在方块的构造函数中绘制方块的背景、绘制方块显示的数字、以及随机设定方块的行列坐标。
```javascript
var Tiled = cc.Node.extend({
    num: 0,
    col: 0,
    row: 0,
    ctor: function (num) {
        this._super();
        this.num = num;
        var count = 0;
        while (true) {
            count++;
            this.row = Math.floor(Math.random() * 4);
            this.col = Math.floor(Math.random() * 4);
            if (tiles[this.row][this.col] == null) {
                tiles[this.row][this.col] = this;
                break;
            }
            if (count >= 16) {// 格子满了
                return true;
            }
        }
        // 绘制背景
        var bg = new cc.DrawNode();
        bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(255, 209, 145, 255), 1, cc.color(255, 209, 145, 255));
        this.addChild(bg);
        bg.setTag(2);
        // 绘制数字
        var labelNum = new cc.LabelTTF();
        labelNum.setString("" + this.num);
        labelNum.setFontSize(60);
        // 字体描边效果
        // labelNum.enableStroke(cc.color.BLACK, 0);
        this.addChild(labelNum);
        labelNum.setTag(1);
        // 设定字体和坐标
        labelNum.setPosition(tile.width / 2, tile.height / 2);
        // 移动块
        this.newTile(this.row, this.col);
        return true;
    }
}
```
除此之外，每个方块应该还要包含一个newTile方法、moveTo方法和updateNum方法，分别封装随机创建方块、移动方块和更新方块数字三个功能。
在updateNum方法中，我们主要做两件事，更新方块显示数字和更新方块背景颜色（在方块的背景色上，我还专门上网搜了几种颜色搭配，恩，感觉很有艺术美，哈哈），代码如下：
```javascript
updateNum: function () {
    this.getChildByTag(1).setString("" + this.num);
    var bg = this.getChildByTag(2);
    switch (this.num) {
        case 2:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(235, 245, 223, 255), 1, cc.color(235, 245, 223, 255));
            break;
        case 4:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(186, 212, 170, 255), 1, cc.color(186, 212, 170, 255));
            break;
        case 8:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(212, 212, 170, 255), 1, cc.color(212, 212, 170, 255));
            break;
        case 16:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(193, 160, 117, 255), 1, cc.color(193, 160, 117, 255));
            break;
        case 32:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(124, 99, 84, 255), 1, cc.color(124, 99, 84, 255));
            break;
        case 64:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(218, 227, 224, 255), 1, cc.color(218, 227, 224, 255));
            break;
        case 128:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(64, 125, 148, 255), 1, cc.color(64, 125, 148, 255));
            break;
        case 256:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(123, 118, 135, 255), 1, cc.color(123, 118, 135, 255));
            break;
        case 512:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(172, 173, 172, 255), 1, cc.color(172, 173, 172, 255));
            break;
        case 1024:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(204, 196, 194, 255), 1, cc.color(204, 196, 194, 255));
            break;
        case 2048:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(199, 225, 240, 255), 1, cc.color(199, 225, 240, 255));
            break;
        case 4096:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(150, 196, 230, 255), 1, cc.color(150, 196, 230, 255));
            break;
        case 8192:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(25, 77, 91, 255), 1, cc.color(25, 77, 91, 255));
            break;
        case 16384:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(229, 96, 205, 255), 1, cc.color(229, 96, 205, 255));
            break;
        case 32768:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(250, 174, 78, 255), 1, cc.color(250, 174, 78, 255));
            break;
        case 65536:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(255, 241, 222, 255), 1, cc.color(255, 241, 222, 255));
            break;
        default:
            bg.drawRect(cc.p(5, 5), cc.p(tile.width - 5, tile.height - 5), cc.color(255, 209, 145, 255), 1, cc.color(255, 209, 145, 255));
            break;
    }
}
```
方块的移动方法和创建方法，我在这里先写成一样，因为还没有对方块的创建和移动做区别，如果要做优化，可以在移动时加入移动的动画，在创建加入创建的动画，代码如下：
```javascript
moveTo: function (row, col) {
    this.row = row;
    this.col = col;
    this.setPositionX((cc.winSize.width - tile.width * 4) / 2 + tile.width * this.col);
    this.setPositionY((cc.winSize.height - tile.height * 4) / 2 + tile.height * this.row);
},
newTile: function (row, col) {
    this.row = row;
    this.col = col;
    this.setPositionX((cc.winSize.width - tile.width * 4) / 2 + tile.width * this.col);
    this.setPositionY((cc.winSize.height - tile.height * 4) / 2 + tile.height * this.row);
}
```
#### 游戏场景类
所有的游戏操作及操作反馈都在游戏场景类中进行，游戏场景类将封装好的方块类放到游戏逻辑中，通过玩家操作给予一定的操作反馈。游戏场景类中主要接受玩家的滑动操作，并在接收到滑动操作后将所有的方块类进行移动或合并。
游戏场景类中需要isMove，startX，startY，以及tiles四个属性：第一个是控制玩家触摸操作的标识变量，避免重复调用移动方法；中间两个为记录玩家手指滑动的距离，当距离查过一定的长度之后，才判断玩家进行了滑动操作；最后一个变量是一个数组，用于存储在4x4的表格中的方块的信息。
有了以上四个属性之后，就可以在构造函数中进行初始化了，代码如下：
```javascript
var tiles = null;// 存储方块信息
var GameLayer = cc.Layer.extend({
    isMove: false,
    startX: 0,
    startY: 0,
    ctor: function () {
        this._super();
        this.isMove = false;
        this.startX = 0;
        this.startY = 0;
        //设置块的宽高
        if (cc.winSize.width < cc.winSize.height) {
            // 竖屏
            tile.width = cc.winSize.width / 5;
            tile.height = cc.winSize.width / 5;
        } else {
            // 横屏
            tile.width = cc.winSize.height / 5;
            tile.height = cc.winSize.height / 5;
        }
        // 初始化数组
        tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ];
        return true;
    }
}
```
在初始化完之后，我们就可以在场景的onEnter方法中绘制场景了，绘制的内容包括游戏背景以及随机初始化两个方块，代码如下：
```javascript
onEnter: function () {
    this._super();
    // 绘制背景
    this.drawBg();
    // 绘制块
    var tile1 = new Tiled(2);
    var tile2 = new Tiled(2);
    this.addChild(tile1);
    this.addChild(tile2);
    //处理事件
    cc.eventManager.addListener({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: true,
        onTouchBegan: this.touchbegan,
        onTouchMoved: this.touchmoved
    }, this);
    return true;
}
```
其中drawBg方法中，绘制了五条垂直直线以及五条水平直线，来作为方块所在的4x4的表格，代码如下：
```javascript
drawBg: function () {
    //绘制背景
    var bgRect = new cc.DrawNode();
    bgRect.drawRect(cc.p(0, 0), cc.p(cc.winSize.width, cc.winSize.height), cc.color(173, 140, 61, 255), 1, cc.color(173, 140, 61, 255));
    this.addChild(bgRect);
    var bg = new cc.DrawNode();
    for (var n = 0; n < 5; n++) {
        bg.drawSegment(cc.p((cc.winSize.width - tile.width * 4) / 2, (cc.winSize.height - tile.height * 4) / 2 + n * tile.width), cc.p(cc.winSize.width / 2 + tile.width * 2, (cc.winSize.height - tile.height * 4) / 2 + n * tile.width), 5,
            cc.color(55, 62, 64, 255));
        bg.drawSegment(cc.p((cc.winSize.width - tile.width * 4) / 2 + n * tile.width, (cc.winSize.height - tile.height * 4) / 2), cc.p((cc.winSize.width - tile.width * 4) / 2 + n * tile.width, (cc.winSize.height - tile.height * 4) / 2 + tile.width * 4), 5,
            cc.color(55, 62, 64, 255));
    }
    this.addChild(bg);
}
```
可以看到，在onEnter中，注册了触摸事件，这个触摸事件就用于接受玩家的操作，在TouchBegan事件中记录触摸开始时的点，在TouchMoved中记录当前移动到的点，当触摸距离超过一定长度时，判定玩家进行了滑动操作，并通过触摸点来判断玩家滑动的举例，代码如下：
```javascript
touchbegan: function (touch, event) {
    this.isMove = true;
    this.startX = touch.getLocationX();
    this.startY = touch.getLocationY();
    return true;
},
touchmoved: function (touch, event) {
    if (!this.isMove) {
        return;
    }
    var endX = touch.getLocation().x;
    var endY = touch.getLocation().y;
    if (Math.abs(endX - this.startX) > 20 ||
        Math.abs(endY - this.startY) > 20) {
        var dir = "";
        if (Math.abs(endX - this.startX) > Math.abs(endY - this.startY)) {//左右
            if (endX > this.startX) {
                dir = "right";
            } else {
                dir = "left";
            }
        } else {
            //上下
            if (endY > this.startY) {
                dir = "up";
            } else {
                dir = "down";
            }
        }
        this.isMove = false;
        event.getCurrentTarget().moveAllTiled(dir);
    }
    return true;
},
moveAllTiled: function (dir) {
    var isMoved = false;
    switch (dir) {
        case "up":
            isMoved = this.moveUp();
            break;
        case "down":
            isMoved = this.moveDown();
            break;
        case "left":
            isMoved = this.moveLeft();
            break;
        case "right":
            isMoved = this.moveRight();
            break;
    }
    if (isMoved) {
        //每次移动产生一个新块
        this.newTiled();
    }
}
```
触动滑动操作后，开始执行滑动逻辑，每次滑动之后，会随机创建一个新的方块，在newTiled方法中，除了创建新方块之外，还需要判断游戏是否结束，代码如下：
```javascript
newTiled: function () {
    var tile = new Tiled(2);
    this.addChild(tile);
    // 判断游戏是否结束
    var isOver = true;
    // 判断是否有空余位置
    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            if (tiles[row][col] == null) {
                isOver = false;
            }
        }
    }
    if (isOver) {
        // 判断四周是否有数字相同方块
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 4; col++) {
                if (row < 3 && tiles[row + 1][col].num == tiles[row][col].num) {
                    isOver = false;
                }
                if (row > 0 && tiles[row - 1][col].num == tiles[row][col].num) {
                    isOver = false;
                }
                if (col < 3 && tiles[row][col + 1].num == tiles[row][col].num) {
                    isOver = false;
                }
                if (col > 0 && tiles[row][col - 1].num == tiles[row][col].num) {
                    isOver = false;
                }
            }
        }
    }
    if (isOver) {
        cc.director.runScene(new cc.TransitionFade(1, new OverScene()));
    }
}
```
方块的滑动，就是2048这款游戏最主要的逻辑了，我们在滑动的时候，需要遍历tiles数组所有不是null的元素，并将这个元素按照滑动方向进行移动，一直遍历到数组的最大长度，也就是将滑动到表格的边缘，如果中途遇到了方块，并且数字与自己相同，就进行合并，合并是将自己删除，将遇到的方块数字乘以2，如果中途遇到的方块的数字与自己不同，此方块的滑动就停止，使其停在当前的位置，滑动分为上下左右四个逻辑，代码分别如下：
```javascript
moveUp: function () {
    var isMoved = false;
    for (var col = 0; col < 4; col++) {
        for (var row = 3; row >= 0; row--) {
            if (tiles[row][col] != null) {// 有方块
                for (var row1 = row; row1 < 3; row1++) {
                    if (tiles[row1 + 1][col] == null)//如果没有向上移动
                    {
                        tiles[row1 + 1][col] = tiles[row1][col];
                        tiles[row1][col] = null;
                        tiles[row1 + 1][col].moveTo(row1 + 1, col);
                        isMoved = true;
                    } else if (tiles[row1 + 1][col].num == tiles[row1][col].num) {// 合并
                        tiles[row1 + 1][col].num = parseInt(tiles[row1][col].num) * 2;
                        tiles[row1 + 1][col].updateNum();
                        tiles[row1][col].removeFromParent();
                        tiles[row1][col] = null;
                        isMoved = true;
                        break;
                    }
                }
            }
        }
    }
    return isMoved;
},
moveDown: function () {
    var isMoved = false;
    for (var col = 0; col < 4; col++) {
        for (var row = 0; row < 4; row++) {
            if (tiles[row][col] != null) {// 有方块
                for (var row1 = row; row1 > 0; row1--) {
                    if (tiles[row1 - 1][col] == null)//如果没有向下移动
                    {
                        tiles[row1 - 1][col] = tiles[row1][col];
                        tiles[row1][col] = null;
                        tiles[row1 - 1][col].moveTo(row1 - 1, col);
                        isMoved = true;
                    } else if (tiles[row1 - 1][col].num == tiles[row1][col].num) {// 合并
                        tiles[row1 - 1][col].num = parseInt(tiles[row1][col].num) * 2;
                        tiles[row1 - 1][col].updateNum();
                        tiles[row1][col].removeFromParent();
                        tiles[row1][col] = null;
                        isMoved = true;
                        break;
                    }
                }
            }
        }
    }
    return isMoved;
},
moveLeft: function () {
    var isMoved = false;
    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            if (tiles[row][col] != null) {
                for (var col1 = col; col1 > 0; col1--) {
                    if (tiles[row][col1 - 1] == null) {
                        tiles[row][col1 - 1] = tiles[row][col1];
                        tiles[row][col1] = null;
                        tiles[row][col1 - 1].moveTo(row, col1 - 1);
                        isMoved = true;
                    } else if (tiles[row][col1 - 1].num == tiles[row][col1].num) {// 合并
                        tiles[row][col1 - 1].num = parseInt(tiles[row][col1].num) * 2;
                        tiles[row][col1 - 1].updateNum();
                        tiles[row][col1].removeFromParent();
                        tiles[row][col1] = null;
                        isMoved = true;
                        break;
                    }
                }
            }
        }
    }
    return isMoved;
},
moveRight: function () {
    var isMoved = false;
    for (var row = 0; row < 4; row++) {
        for (var col = 3; col >= 0; col--) {
            if (tiles[row][col] != null) {
                for (var col1 = col; col1 < 3; col1++) {
                    if (tiles[row][col1 + 1] == null) {
                        tiles[row][col1 + 1] = tiles[row][col1];
                        tiles[row][col1] = null;
                        tiles[row][col1 + 1].moveTo(row, col1 + 1);
                        isMoved = true;
                    } else if (tiles[row][col1 + 1].num == tiles[row][col1].num) {// 合并
                        tiles[row][col1 + 1].num = parseInt(tiles[row][col1].num) * 2;
                        tiles[row][col1 + 1].updateNum();
                        tiles[row][col1].removeFromParent();
                        tiles[row][col1] = null;
                        isMoved = true;
                        break;
                    }
                }
            }
        }
    }
    return isMoved;
}
```
至此，我们就基本实现了2048游戏的主要逻辑。
#### 开始/结束场景类
为了游戏框架的完整，我们还是创建一个开始场景类和结束场景类，代码分别如下：
开始场景类
```javascript
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;

        /////////////////////////////
        // 3. add your codes below...
        // add a label shows "Hello World"
        // create and initialize a label
        var helloLabel = new cc.LabelTTF("2048", "Arial", 38);
        // position the label on the center of the screen
        helloLabel.x = size.width / 2;
        helloLabel.y = size.height / 2 + 200;
        // add the label as a child to this layer
        this.addChild(helloLabel, 5);

        // add "HelloWorld" splash screen"
        // this.sprite = new cc.Sprite(res.HelloWorld_png);
        // this.sprite.attr({
        //     x: size.width / 2,
        //     y: size.height / 2
        // });
        // this.addChild(this.sprite, 0);

        var start = new cc.MenuItemFont("开始游戏",function(){
            cc.director.runScene(new cc.TransitionFade(1,new GameScene()));
        });
        var menu = new cc.Menu(start);
        this.addChild(menu);
        return true;
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});
```
结束场景类
```javascript
/**
 * Created by Henry on 16/6/19.
 */
var OverLayer = cc.Layer.extend({
    ctor: function () {
        this._super();
        var overText = new cc.LabelTTF("Game Over", "", 50);
        overText.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
        var back = new cc.MenuItemFont("再来一次", function () {
            cc.director.runScene(new cc.TransitionFade(1, new HelloWorldScene()));
        }, this);
        var menu = new cc.Menu(back);
        this.addChild(menu);
        return true;
    }
});

var OverScene = cc.Scene.extend({
    ctor: function () {
        this._super();
        var layer = new OverLayer();
        this.addChild(layer);
        return true;
    }
});
```
### 运行效果
最后的运行效果如下
![2048效果图](http://7xnnwn.com1.z0.glb.clouddn.com/2048.gif)
通过CVP平台的项目托管可看到实际运行效果，地址如下：
http://www.cocoscvp.com/usercode/ea72822aeed0546b537b4226954a11be87a7f152/
### 源代码
所有源代码均上传到github，欢迎交流学习，地址：
https://github.com/hjcenry/2048

- 原文博客：http://hjcenry.github.io