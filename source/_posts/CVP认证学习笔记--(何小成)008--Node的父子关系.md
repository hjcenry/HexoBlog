---
title: CVP认证学习笔记--(何小成)008--Node的父子关系
date: 2016-04-18 00:06
categories: cocos2d-js
tags: [cocos2d-js,cvp]
---
### 概念
本节课内容主要讲了node之间的层级关系，场景中所有的Node是一个节点树，可以根据节点间的关系获取到所需要的节点，并进行相应的操作。在开发中，如果需要对多个node同时进行一个操作，可以将这些node放在一个node中，通过操作这个总的node，<!--more-->就能产生相应的效果。如本节课作业，需要将时间的58分进行上移或下移，在上节课作业中，5和8一般情况下是在两个图层中，而如果需要同时进行上移或下移，就可以把他们放在一个图层中进行操作。一个父节点可以有多个子节点，而一个子节点只能有一个父节点，合理安排图层中节点的关系，可以使得开发中获取各node更加的方便。
### 作业
上节课我的作业中是实现的电子钟，这节课作业中我对时分秒分别加入上下两个按钮，实现时分秒的上移或下移，代码如下：
```javascript
/**
 * Created by Henry on 16/4/16.
 */
var cellSpace = 3;
var rectWidth = 10;
var rectHeight = 10;
var Layer0202 = cc.Layer.extend({
    normalColor: cc.color(245, 245, 245, 50),
    numColor: cc.color(152, 245, 255, 255),
    numColor2: cc.color(152, 245, 255, 80),
    initX: 0,
    ctor: function (num, initX, initY) {
        this._super();
        var size = cc.winSize;
        this.initX = initX;
        var rects = [];
        var rectNum = num == -1 ? 4 : 8;
        // 添加显示时间方块
        for (var row = 0; row < 8; row++) {
            rects[row] = [];
            for (var col = 0; col < rectNum; col++) {
                rects[row][col] = new cc.LayerColor(this.normalColor, rectWidth, rectHeight);
                rects[row][col].setPosition(initX + col * (cellSpace + rectWidth), initY + row * (cellSpace + rectHeight));
                rects[row][col].ignoreAnchorPointForPosition(false);
                rects[row][col].setAnchorPoint(0.5, 0.5);
                this.addChild(rects[row][col]);
            }
        }
        // 获取要现实的数字的阵型
        var numArr = getNum(num);
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < rectNum; col++) {
                if (numArr[row][col] == 1) {
                    // 改变数字显示单元格的颜色
                    rects[7 - row][col] = new cc.LayerColor(this.numColor2, rectWidth, rectHeight);
                    rects[7 - row][col].setPosition(initX + col * (cellSpace + rectWidth), initY + (7 - row) * (cellSpace + rectHeight));
                    rects[7 - row][col].ignoreAnchorPointForPosition(false);
                    rects[7 - row][col].setAnchorPoint(0.5, 0.5);
                    this.addChild(rects[7 - row][col]);
                }
            }
        }
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < rectNum; col++) {
                if (numArr[row][col] == 1) {
                    // 改变数字显示单元格的颜色
                    rects[7 - row][col] = new cc.LayerColor(this.numColor, rectWidth, rectHeight);
                    rects[7 - row][col].setPosition(initX + col * (cellSpace + rectWidth), initY + (7 - row) * (cellSpace + rectHeight));
                    rects[7 - row][col].ignoreAnchorPointForPosition(false);
                    rects[7 - row][col].setAnchorPoint(0.8, 0.2);
                    this.addChild(rects[7 - row][col]);
                }
            }
        }

        return true;
    },
    getPositionX: function () {
        return this.initX;
    }
});

var Scene0202 = cc.Scene.extend({
    size: cc.winSize,
    ctor: function () {
        this._super();
        // 定义时分秒三个layer
        var layer = new cc.Layer();
        this.addChild(layer);
        layer.setTag(0);
        var hourLayer = new cc.Layer();
        var minuteLayer = new cc.Layer();
        var secondLayer = new cc.Layer();
        layer.addChild(hourLayer);
        layer.addChild(minuteLayer);
        layer.addChild(secondLayer);
        hourLayer.setTag(1);
        minuteLayer.setTag(2);
        secondLayer.setTag(3);
        hourLayer.width = cellSpace * 7 + rectWidth * 8;
        hourLayer.height = cellSpace * 7 + rectWidth * 8;
        minuteLayer.width = cellSpace * 7 + rectWidth * 8;
        minuteLayer.height = cellSpace * 7 + rectWidth * 8;
        secondLayer.height = cellSpace * 7 + rectWidth * 8;
        secondLayer.width = cellSpace * 7 + rectWidth * 8;
        layer.setPositionX((this.size.width - layer.width) / 2);
        // 每秒刷新
        this.refresh();
        this.schedule(this.refresh, 1);
        this.scheduleUpdate();
        // 添加hour上下按钮
        var hourMenuUp = new cc.MenuItemLabel(new cc.LabelTTF("^", "", 50), this.hourUp, this);
        hourMenuUp.setPosition(0, hourMenuUp.height + 10);
        var hourMenuDown = new cc.MenuItemLabel(new cc.LabelTTF("v", "", 50), this.hourDown, this);
        hourMenuDown.setPosition(0, 0);
        var hourMenu = new cc.Menu(hourMenuUp, hourMenuDown);
        hourMenu.setPosition(this.size.width / 6, 20);
        hourMenu.ignoreAnchorPointForPosition(false);
        hourMenu.setAnchorPoint(0, 0);
        this.addChild(hourMenu);
        // 添加minute上下按钮
        var minuteMenuUp = new cc.MenuItemLabel(new cc.LabelTTF("^", "", 50), this.minuteUp, this);
        minuteMenuUp.setPosition(0, minuteMenuUp.height + 10);
        var minuteMenuDown = new cc.MenuItemLabel(new cc.LabelTTF("v", "", 50), this.minuteDown, this);
        minuteMenuDown.setPosition(0, 0);
        var minuteMenu = new cc.Menu(minuteMenuUp, minuteMenuDown);
        minuteMenu.setPosition(this.size.width / 2, 20);
        minuteMenu.ignoreAnchorPointForPosition(false);
        minuteMenu.setAnchorPoint(0, 0);
        this.addChild(minuteMenu);
        // 添加second上下按钮
        var secondMenuUp = new cc.MenuItemLabel(new cc.LabelTTF("^", "", 50), this.secondUp, this);
        secondMenuUp.setPosition(0, hourMenuUp.height + 10);
        var secondMenuDown = new cc.MenuItemLabel(new cc.LabelTTF("v", "", 50), this.secondDown, this);
        secondMenuDown.setPosition(0, 0);
        var secondMenu = new cc.Menu(secondMenuUp, secondMenuDown);
        secondMenu.setPosition(this.size.width * 5 / 6, 20);
        secondMenu.ignoreAnchorPointForPosition(false);
        secondMenu.setAnchorPoint(0, 0);
        this.addChild(secondMenu);
        return true;
    },
    hourUp: function () {
        var layer = this.getChildByTag(0);
        var hourLayer = layer.getChildByTag(1);
        hourLayer.setPositionY(hourLayer.getPositionY()+30);
    },
    hourDown: function () {
        var layer = this.getChildByTag(0);
        var hourLayer = layer.getChildByTag(1);
        hourLayer.setPositionY(hourLayer.getPositionY()-30);
    },
    minuteUp: function () {
        var layer = this.getChildByTag(0);
        var minuteLayer = layer.getChildByTag(2);
        minuteLayer.setPositionY(minuteLayer.getPositionY()+30);
    },
    minuteDown: function () {
        var layer = this.getChildByTag(0);
        var minuteLayer = layer.getChildByTag(2);
        minuteLayer.setPositionY(minuteLayer.getPositionY()-30);
    },
    secondUp: function () {
        var layer = this.getChildByTag(0);
        var secondLayer = layer.getChildByTag(3);
        secondLayer.setPositionY(secondLayer.getPositionY()+30);
    },
    secondDown: function () {
        var layer = this.getChildByTag(0);
        var secondLayer = layer.getChildByTag(3);
        secondLayer.setPositionY(secondLayer.getPositionY()-30);
    },
    refresh: function (first) {
        var now = new Date();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var seconds = now.getSeconds();
        var hour1 = hour.toString().length > 1 ? hour.toString().charAt(0) : 0;
        var hour2 = hour.toString().length > 1 ? hour.toString().charAt(1) : hour;
        var minute1 = minute.toString().length > 1 ? minute.toString().charAt(0) : 0;
        var minute2 = minute.toString().length > 1 ? minute.toString().charAt(1) : minute;
        var second1 = seconds.toString().length > 1 ? seconds.toString().charAt(0) : 0;
        var second2 = seconds.toString().length > 1 ? seconds.toString().charAt(1) : seconds;
        var layer = this.getChildByTag(0);
        var hourLayer = layer.getChildByTag(1);
        var minuteLayer = layer.getChildByTag(2);
        var secondLayer = layer.getChildByTag(3);
        if (layer.getChildByTag(4) != null) {
            layer.removeChildByTag(4);
        }
        if (layer.getChildByTag(5) != null) {
            layer.removeChildByTag(5);
        }
        hourLayer.removeAllChildren();
        minuteLayer.removeAllChildren();
        secondLayer.removeAllChildren();
        // 添加6个数字和2个冒号
        var initX = 20;
        var initY = this.size.height / 2;
        // hour
        var num1 = new Layer0202(Number(hour1), initX, initY);
        var num2 = new Layer0202(Number(hour2), num1.getPositionX() + cellSpace * 7 + rectWidth * 8 + 10, initY);
        // 冒号
        var num3 = new Layer0202(-1, num2.getPositionX() + cellSpace * 7 + rectWidth * 8 + 10, initY);
        // minute
        var num4 = new Layer0202(Number(minute1), num3.getPositionX() + cellSpace * 3 + rectWidth * 4 + 10, initY);
        var num5 = new Layer0202(Number(minute2), num4.getPositionX() + cellSpace * 7 + rectWidth * 8 + 10, initY);
        // 冒号
        var num6 = new Layer0202(-1, num5.getPositionX() + cellSpace * 7 + rectWidth * 8 + 10, initY);
        // second
        var num7 = new Layer0202(Number(second1), num6.getPositionX() + cellSpace * 3 + rectWidth * 4 + 10, initY);
        var num8 = new Layer0202(Number(second2), num7.getPositionX() + cellSpace * 7 + rectWidth * 8 + 10, initY);
        // 设置小时图层
        hourLayer.addChild(num1);
        hourLayer.addChild(num2);
        // 添加冒号
        layer.addChild(num3);
        num3.setTag(4);
        // 设置分钟图层
        minuteLayer.addChild(num4);
        minuteLayer.addChild(num5);
        layer.addChild(num6);
        num6.setTag(5);
        // 设置秒图层
        secondLayer.addChild(num7);
        secondLayer.addChild(num8);
    }
});

// 本节作业：
// 锚点也叫对齐点，是Position对齐的坐标，如果0,0则用这个node的左下角对齐position
// 如果是1,1则用node的右上角对齐
// 0.5,0.5则用node的中心来对齐
// 作业：
// 使用锚点实现 11:58 这个时间的显示，注意要画很多的矩形呦
// 至于这个时间怎么能变 我们后面讲
// 两个冒号 也是矩形

// 预先设置好数组的显示,以01区分
var getNum = function (num) {
    switch (num) {
        case -1:// 冒号
            return [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ];
        case 0:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 0, 0, 0, 1, 0],
                [0, 1, 0, 1, 0, 0, 1, 0],
                [0, 1, 0, 0, 1, 0, 1, 0],
                [0, 1, 0, 0, 0, 1, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
        case 1:
            return [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
        case 2:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 0]
            ];
        case 3:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
        case 4:
            return [
                [0, 0, 0, 0, 1, 0, 1, 0],
                [0, 0, 0, 1, 0, 0, 1, 0],
                [0, 0, 1, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0]
            ];
        case 5:
            return [
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 1, 1, 0, 0]
            ];
        case 6:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
        case 7:
            return [
                [0, 0, 1, 1, 1, 1, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0]
            ];
        case 8:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
        case 9:
            return [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
    }
}
```

### 运行效果
http://www.cocoscvp.com/usercode/2016_04_17/81435b882df65c1f94e7f5793e1e3de35d6e15a1/
