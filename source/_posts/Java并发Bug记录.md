---
title: Java并发Bug记录
date: 2016-02-16 14:44
categories: Java
tags: [Java,并发,Bug]
---

游戏运营一段时间后，我没事查查log，发现一个说大不大，说小也不小的问题，由下图看出，有一些玩家的数据出现异常，比如英雄本来是一个英雄一个玩家只能拥有一个的，有的玩家却拥有多个，导致读档查询时，Hibernate结果集不唯一的异常，<!--more-->其他的数据如装备，关卡等本应唯一的数据均有此问题，但却是极少数，为什么会出现这些问题，我也是思考了很久，因为是玩家自己的数据异常，跟别的玩家没有关系，所以刚开始并没有联想到并发控制问题，可是后来却也不得不开始怀疑，是否是玩家自己频繁请求，导致多个请求产生并发。

日志截图如下：

![日志截图](http://7xnnwn.com1.z0.glb.clouddn.com/1472037-c30e1b91562689e5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

于是查代码，拿英雄数据举例：

```java
/**
     * @Title: setHeros
     * @Description: 存档英雄数据
     * @param junZhuId
     * @param data
     * @param ctx
     *            void
     * @throws
     */
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
根据英雄数据存档方法可以看出，我的确是根据玩家id和英雄名字来作为唯一条件进行存档的，那么为什么会出现多条数据导致查询时结果集不唯一呢，唯一能想到的就是这个方法的调用出现了并发问题，当两个或者更多的请求卡在Hero的查询那一句时，可能同时查出null，然后都进入新增的if判断里，于是，多个请求均获得一个新的id，Hibernate根据id判断为新，则直接插入，于是就能产生多条本该唯一的数据。至于为什么一个玩家自己也能产生并发问题，唯一的解释就是玩家网络状况不好，导致多个请求都阻塞在客户端（请求不到结果时，客户端会再发起一次请求，最后积累一堆的请求），最后，多个请求一并发出，服务端瞬间接收到一堆英雄存档请求，于是产生并发问题。

找到原因之后，要解决，其实就很简单了，每个玩家进来，我就对这个玩家，把这个方法锁定，同一个玩家不能频繁请求同一个接口，由于我用Netty自己实现的Http服务器，所以这个请求频次限制只能由我来代码实现了，代码如下：

```java
/**
     * @Title: frequencyLimit
     * @Description: 接口访问频次限制
     * @param userId
     *            void
     * @throws
     */
    public boolean frequencyLimit(String key, Long userId) {
        synchronized (userId) {
            long nowTime = System.currentTimeMillis();
            Object tmp = MemcachedCRUD.getInstance().getObject(
                    CacheKeys.CACHE_FREQUENCY + key + userId);
            if (tmp == null) {
                MemcachedCRUD.getInstance().add(
                        CacheKeys.CACHE_FREQUENCY + key + userId, nowTime);
                return true;
            }
            long lastTime = (Long.valueOf(tmp.toString())).longValue();
            long during = nowTime - lastTime;
            if (during <= Constants.FREQUENCY_DURING) {
                logger.error("userID {} lasttime {}", userId,
                        new Date(lastTime).toLocaleString());
                logger.error("userID {} nowtime {}", userId,
                        new Date(nowTime).toLocaleString());
                logger.error("限制userID {} 频繁请求接口,间隔时间 {} ms 小于最小间隔时间 {} ms",
                        userId, during, Constants.FREQUENCY_DURING);
                return false;
            }
            MemcachedCRUD.getInstance().update(
                    CacheKeys.CACHE_FREQUENCY + key + userId, nowTime);
            return true;
        }
    }
    ```
刚开始的时候，我并没有锁定userId对象，于是很明显，并发问题依然存在，必须在玩家的每个请求进入时都锁定userId，才能彻底解决并发问题，然后在setHeros方法中加上这个方法的判断：
```java
if (!Router.getInstance().frequencyLimit("setHeros", data.getUserID())) {
            return;
}
```
这样，就能彻底解决这个并发问题。

游戏后台开发中，并发是很常见的问题，我们必须对所有的情况都考虑到，才不至于在真正出现问题时，才来寻找解决办法，在开发中，就要考虑到多种情况，尤其是并发情况
