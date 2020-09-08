---
title: Cocos Creator实现的《点我+1》
date: 2016-07-02 17:14
categories: cocos2d-js
tags: [cocos2d-js,点我+1,cvp]
---
### 前言
在学习Cocos中，需要一些东西来练手，于是前段时间就开发仿照一款公司之前的产品《点我+1》来做，仿照过程中，所有的算法逻辑都是自己研究的，并没有参考公司代码，也没有使用公司的美术资源，所以也就不存在公司机密的内容啦，完全只是学习练习而已。<!--more-->
这是一款消除类游戏，规则和大多数三消类游戏差不多，在一个5x5的格子中，有25个方块，每个方块有一个数字，用户的操作就是点击方块，使方块的数字+1，当至少每3个相同数字的时候，这些数字相同的方块合成为一个，并且数字+1，在玩家的表现就是：除了点击的方块之外，其他的相同数字的方块全部消失，然后点击的方块再+1。这款游戏看似很简单，但实际也是蕴含很多细节以及算法，我也是用了一周时间断断续续才做出来。
并且在这次练习中，我也是第一次尝试使用Cocos Creator来做，使用中也是遇到了不少问题，它与Cocos2d-JS的原生API还是有一定的差别的，Cocos Creator在我看来就是Cocos在向Unity靠近的一个产物，想要像Unity那样实现一整套的工作流，将游戏中的所有元素都组件化，游戏场景可以通过拖动就能搭建，游戏逻辑的实现只需要对组件添加相应的脚本即可，让游戏开发更加的方便，更加直观可视化。
### Cocos Creator
Cocos Creator是Cocos家族又一个划时代意义的产物，前面已经提到，我个人认为这是Cocos向Unity靠近的产物，或许也可以说，游戏开发的脚本化、组件化、以及高效工作流、高度可扩展，已经成为任何一款游戏引擎的发展方向，这样的高效快速的开发的工具，才是开发者的首选工具。了解Cocos家族历史的人应该都知道，Cocos从各种语言版本，到2dx跨平台版本，到Cocos Stuio、Cocos IDE、Cocos Builder，再到Cocos Creator，这一切都是在使开发者越来越方便，使得游戏开发的门槛越来越低，任何人，只要你有心，有游戏梦，你都可以通过自身的努力来造梦，而Cocos Creator，就是我们造梦的工具。
不过说实话，Cocos Creator目前是1.1版本，在使用仍然还有许多bug，比如我打包Web版本之后，直接在本地无法运行，查看控制台输出应该是跨域的问题，而发布到服务器就能正常运行，再比如游戏的开发者，开发者还是需要考虑很多各种型号手机屏幕兼容的问题，希望Cocos Creator还能有一套成熟的兼容适配的方案，还有一些我个人的问题或许只是我还不熟悉Cocos的组件化开发而已，需要等到我真正熟悉这款工具，才能用好它，所谓工欲善其事必先利其器，工具用好了，你的造梦之路才会更加顺畅！
Cocos Creator的用户手册：http://www.cocos.com/docs/creator/index.html
Cocos Creator的API：http://www.cocos.com/docs/creator/api/index.html
### 游戏分析
这款游戏是比较常见的三消类游戏，不过它也有着自己的特色，将数字类游戏玩法与消除类游戏玩法相结合，游戏过程也比较具有挑战性，让人产生挑战的欲望，游戏的玩法在上文已有描述，没有玩过这款消除类游戏的朋友可以通过以下地址进行下载：
安卓版地址：http://app.mi.com/detail/231892?ref=search
iOS版地址：https://itunes.apple.com/cn/app/dian-wo+1/id1012314214?mt=8
没玩过的朋友可以通过以上地址下载下来玩一下，体验下游戏玩法，然后仔细分析其中的游戏逻辑运算过程。
通过游戏玩法的分析我们至少可以分析出以下几点：
1.点击游戏方块，方块数字+1
2.在至少3个相同数字的方块彼此相邻时，可以合成一个+1的数
3.生成5x5的地图时，最多只能有两个相同数字方块相邻
4.每完成一次方块合成之后，所有方块向下填补空缺的位置
5.在填补完空缺位置之后，再生成新的方块
在Cocos Creator中，我们要熟悉组件化开发，因此我们需要开始场景、游戏场景、结束场景、以及方块预制资源、能量条预制资源，以及各种脚本和音效等。分别用scene、script和voice三个文件夹来存放场景组件，脚本组件和音效组件，另外将预制资源放在根目录下，如下图资源目录：
![资源结构图](http://7xnnwn.com1.z0.glb.clouddn.com/projstruct.png)
### 游戏实现
如之前一篇文章对2048游戏的分析一样，我们首先需要一个数组来存放所有的方块，并将方块单独提出来为一个对象，在这里，我们将方块做成预制资源，在需要的时候直接创建方块预制资源，同样，能量条也可以做成预制资源。另外我们需要开始场景、游戏场景和结束场景三个场景，并对这三个场景组件编写脚本。
在开发写代码之前，我们经过如上的分析，知道了我们大致要实现的几个核心算法：
1.扫描某一个位置的上下左右四个方向所有相邻的相同数字的点，并得到这些点的个数
2.所有方块向下移动，填补所有的空缺
核心的就这两个算法，其他的都是一些简单的逻辑，下面先对这两个算法进行分析
#### 扫描算法
扫描算法实质上就是对指定的点得四周进行扫描，扫描是否有数字相同的点，如果有数字相同的点，那么还需要进一步对这个数字相同的点再进行扫描，直到扫描的点四周都没有数字相同的点，才能确认最终相邻点的个数，实际上就是对指定的点向四周扩散扫描。
我的实现方式是这样的，写一个函数，传入两个数组，一个用来记录扫描到的数字相同的点，一个用来记录扫描过得点，以便于下次扫描不再扫描已经扫描过的点，除此之外，还需要传入行，列，上次扫描的行，上次扫描的列（在下次扫描时，不用再对上次的那个方向进行扫描），以及扫描要比对的数字。通过指定的点，我向上、下、左、右四个方向进行扫描，如果数字相同，我就将这个点加入到记录数字相同的点得数组中，并对这个点再递归调用这个函数，在四个方向全都递归扫描完毕后，我得到的这个扫描过的点的数组，就是所有与指定点的数字相同且彼此相邻的点的集合。可能我描述不是太清楚，我直接将代码贴出来，我的算法基础不是太好，可能这不是最优的算法，希望有朋友能为我提供更好更快的算法。
```javascript
/*
 * 核心扫描逻辑
 * @param row 指定行
 * @param col 指定列
 * @param lastRow 上次扫描的行
 * @param lastCol 上次扫描的列
 * @param num 扫描要比对的数字
 * @param arr 记录数字相同且彼此相邻的数组
 * @param scanArr 记录扫描过的点的数组
 */
scanAround:function(row,col,lastRow,lastCol,num,arr,scanArr){
    // cc.log("row:",row,",col:",col,",lastRow:",lastRow,",lastCol:",lastCol,",num:",num,",arr:",arr,",scanArr:",scanArr);
    if(this.tiles[row][col]==null){
        return;
    }
    var isClear = false;
    if(scanArr==undefined){
        scanArr = new Array();
    }
    // 扫描过的节点不再扫描
    if(scanArr.indexOf(row+"#"+col)==-1){
        scanArr.push(row+"#"+col);
    }else{
        return;
    }
    // 扫描上
    if(row<4&&(lastRow!=(row+1)||lastCol!=col)&&this.tiles[row+1][col]!=null){
        var nextNum = parseInt(this.tiles[row+1][col].getComponent("Tile").numLabel.string);
        if(nextNum==num){
            if(arr.indexOf(row+"#"+col)==-1){
                arr.push(row+"#"+col);
            }
            this.scanAround(row+1,col,row,col,num,arr,scanArr);
            isClear = true;
        }
    }
    // 扫描下
    if(row>0&&(lastRow!=(row-1)||lastCol!=col)&&this.tiles[row-1][col]!=null){
        var nextNum = parseInt(this.tiles[row-1][col].getComponent("Tile").numLabel.string);
        if(nextNum==num){
            if(arr.indexOf(row+"#"+col)==-1){
                arr.push(row+"#"+col);
            }
            this.scanAround(row-1,col,row,col,num,arr,scanArr);
            isClear = true;
        }
    }
    // 扫描左
    if(col>0&&(lastRow!=row||lastCol!=(col-1))&&this.tiles[row][col-1]!=null){
        var nextNum = parseInt(this.tiles[row][col-1].getComponent("Tile").numLabel.string);
        if(nextNum==num){
            if(arr.indexOf(row+"#"+col)==-1){
                arr.push(row+"#"+col);
            }
            this.scanAround(row,col-1,row,col,num,arr,scanArr);
            isClear = true;
        }
    }
    // 扫描右
    if(col<4&&(lastRow!=row||lastCol!=(col+1))&&this.tiles[row][col+1]!=null){
        var nextNum = parseInt(this.tiles[row][col+1].getComponent("Tile").numLabel.string);
        if(nextNum==num){
            if(arr.indexOf(row+"#"+col)==-1){
                arr.push(row+"#"+col);
            }
            this.scanAround(row,col+1,row,col,num,arr,scanArr);
            isClear = true;
        }
    }
    // 四周都不通，但不是出发遍历点，并且数字相同，也加入到数组
    if(!isClear&&(lastRow!=-1&&lastCol!=-1)){
        var curNum = parseInt(this.tiles[row][col].getComponent("Tile").numLabel.string)
        if(curNum==num){
            if(arr.indexOf(row+"#"+col)==-1){
                arr.push(row+"#"+col);
            }
        }
    }
}
```
#### 移动算法
移动算法相对就比较简单了，我只需要对每一列从下往上遍历，当遍历中发现方块不为null时（即这个点有方块），我们就以这个方块为起点，对这一列往下遍历，在子循环中，如果下方为null时（即下方没有方块），这个方块就向下移动一个单位，一直循环到下方见底，或者下方遇到方块，才会停止。这个算法相对简单，代码如下：
```javascript
for (var col = 0; col < 5; col++) {
    for (var row = 0; row < 5; row++) {
        if (this.tiles[row][col] != null) {// 有方块
            for (var row1 = row; row1 > 0; row1--) {
                if (this.tiles[row1 - 1][col] == null){
                    //如果没有向下移动
                    this.tiles[row1 - 1][col] = this.tiles[row1][col];
                    this.tiles[row1][col] = null;
                    this.tiles[row1 - 1][col].getComponent("Tile").moveTo(row1 - 1, col);
                }
            }
        }
    }
}
```
#### 方块类
方块类我们通过Creator的预制资源来制作，如下图所示：
![tile图](http://7xnnwn.com1.z0.glb.clouddn.com/tile.png)
在Tile预制资源中，我们只需要一个背景层，和一个显示数字的Label即可，其背景层的颜色和数字显示都通过脚本来控制，方块需要包含以下几个方法：
1.产生新方块的初始化及特效
2.移动到指定点的逻辑及特效
3.方块销毁的逻辑及特效
4.设置方块数字以及动态改变其背景色
5.在方块的初始化onLoad函数中，需要对方块添加TOUCH_START事件，事件中绑定上面提到的4方法，方块类的具体实现代码如下：
1.方块初始化函数
添加触摸点击事件，绑定设置数字函数，清空combo次数（combo次数记录放在全局组件Global中）
```javascript
onLoad: function () {
    var self = this;
    this.node.on(cc.Node.EventType.TOUCH_START,function(event){
        if(!self.game.isCal){
            cc.audioEngine.playEffect(self.clickEffect);
            self.game.isCal = true;
            // 连击次数归零
            Global.combo = 0;
            cc.audioEngine.playEffect(this.addCoin);
            self.setNum(parseInt(self.numLabel.string)+1,true,false);
        }
    }, this.node);
}
```
2.产生新方块
执行从小变大的动画，设置数组中的行列到属性中
```javascript
newTile:function(row,col){
    this.node.setPosition(5+(5+this.node.width)*col+this.node.width/2,5+(5+this.node.height)*row+this.node.height/2);
    this.node.setScale(0);
    this.node.runAction(cc.scaleTo(0.1,1));
    this.setArrPosition(row,col);
}
```
3.移动到指定点
执行移动动画，设置数组中行列到属性中
```javascript
moveTo:function(row,col){
    this.row = row;
    this.col = col;
    this.node.stopActionByTag(1);
    var action = cc.moveTo(0.2,cc.p(5+(5+this.node.width)*col+this.node.width/2,5+(5+this.node.height)*row+this.node.height/2));
    this.node.runAction(action);
    action.setTag(1);
}
```
4.方块销毁
执行从大变小的动画，执行完动画之后调用destory方法销毁方块
```javascript
destoryTile:function(){
    var action = cc.sequence(cc.scaleTo(0.1,0),cc.callFunc(function(node){
        node.destroy();
    },this.node,this.node));
    this.node.runAction(action);
}
```
5.设置方块数字
设置方块的显示数字，并动态改变相应数字对应的颜色，颜色存在全局组件变量Colors中，通过参数exeLogic判断是否需要执行游戏的消除逻辑，通过playEffect判断是否需要播放音效
```javascript
setNum:function(num,exeLogic,playEffect){
    this.game.maxNum = num>this.game.maxNum?num:this.game.maxNum;
    this.numLabel.string = num;
    switch(num){
        case 1:
            this.node.color = Colors.num1;
            break;
        case 2:
            this.node.color = Colors.num2;
            break;
        case 3:
            this.node.color = Colors.num3;
            break;  
        case 4:
            this.node.color = Colors.num4;
            break;
        case 5:
            this.node.color = Colors.num5;
            break;
        case 6:
            this.node.color = Colors.num6;
            break;  
        case 7:
            this.node.color = Colors.num7;
            break;
        case 8:
            this.node.color = Colors.num8;
            break;
        case 9:
            this.node.color = Colors.num9;
            break;  
        case 10:
            this.node.color = Colors.num10;
            break;
        case 11:
            this.node.color = Colors.num11;
            break;
        case 12:
            this.node.color = Colors.num12;
            break;  
        case 13:
            this.node.color = Colors.num13;
            break;
        case 14:
            this.node.color = Colors.num14;
            break;
        case 15:
            this.node.color = Colors.num15;
            break;
        case 16:
            this.node.color = Colors.num16;
            break;
        case 17:
            this.node.color = Colors.num17;
            break;
        case 18:
            this.node.color = Colors.num18;
            break;
        case 19:
            this.node.color = Colors.num19;
            break;
        case 20:
            this.node.color = Colors.num20;
            break;
        default:
            this.node.color = Colors.nums;
            break;
    }
    // 播放特效
    if(playEffect){
        this.node.runAction(cc.sequence(cc.scaleTo(0.15,1.5),cc.scaleTo(0.15,1)));
    }
    // 消除逻辑
    if(exeLogic){
        // 执行逻辑
        var isMove = this.game.operateLogic(this.row,this.col,parseInt(this.numLabel.string),true);
        var powers = this.game.powers;
        // 能量条-1
        if(!isMove){
            for (var i = powers.length - 1; i >= 0; i--) {
                if(powers[i]!=null){
                    var costBarAction = cc.sequence(cc.scaleTo(0.1,0),cc.callFunc(function(power){
                        power.destroy();
                    },null,powers[i]));
                    powers[i].runAction(costBarAction);
                    powers[i] = null;
                    break;
                }
            };
            // 游戏结束逻辑判断：能量条为空
            if(powers[0]==null){
                Global.score = this.game.scoreNum.string;
                // Game Over
                cc.director.loadScene("overScene");
            }
        }
    }
}
```
#### 能量类
同方块类，我们将游戏场景中的能量条也做成预制资源，其中只需要添加一个背景层就可以，背景层也是通过代码动态控制颜色，能量条不需要任何脚本文件。
#### 开始场景
做好了预制资源之后，我们就可以先做开始场景了，效果图如下：
![startScene图](http://7xnnwn.com1.z0.glb.clouddn.com/startScene.png)
开始场景中有三个元素，游戏文字，开始按钮，和背景层，其中游戏文字呈现一个变大变小循环播放的动画，点击开始游戏按钮即可转入游戏场景。具体代码如下：
1.onLoad加载
动态设置元素的位置及宽高，以适配各种型号手机屏幕
```javascript
onLoad: function () {
    // 背景铺平
    this.bg.width = cc.winSize.width;
    this.bg.height = cc.winSize.height;
    this.bg.setPosition(this.bg.width/2,this.bg.height/2);
    this.bg.color = Colors.startBg;
    // 设置文字
    var action = cc.repeatForever(cc.sequence(cc.scaleTo(1, 1.5),cc.scaleTo(1,1)));
    this.gameName.runAction(action);
    this.gameName.setPosition(cc.winSize.width/2,cc.winSize.height/2);
    // 设置按钮
    this.startBtn.setPosition(this.gameName.getPositionX(),this.gameName.getPositionY()-210);
}
```
2.开始游戏按钮回调
点击进入游戏场景
```javascript
startGame:function(){
    cc.audioEngine.playEffect(this.btnEffect);
    cc.director.loadScene("gameScene");
}
```
#### 结束场景
结束场景与开始场景差不多，相比之下，结束场景主要是提供游戏分数特效呈现的功能，效果图如下：
![overScene图](http://7xnnwn.com1.z0.glb.clouddn.com/overScene.png)
结束场景也是几个Label，一个背景层和一个Button按钮组成，其中最重要的是分数特效，通过从0一直往上加，加到实际分数的特效，来使玩家获得成就感，具体代码如下：
1.加载函数
动态设置场景中元素的宽高及位置，播放分数计算特效，绑定TOUCH_START事件，使特效立即播放完成
```javascript
onLoad: function () {
    // 背景层
    this.bg.width = cc.winSize.width;
    this.bg.height = cc.winSize.height;
    this.bg.setPosition(this.bg.width/2,this.bg.height/2);
    this.bg.color = Colors.overBg;
    // 文字层
    this.gameText.setPosition(cc.winSize.width/2,cc.winSize.height/2);
    var action = cc.repeatForever(cc.sequence(cc.scaleTo(1, 1.5),cc.scaleTo(1,1)));
    this.gameText.runAction(action);
    // 播放结束音效
    cc.audioEngine.playEffect(this.overEffect);
    // 分数
    this.scoreText.setPosition(this.gameText.getPositionX(),this.gameText.getPositionY()+200);
    this.score = Global.score;
    this.schedule(this.updateScore,0.1,cc.REPEAT_FOREVER,2);
    // 点击分数立即加到最高分数
    var self = this;
    this.bg.on(cc.Node.EventType.TOUCH_START,function(event){
        cc.log("score text touch");
        cc.audioEngine.playEffect(self.addCoin);
        self.changeScore = self.score;
        self.scoreLabel.string = "最终分数："+self.changeScore;
    }, this.bg);
    // 返回按钮
    this.backBtn.setPosition(this.gameText.getPositionX(),this.gameText.getPositionY()-200);
}
```
2.更新分数回调
每一次更新分数回调，将特效分数增加20，直到加满到游戏得分，并将这一过程显示在场景的Label中
```javascript
updateScore(){
    if(this.score<=this.changeScore){
        this.unschedule(this.updateScore);
    }
    this.changeScore += 20;
    this.changeScore = this.changeScore>this.score?this.score:this.changeScore;
    // 添加音效
    cc.audioEngine.playEffect(this.addCoin);
    this.scoreLabel.string = "最终分数："+this.changeScore;
}
```
3.返回按钮回调
游戏分数的全局变量归零，切换加载开始游戏的场景
```javascript
back:function(){
    Global.score = 0;
    cc.audioEngine.playEffect(this.btnEffect);
    cc.director.loadScene("startScene");
}
```
#### 游戏场景
最主要的还是游戏场景，在游戏场景中，我们进行所有的游戏逻辑的运算，包括前面提到的两个核心算法，游戏场景的效果图如下：
![gameScene图](http://7xnnwn.com1.z0.glb.clouddn.com/gameScene.png)
在游戏主场景中，我们主要需要在onLoad加载时，初始化25个方块，并放在地图中，使他们之间相邻个数小于3个，然后我们需要提供一个主要逻辑判断函数，这个函数中判断游戏中方块的消除逻辑，再前面的Tile的setNum函数中进行调用，代码如下：
1.场景加载
在场景加载中，我们需要初始化25个互相相邻小于3个的方块，与5个能量条，并且动态设置所有元素的宽高与位置。
```javascript
onLoad: function () {
    // 播放背景音乐
    cc.audioEngine.playMusic(this.bgMusic,true);
    // 初始化方块数组
    this.tiles = [
        [null,null,null,null,null],
        [null,null,null,null,null],
        [null,null,null,null,null],
        [null,null,null,null,null],
        [null,null,null,null,null]
    ];
    this.powers = [null,null,null,null,null];
    // 背景层
    this.bg.width = cc.winSize.width;
    this.bg.height = cc.winSize.height;
    this.bg.setPosition(-cc.winSize.width/2,-cc.winSize.height/2);
    this.bg.color = Colors.gameBg;
    // 顶部背景层
    this.topBg.width = cc.winSize.width-30;
    this.topBg.height = 100;
    this.topBg.setPosition(-cc.winSize.width/2+15,(cc.winSize.width-30)/2);
    // 能量条背景层
    this.powerBarBg.width = cc.winSize.width-30;
    this.powerBarBg.height = this.powerBarBg.width/5/2;
    this.powerBarBg.setPosition(15-cc.winSize.width/2,this.topBg.getPositionY()-200);
    this.powerBarBg.color = Colors.powerBarBg;
    // 方块背景层
    this.tileBg.width = cc.winSize.width-30;
    this.tileBg.height = this.tileBg.width;
    this.tileBg.setPosition(15-cc.winSize.width/2,this.powerBarBg.getPositionY()-10-this.tileBg.height);
    this.tileBg.color = Colors.tileBg;
    // 生成能量条
    for(var i=0;i<5;i++){
        var power = cc.instantiate(this.powerPre);
        power.width = (this.powerBarBg.width-30)/5;
        power.height = this.powerBarBg.height-10;
        this.powerBarBg.addChild(power);
        power.setPosition(5+(5+power.width)*i+power.width/2,5+power.height/2);
        power.color = Colors.power;
        this.powers[i] = power;
    };
    // 生成初始方块
    for(var row=0;row<5;row++){
        for(var col = 0;col<5;col++){
            var tile = cc.instantiate(this.tilePre);
            tile.getComponent("Tile").game = this;
            tile.width = (this.tileBg.width-30)/5;
            tile.height = (this.tileBg.height-30)/5;
            var count = 0;
            var maxRandom = 5;
            var randomNum = 0;
            while(true){
                count++;
                var arr = new Array();
                var scanArr = new Array();
                if(count>10){
                    maxRandom++;
                }
                randomNum = Math.ceil(Math.random()*maxRandom);
                tile.getComponent("Tile").setNum(randomNum,false,false);
                tile.setPosition(5+(5+tile.width)*col+tile.width/2,5+(5+tile.height)*row+tile.height/2);
                this.tiles[row][col] = tile;
                this.scanAround(row,col,-1,-1,randomNum,arr,scanArr);
                if(arr.length<3){
                    break;
                }
            }
            tile.getComponent("Tile").setArrPosition(row,col);
            this.tileBg.addChild(tile);
        }
    }
}
```
2.扫描逻辑
前面已经讲过
3.主要操作逻辑
在这个函数中，我们需要对指定的点进行扫描，如果相邻数超过三个，则进行合成动作，然后更新分数，将所有的方块向下移动填补，并补充一条能量条，增加连击次数
```javascript
operateLogic:function(touchRow,touchCol,curNum,isFirstCall){
    var arr = new Array();
    var scanArr = new Array();
    this.scanAround(touchRow,touchCol,-1,-1,curNum,arr,scanArr);
    if(arr.length>=3){
        var addScore = 0;
        for(var index in arr){
            var row = arr[index].split("#")[0];
            var col = arr[index].split("#")[1];
            addScore += parseInt(this.tiles[row][col].getComponent("Tile").numLabel.string*10);
            if(row!=touchRow||col!=touchCol){
                // 执行销毁动作                    
                this.tiles[row][col].getComponent("Tile").destoryTile();
                this.tiles[row][col] = null;
            }else{
                this.tiles[row][col].getComponent("Tile").setNum(curNum+1,false,true);
                this.maxNum = curNum+1>this.maxNum?curNum+1:this.maxNum;
            }
        }
        // 更新分数
        this.scoreNum.string = parseInt(this.scoreNum.string)+addScore;
        this.scheduleOnce(function() {
            // 0.1s后所有方块向下移动
            this.moveAllTileDown();
        },0.1);
        if(!isFirstCall){
            // 能量条补充一格
            for(var i=0;i<5;i++){
                if(this.powers[i]==null){
                    var power = cc.instantiate(this.powerPre);
                    power.width = (this.powerBarBg.width-30)/5;
                    power.height = this.powerBarBg.height-10;
                    this.powerBarBg.addChild(power);
                    power.setPosition(5+(5+power.width)*i+power.width/2,5+power.height/2);
                    power.color = Colors.power;
                    power.setScale(0);
                    power.runAction(cc.scaleTo(0.1,1));
                    this.powers[i] = power;
                    break;
                }
            };
        }
        // 连击次数+1
        Global.combo++;
        // cc.log("连击次数："+Global.combo);
        // 播放音效
        switch(Global.combo){
            case 1:
                cc.audioEngine.playEffect(this.star1);
            break;
            case 2:
                cc.audioEngine.playEffect(this.star2);
            break;
            case 3:
                cc.audioEngine.playEffect(this.star3);
            break;
            case 4:
                cc.audioEngine.playEffect(this.star4);
            break;
            case 5:
                cc.audioEngine.playEffect(this.star5);
            break;
            case 6:
                cc.audioEngine.playEffect(this.star6);
            break;
            case 7:
                cc.audioEngine.playEffect(this.star7);
            break;
            default:
                cc.audioEngine.playEffect(this.star7);
            break;
        }
        return true;
    }else{
        this.isCal = false;
    }
    return false;
}
```
4.所有方块向下移动
除了上文提到所有方块的移动算法之外，在移动完成之后，还需要进行新产生一批方块，并再次判断消除逻辑的操作
```javascript
moveAllTileDown:function(){
    for (var col = 0; col < 5; col++) {
        for (var row = 0; row < 5; row++) {
            if (this.tiles[row][col] != null) {// 有方块
                for (var row1 = row; row1 > 0; row1--) {
                    if (this.tiles[row1 - 1][col] == null){
                        //如果没有向下移动
                        this.tiles[row1 - 1][col] = this.tiles[row1][col];
                        this.tiles[row1][col] = null;
                        this.tiles[row1 - 1][col].getComponent("Tile").moveTo(row1 - 1, col);
                    }
                }
            }
        }
    }
    this.scheduleOnce(function() {
        // 0.3s后生成新方块
        for (var col = 0; col < 5; col++) {
            for (var row = 0; row < 5; row++) {
                if(this.tiles[row][col]==null){
                    var tile = cc.instantiate(this.tilePre);
                    tile.getComponent("Tile").game = this;
                    tile.width = (this.tileBg.width-30)/5;
                    tile.height = (this.tileBg.height-30)/5;
                    var maxRandom = this.maxNum;
                    var randomNum = Math.ceil(Math.random()*maxRandom);
                    tile.getComponent("Tile").setNum(randomNum,false,false);
                    tile.getComponent("Tile").newTile(row,col);
                    this.tiles[row][col] = tile;
                    this.tileBg.addChild(tile);
                }
            }
        }
        // 0.5s后遍历执行逻辑
        this.scheduleOnce(function() {
            var isSearch = false;
            for (var col = 0; col < 5; col++) {
                for (var row = 0; row < 5; row++) {
                    if(!isSearch){
                        isSearch = this.tiles[row][col]!=null&&this.operateLogic(row,col,parseInt(this.tiles[row][col].getComponent("Tile").numLabel.string),false);
                    }
                }
            }
        }, 0.5);        
     }, 0.3);
}
```
### 运行效果
最后的运行效果如下
![点我+1效果图](http://7xnnwn.com1.z0.glb.clouddn.com/addone.gif)
通过CVP平台的项目托管可看到实际运行效果，地址如下：
- 由于个人对Cocos Creator的适配还不大了解，在pc上运行时，需要使用chrome的手机调试预览（或者将chrome窗口调至手机屏幕大小），但是如果直接用手机打开，loadScene似乎又有不兼容的问题，至今无法理解，还请大神指点，而我无论是开发时的预览，还是通过xcode打包到我的iPhone6s Plus手机运行，都是完全没有问题。不知道是不是Creator的h5兼容还没有做好，又或者我哪里的技术没有掌握全面。
http://www.cocoscvp.com/usercode/946fc5fd5d2c77331cc344ea1e4bfdd04630cf85/

### 源代码
所有源代码均上传到github，欢迎交流学习，地址：
https://github.com/hjcenry/addone

- 原文博客：http://hjcenry.github.io