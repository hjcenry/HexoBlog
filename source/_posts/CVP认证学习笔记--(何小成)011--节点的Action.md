---
title: CVP认证学习笔记--(何小成)011--节点的Action
date: 2016-04-19 21:12
categories: cocos2d-js
tags: [cocos2d-js,cvp]
---
### 概念
本节课内容讲解节点的Action，不过本节课只以moveTo为例进行了讲解，本节课作业为实现点击按钮让npc在0.2s内向右移动15像素，其中使用了moveTo方法，第一个参数为，动作执行的时间，单位为秒，第二个参数为要移动到的点，如果是moveBy，scaleBy之类的，<!--more-->就是要移动的相对位置或相对缩放比例。
### 作业
我的代码实现如下：
```javascript
        //定义一个Sprite
        var npc=new cc.Sprite(res.npc01_png);//一会要增加这个文件在src/resource.js
        npc.setPosition(cc.winSize.width/2,cc.winSize.height/2);
        this.addChild(npc);
        npc.setTag(1);
        //Action是什么？是实现定义好的计划任务 定时修改node属性
        //npc.runAction(new cc.moveTo(3,cc.p(30,30)));
        //moveTo 移动到 绝对位置
        //moveBy 移动到 x,y 相对位置
        var startItem = new cc.MenuItemFont("移动",this.moveNpc,this);
        var menu = new cc.Menu(startItem);
        this.addChild(menu);

        // menu的回调函数
        moveNpc:function(){
        var npc = this.getChildByTag(1);
        npc.runAction(new cc.moveBy(0.2,cc.p(15,0)));
```

当然这是作业，课程中也说了，Node的Action远不止这么一种，还有诸如moveBy，scaleTo，scaleBy，rotateTo，jumpTo等动作，这里就不一一列举。
### 最后运行效果
http://www.cocoscvp.com/usercode/2016_04_19/e08b6f708a97a7bc22f248dda38ebab4349f2b36/
