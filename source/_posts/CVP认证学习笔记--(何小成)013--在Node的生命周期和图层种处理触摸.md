---
title: CVP认证学习笔记--(何小成)013--在Node的生命周期和图层种处理触摸  
date: 2016-04-19 23:40
categories: cocos2d-js
tags: [cocos2d-js,cvp]
---
本节课内容讲了两个重要的知识点：
### Node的生命周期
首先说Node的生命周期，主要是ctor（构造函数）、onEnter、onExit的理解，执行顺序为先调用构造函数，来创建这个Node对象，然后将Node添加到画面中，调用onEnter，Node销毁时，调用onExit。<!--more-->
### 图层的触摸处理
在cocos中，有三个概念要明白：
1. cc.EventListener事件监听器
2. cc.eventManager事件管理器
3. cc.Event事件对象
使用事件就需要创建以下事件监听器中的其中一个
1. 触摸事件监听器 (cc.EventListenerTouch)
2. 键盘事件监听器 (cc.EventListenerKeyboard)
3. 加速计事件监听器 (cc.EventListenerAcceleration)
4. 鼠标事件监听器 (cc.EventListenerMouse)
5. 自定义事件监听器 (cc.EventListenerCustom)
通过以下语句来创建并添加以上各种类型事件监听器：
```javascript
       cc.eventManager.addListener({
           event:cc.EventListener.TOUCH_ONE_BY_ONE,
           swallowTouches:true,//吞噬事件 不再传递
           onTouchBegan:this.touchbegan,
           onTouchMoved:this.touchmoved,
           onTouchEnded:this.touchended
       },this);

    touchbegan:function(touch,event)
    {// 按下事件
        cc.log("按下");
        return true;
    },
    touchmoved:function(touch,event)
    {// 移动事件
        cc.log("移动");
    },
    touchend:function(touch,event)
    { // 抬起事件
        cc.log("抬起");
    }
```

其中，event类型有以下几种：
1. cc.EventListener.TOUCH_ONE_BY_ONE (单点触摸)
2. cc.EventListener.TOUCH_ALL_AT_ONCE (多点触摸)
3. cc.EventListener.KEYBOARD (键盘)
4. cc.EventListener.MOUSE (鼠标)
5. cc.EventListener.ACCELERATION (加速计)
6. cc.EventListener.CUSTOM (自定义)

更多关于cocos的事件管理机制，在官网的帮助文档有详细介绍，地址如下：
http://www.cocos.com/doc/article/index?type=cocos2d-x&url=/doc/cocos-docs-master/manual/framework/cocos2d-js/catalog/../../html5/v3/eventManager/zh.md

### 作业
本节课作业要求实现点击屏幕添加一个英雄，我实现了点击添加英雄，并且能拖动创建的对象，对象在执行完一个特定的动作序列后移除自身节点，代码如下：
```javascript
    onEnter:function()
    {
        this._super();
        cc.log("初始化完成");
       //添加触屏事件
       cc.eventManager.addListener({
           event:cc.EventListener.TOUCH_ONE_BY_ONE,
           swallowTouches:true,//吞噬事件 不再传递
           onTouchBegan:this.touchbegan,
           onTouchMoved:this.touchmoved,
           onTouchEnded:this.touchended
       },this);

    },
    onExit:function()
    {
        this._super();
        cc.log("即将消失");
    },
    touchbegan:function(touch,event){
        cc.log("按下");
        var npc=new cc.Sprite(res.npc01_png);
        npc.setPosition(touch.getLocation().x,touch.getLocation().y);
        // 设置随机角度和缩放
        npc.setRotation(Math.round(Math.random()*360));
        npc.setScale(Math.random()*2);
        // 添加到图层
        event.getCurrentTarget().addChild(npc);
        // 设置到全局变量，便于move方法中使用
        event.getCurrentTarget().sprite = npc;
        // 执行动作序列后消失
        var act = new cc.spawn(cc.sequence(
            cc.rotateBy(2,360),cc.callFunc(function(npc){
                npc.removeFromParent();
            },npc)
        ),cc.scaleTo(2,0));
        npc.runAction(act);
        return true;
    },
    touchmoved:function(touch,event)
    {
        var nownpc= event.getCurrentTarget().sprite;
        nownpc.setPosition(touch.getLocation().x,touch.getLocation().y);
        cc.log("移动");
    },
    touchend:function(touch,event)
    {
        cc.log("抬起");
    }
```

### 最后运行效果
http://www.cocoscvp.com/usercode/2016_04_19/d0e83b7672c345f087f2d82bf65e1746ac063afe/
