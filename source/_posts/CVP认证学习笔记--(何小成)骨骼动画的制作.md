---
title: CVP认证学习笔记--(何小成)骨骼动画的制作
date: 2016-05-10 22:44
categories: cocos2d-js
tags: [cocos2d-js,cvp]
---
本文主要复习下骨骼动画的制作过程，<a href="http://hjcenry.github.io/2016/05/06/CVP%E8%AE%A4%E8%AF%81%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0--(%E4%BD%95%E5%B0%8F%E6%88%90)023--%E5%8A%A0%E8%BD%BD%E9%AA%A8%E9%AA%BC%E5%8A%A8%E7%94%BB/">上一篇文章</a>简单介绍了cocos中对于骨骼动画的使用，本文主要从骨骼动画制作的角度来讲解。<!--more-->
### 导入资源
制作之前准备好所需要的图片资源，然后倒入到cocos studio中，如下图：
![导入资源](http://cdn.cocimg.com/bbs/attachment/Fid_72/72_319828_1a202fb1ffd1025.png)
### 添加皮肤
资源中的皮肤一个一个拖放到场景中，使小图片大致能拼出来一个完整的图片，如下图：
![添加皮肤](http://cdn.cocimg.com/bbs/attachment/Fid_72/72_319828_55529c9535d5bb4.png)
### 添加骨骼 
根据人物的骨骼特征，为皮肤添加骨骼，如下图：
![添加骨骼](http://cdn.cocimg.com/bbs/attachment/Fid_72/72_319828_3ad23acff07741b.png)
### 绑定父关系
把具有相互关系的骨骼绑定起来，使骨骼之间能够作为整体进行动画，如头部应该绑定身体为父关系，而手腕应该绑定手臂为父关系，如下图：
![绑定父关系](http://cdn.cocimg.com/bbs/attachment/Fid_72/72_319828_a02834c9d8347ca.png)
### 制作动画 
骨骼绑定之后，就可以编辑动画，动画编辑即选择选择动画模式，然后选择相应的图层，在下面时间轴上的关键帧上进行改变，中间的补间动画cocos studio会自动创建，如下图：
![制作动画](http://cdn.cocimg.com/bbs/attachment/Fid_72/72_319828_40c0db20e072450.png)
### 导出资源
确定制作完成，并经过了精细的调整之后，就可以导出动画了，导出的操作很简单，即选择文件，然后选择导出项目，如下图：
![导出资源](http://7xnnwn.com1.z0.glb.clouddn.com/daochu.png)
导出之后可以看到相应的文件夹下有png，plist和json三个文件，即上一篇文章中说到的cocos中需要使用到的骨骼动画资源，至此，骨骼动画制作完成！ 整个过程感觉是一个挺细心的活，作为一个程序来说，做了一个骨骼动画之后，我真心佩服美术，那些游戏中无论活灵活现的主人公，还是酷炫吊炸天特效，都是美术们这样一帧一帧调出来的，真的是我心目中的艺术家，衷心的点个赞！
### 最终效果
制作完之后，我加在了上一节课的作业的开始界面和帮助界面中，如下图：
![效果图](http://7xnnwn.com1.z0.glb.clouddn.com/1111.gif)
作业地址：http://www.cocoscvp.com/usercode/b09ecc9894fe6ab8a1ba17f5d5348b9a215038a6/