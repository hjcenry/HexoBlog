---
title: 游戏服务器首次大bug解决记录
date: 2016-01-23 00:14
categories: Java
tags: [Java,Bug,游戏服务器]
---
### 出问题前
游戏上线快两天了，中午正忙着写一些gm管理工具，方便运营直接从后台修改游戏数据，给玩家发放一些奖励什么的
<!--more-->
### 接到玩家投诉
后来，就听见运营不断接到玩家打来电话投诉，说自己游戏的数据没了，辛辛苦苦升级的英雄，辛辛苦苦合成的神装，突然就没了，第一个玩家的投诉出现时，我们并没有太注意，以为可能玩家自己修改了游戏数据造成了游戏数据异常，可当第二个、第三个、下午开始不断有玩家投诉的时候，我们才意识到问题的严重性。

![玩家数据修改](http://upload-images.jianshu.io/upload_images/1472037-6bb383e1f57df6e5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![玩家数据修改](http://upload-images.jianshu.io/upload_images/1472037-c0cffcb6a6180b9f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 查问题
这个时候，前端查代码，我也开始查日志，先看游戏日志，发现前端确实发送了英雄数据的存档信息，可到后来，英雄数据也确实就这么没了，这确实是很疑惑的问题。后来，我只能去查mysql数据库的日志，由于mysql使用的是ucloud云数据库，每次要查看它的日志都要先去udb控制台打包日志，下载下来，再用mysqlbinlog工具查看（由于win下cmd不熟悉，我还是喜欢上传到服务器用服务器的grep来查看比较方便），查完mysql日志，我也确实看到了那几条明摆着的insert语句，这就更让人摸不着头脑了，既然游戏数据传上来了，数据库也插入了，那玩家的这些数据去哪儿了？难道服务器被攻击了？不可能啊，我前段时间刚清完病毒啊！正当不知道怎么办的时候，我想根据id查查这几条数据还在不在，结果令人诧异啊，我插入的数据，不在这个玩家下面了，但是根据当时插入时生成的id，我发现它跑到了另一个玩家的数据里，这是为什么？
```java
public void setEquipments(long junZhuId, GameData data) {
  List<EquipmentData> equipments = data.getEquipment();
  for (EquipmentData equipmentData : equipments) {
   HeroEquip heroEquip = HibernateUtil.find(HeroEquip.class,
     "where junZhuId=" + junZhuId + " and heroName='"
       + equipmentData.getHeroName() + "' and equipOrder="
       + equipmentData.getEquipmentOrder() + "");
   if (heroEquip == null) {
    heroEquip = new HeroEquip();
    heroEquip.id = TableIDCreator.getTableID(HeroEquip.class, 1);
    heroEquip.junZhuId = junZhuId;
    heroEquip.heroName = equipmentData.getHeroName();
    heroEquip.equipOrder = equipmentData.getEquipmentOrder();
   }
   if (equipmentData.getEquipmentName().equals("null")) {// 卸下装备
    HibernateUtil.delete(heroEquip);
    return;
   }
   heroEquip.equipName = equipmentData.getEquipmentName();
   heroEquip.heroName = equipmentData.getHeroName();
   heroEquip.equipStar = equipmentData.getEquipmentStar();
   HibernateUtil.save(heroEquip);
  }
 }

 public void setHeros(long junZhuId, GameData data) {
  List<HeroData> heros = data.getHero();
  for (HeroData heroData : heros) {
   Hero hero = HibernateUtil.find(Hero.class, "where junZhuId="
     + junZhuId + " and name='" + heroData.getHeroName() + "'");
   if (hero == null) {
    hero = new Hero();
    hero.setId(TableIDCreator.getTableID(Hero.class, 1));
    hero.setJunZhuId(junZhuId);
    hero.setName(heroData.getHeroName());
   }
   if (heroData.getHeroLevel() > hero.getLevel()) {
    hero.setLevel(heroData.getHeroLevel());
   }
   if (heroData.getHeroStar() > hero.getStar()) {
    hero.setStar(heroData.getHeroStar());
   }
   hero.setSoul(heroData.getHeroSoul());
   hero.setIsWar(heroData.getIsWar());
   HibernateUtil.save(hero);
  }
 }
```
仔细看了看以上我写的代码，并不能看出怎么能造成数据的错乱，查询条件查询出来的结果一定是唯一的，怎么会跑到别的玩家数据下面了呢？正当我一筹莫展的时候，我觉得，id，是造成数据混乱最重要的原因，很有可能，两个玩家操作了同一个id的数据，于是很快，我发现了很可疑的，就是
```java
heroEquip.id = TableIDCreator.getTableID(HeroEquip.class, 1);
```
和
```java
hero.setId(TableIDCreator.getTableID(Hero.class, 1));
```
这两句，便是生成id的地方，或许所有游戏数据的混乱都是这里生成的id不正确导致，于是我点开了曾经写的id生成管理类。
```java
public static <T> long getTableID(Class<T> clazz, long startId) {
  String key = clazz.getName() + "#id";
  // 表的主键ID从1开始
  Long id = memcached.<Long> get(key);
  if (id == null) {
   // 从数据库里查询该表当前主键的最大值
   id = HibernateUtil.getTableIDMax(clazz);
   if (id == null) {
    boolean ret = memcached.safeSet(key, 0, startId);
    // logger.info("A开始为table:{}设置主键ID:{} ret {}", key, startId,
    // ret);
   } else {
    boolean ret = memcached.safeSet(key, 0, id);
    // logger.info("B开始为table:{}设置主键ID:{} ret {}", key, id,ret);
   }
  }
  id = id + 1l;
  memcached.set(key, 0, id);
  return id;
 }
```
以上，便是曾经写的，用于生成数据库主键id的id管理类，最开始这样设计只是为了减轻数据库压力，生成id也是会消耗数据库性能的，于是我就用memcache结合数据库来生成id，以上代码，看出来什么问题了吗？或许第一眼并不能看出来有什么问题，确实，在少量用户的情况下，并不会发生什么意外，可如果并发量一多，就悲剧了，而且是造成大面积的影响！Long型的id，从缓存读出来后，直接就进行操作了！id=id+1l，这就是致命的bug！在这里，并没有将id进行加锁操作，导致在高并发下，多个用户甚至可能得到同一个id，这也就解释了为什么有的玩家的数据，跑到别的玩家下面去了，就像玩家电话里投诉的，“我充了XX钱，怎么我的英雄都没了？！我的神装也没有了？！为什么？？？”，这个时候，客服一般会说“我们的技术已经在查了，努力解决，修复后会提供补偿”，然而这时候，我还在绞尽脑汁，拼命地找bug在哪儿，没想到，竟然是当初的id生成就出了差错，这一步错误，就导致整个游戏服中的数据乱了，只要发生过并发操作的玩家数据，都乱了，还好目前只上了小米平台，只有1000多注册用户，否则会造成大量的用户流失，昨天小米收入2000多，今天由于停服维护了半个多小时，收入只有1000多了，出了问题不要紧，一定要记住为什么会出这样的问题，一定要保证下次写代码要更加的严谨！
### 解决
以上问题，要解决，很简单，只要保证对id是原子性的操作，保证在并发环境下，id的只能被一个线程操作，就ok了，这里可以对这个方法加上synchronized关键字修饰，也可以单独对id加锁，synchronized（id），这样，就可以保证id的原子性操作了，我的做法稍有不同，java memcache api既然提供了incr这样的原子操作，我们就直接用memcache.incr来代替自己写的+1操作就ok，另外getCounter也要保持读取的是内存中的最新值，修正后的代码如下：
```java
public static <T> long getTableID(Class<T> clazz, long startId) {
  String key = clazz.getName() + "#id";
  // 表的主键ID从1开始
  Long id = null;
  if (memCachedClient.getCounter(key) == -1) {
   // 从数据库里查询该表当前主键的最大值
   id = HibernateUtil.getTableIDMax(clazz);
   if (id == null) {
    boolean ret = memCachedClient.storeCounter(key, startId);
    logger.info("A开始为table:{}设置主键ID:{} ret {}", key, startId, ret);
   } else {
    boolean ret = memCachedClient.storeCounter(key,
      Math.max(startId, id));// 即便数据库有记录，也比较该id是否满足参数startId的要求。
    logger.info("B开始为table:{}设置主键ID:{} ret {}", key, id, ret);
   }
  }
  id = memCachedClient.incr(key, 1);
  if (id == -1) {
   logger.error("table:{}主键增加失败", key);
   return -1;
  } else {
   logger.info("table:{}的ID加1增长为{}", key, id);
  }
  return id;
 }
```
### 总结
血泪教训啊，就这半小时的停机维护，虽然就上了一个渠道，估计也得有好几百的损失吧，服务器开发中，尤其需要注意的，就是并发问题，任何共享资源都要做好加锁解锁！
