---
title: Java并发Bug记录（后续）
date: 2016-02-21 12:47
categories: Java
tags: [Java,并发,Bug]
---
上篇文章《Java并发Bug记录》http://www.jianshu.com/p/5e74131b950a  ，并没有真正的解决问题，下面的评论中就有一位前辈指出了问题，我那样处理，可能造成所有的处理都变成单线程了，处理效率会有所折损，我按照他的建议把数据库加上<!--more-->了联合唯一约束索引，这样直接就在数据库层避免了重复数据的录入，
如下图：

![Paste_Image.png](http://upload-images.jianshu.io/upload_images/1472037-973b09c05ba3217b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
在添加索引之前，我还必须把之前重复的记录手动删除掉，才能加上唯一所索引，执行以下sql语句：
```sql
delete from Totem where id in(select c.id from (select a.id from Totem a,(select * from Totem group by junZhuId,name having count(id)>1) b where a.junZhuId=b.junZhuId and a.name=b.name and a.id!=b.id) c);
```
这样直接从数据库层确定了唯一索引，保证了数据的完整性，不过作为强迫症的我，有一个问题很让我困扰，恳请大家能不能帮忙解决下：

![Paste_Image.png](http://upload-images.jianshu.io/upload_images/1472037-0149ad932f1405ef.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

加上唯一索引后，我就把锁去掉了，因为数据库已经能够保证唯一性了，这里加锁就是浪费性能了，可是这样，日志中就会有那些无法插入的数据，log中出现error，而实际上我知道，这些就是那些重复插入的数据，可是日志中的error确实让人很难受，请问有解决办法吗？
