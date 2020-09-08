---
title: Java游戏服务器成长之路——你好，Mongo
date: 2016-01-20 00:03
categories: Java
tags: [Java,Mongo,游戏服务器]
---
### 关于mongo的思考
第一阶段的弱联网游戏已基本完成，截至今天下午，测试也基本差不多了，前端还有一些小bug需要优化，接下来会接入小米，360，百度，腾讯等平台，然后推广一波，年前公司还能赚一笔，而我，也即将准备做下一款SLG。上一次，我第一次尝试了Netty，<!--more-->并且也着实感受到了Nio的魅力，Netty的魅力，在做的过程中也学到了很多有用的东西，这一次，在数据持久化方面，我思考了很久，我越发的觉得，我即将做的这款游戏的数据用nosql来存储更合适，甚至是之前做的那款弱联网游戏的存储，我也认为似乎应该使用nosql来做存储，因为游戏数据的扩展性太强了，也不需要传统关系型数据库那些复杂的约束，似乎是高性能的mongo更适合这类数据的存储，之前因为项目比较急，没敢在数据库这块做尝试，而这次，我准备尝试使用Mongo做数据层的持久化，以前做Web开发的时候，项目中用过Mongo，但是当时对它了解并不多，最多了解到它是一种文档型数据库，和传统数据库有较大区别，但我并没有太多的了解，而当我开始做游戏之后，却越来越觉得这种Nosql数据库似乎更加适合游戏数据存储的需求。最终我还是准备使用mongo来做数据持久化，然后开始了我的mongo之旅，心中不由说了一句——你好，mongo！
### 初识mongo
众多nosql数据库中，我为什么要用mongo呢？实际上，我还会用到memcache和redis，memcached用来做缓存，memcache的缓存性能相信大家也清楚，用它来配合mongo来做缓存再适合不过了，把玩家完整的游戏数据都放在缓存中，读取全部数据直接读取缓存（具体哪些数据缓存到时候看情况而定），而使用redis，主要是看中它多样的数据类型和数据本地化的功能，并且redis的性能也不必memcache差多少，而mongo，更是一种高性能的文档型数据库，不了解的同学可以去官网逛逛，mongo的官网地址：http://www.mongo.org Mongo主要特下如下：
1. 文档存储：首先就是存储方式——文档存储，这一特性某种程度上决定了mongo数据库的性能，mongo中得数据以bson形式存储（二进制的json），属性中可以再嵌套bson，非常灵活，对于一个层级式的数据结构来说，如果要将这样的数据使用扁平式的，表状的结构来保存数据，这无论是在查询还是获取数据时都十分困难。比如说一个玩家数据，有角色名，有性别，有等级，还有背包，背包中物品，物品还有属性，如果按照传统数据库的思维，可能会有一个玩家基础属性表，一个背包表，这样查询起来就要联合两张表进行查询，而在mongo中，这就是一条数据，一个玩家一条数据，直接一个玩家id，就包括了角色名，性别等，还包括了背包，背包中再嵌套一个bson来存储背包中得物品，物品再继续嵌套其属性，就这样，一个id就能查出这个玩家所有的数据，而且mongo的查询性能也是相当高效的。MongoDB javascript shell是一个基于javascript的解释器，在mongo中，你还可以使用js来操作mongo。
2. 可扩展性：这一点大概是最适合游戏开发中得特性之一，游戏数据是多变，可能今天玩家数据结构中要加一个属性，明天玩家数据结构中又要去掉一个属性，对于关系型数据库来说，面对千行数据，可能你就发愁了，而mongo不用担心，它可以很容易的横向扩展
3. 易于查询：这和第一点有很大关系，MongoDB以文档的形式存储数据，不支持事务和表连接。因此查询的编写、理解和优化都容易得多。简单查询设计思路不同于SQL模式，嵌入文档在特定的环境下可得到更好的查询。游戏后端处理是要求效率的，这一点点大大提升了mongo在游戏后端中可用性。
4. 安全性：由于MongoDB客户端生成的查询为BSON对象，而不是可以被解析的字符串，所以可降低受到SQL注入的攻击的危险。不同于常见的sql语句，普通的sql攻击自然对bson无效。

仅凭以上4点，我认为，像我做的这种数据类型复杂多变的游戏数据用mongo来存储再合适不过了。当然mongo还有更多的优点如复制和故障恢复，支持完全索引等。
### 了解API
mongo本身是由C++编写的，可它却也支持很多语言，当然，最重要的是，它有提供Java api，以下是mongo java api官方文档：http://api.mongodb.org/java/2.11.2/ 当然，既然有官方api，那就一定有人封装了更方便更好用的框架出来，像morphia，就是一款类似于关系型数据库ORM的Hibernate一样，方便易用，另外，spring也提供了mongo的封装，有兴趣的都可以去了解一下，毕竟每个人有自己的习惯，自己喜欢的才是最好的。使用官方提供的java api，操作mongo也是非常的方便，举例，比如以下保存对象的方法：
```java
          //第一：实例化mongo对象，连接mongodb服务器  包含所有的数据库  
          //默认构造方法，默认是连接本机，端口号，默认是27017  
          //相当于Mongo mongo =new Mongo("localhost",27017)  
          Mongo mongo =new Mongo();  
           
          //第二：连接具体的数据库  
          //其中参数是具体数据库的名称，若服务器中不存在，会自动创建  
          DB db=mongo.getDB("myMongo");  
           
          //第三：操作具体的表  
         //在mongodb中没有表的概念，而是指集合  
          //其中参数是数据库中表，若不存在，会自动创建  
          DBCollection collection=db.getCollection("user");  
           
          //添加操作  
          //在mongodb中没有行的概念，而是指文档  
          BasicDBObject document=new BasicDBObject();  
           
          document.put("id", 1);  
          document.put("name", "小明");  
          //然后保存到集合中  
          //collection.insert(document);  
   
          //当然我也可以保存这样的json串  
          /*  {  
               "id":1,  
               "name","小明",  
               "address":  
               {  
               "city":"beijing",  
               "code":"065000"  
               }  
          }*/  
          //实现上述json串思路如下：  
          //第一种：类似xml时，不断添加  
          BasicDBObject addressDocument=new BasicDBObject();  
          addressDocument.put("city", "beijing");  
          addressDocument.put("code", "065000");  
          document.put("address", addressDocument);  
          //然后保存数据库中  
          collection.insert(document);  
           
          //第二种：直接把json存到数据库中  
          /* String jsonTest="{'id':1,'name':'小明',"+  
                   "'address':{'city':'beijing','code':'065000'}"+  
                    "}";  
         DBObject dbobjct=(DBObject)JSON.parse(jsonTest);  
         collection.insert(dbobjct);*/  
```
其余方法我就不赘述了，想了解的可以查官方文档。
### 使用mongo
既然决定使用mongo，那就要着手开始写工具类，按照官方文档，我写了MongoUtil和DBObjectUtil两个工具类，MongoUtil负责数据库的连接和操作，DBObjectUtil则是Mongo中的操作对象DBObject与Javabean之间的相互转换。首先，我要在我的maven的pom.xml文件中依赖mongo的jar包
```xml
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongo-java-driver</artifactId>
  <version>2.11.2</version>
</dependency>
```
然后是我的MongoUtil类，其中简单做了数据库的连接管理，MC是Memcache缓存，这部分代码就不贴出来了，上篇文章已贴出过Memcache部分代码：
```java
/**
 * @ClassName: MongoUtil
 * @Description: mongo
 * @author 何金成
 * @date 2016年1月19日 下午3:35:25
 * 
 */
public class MongoUtil {

 private MongoClient mongo = null;
 private DB db = null;
 private static Logger logger = LoggerFactory.getLogger(MongoUtil.class);
 private static final Map<String, MongoUtil> instances = new ConcurrentHashMap<String, MongoUtil>();
 private static final String CONF_PATH = "/spring-mongodb/mongodb.properties";
 public static final String DB_ID = "id";// DB中id字段名

 /**
  * 实例化
  * 
  * @return MongoDBManager对象
  */
 static {
  getInstance("db");// 初始化默认的MongoDB数据库
 }

 public static MongoUtil getInstance() {
  return getInstance("db");// 配置文件默认数据库前缀为db
 }

 public static MongoUtil getInstance(String dbName) {
  MongoUtil mongoMgr = instances.get(dbName);
  if (mongoMgr == null) {
   mongoMgr = buildInstance(dbName);
   if (mongoMgr == null) {
    return null;
   }
   instances.put(dbName, mongoMgr);
  }
  return mongoMgr;
 }

 private static synchronized MongoUtil buildInstance(String dbName) {
  MongoUtil mongoMgr = new MongoUtil();
  try {
   mongoMgr.mongo = new MongoClient(getServerAddress(dbName),
     getMongoCredential(dbName), getDBOptions(dbName));
   mongoMgr.db = mongoMgr.mongo.getDB(getProperty(CONF_PATH, dbName
     + ".database"));
   logger.info("connect to MongoDB success!");
   boolean flag = mongoMgr.db.authenticate(
     getProperty(CONF_PATH, dbName + ".username"),
     getProperty(CONF_PATH, dbName + ".password").toCharArray());
   if (!flag) {
    logger.error("MongoDB auth failed");
    return null;
   }
  } catch (Exception e) {
   logger.info("Can't connect " + dbName + " MongoDB! {}", e);
   return null;
  }
  return mongoMgr;
 }

 /**
  * 根据properties文件的key获取value
  * 
  * @param filePath
  *            properties文件路径
  * @param key
  *            属性key
  * @return 属性value
  */
 private static String getProperty(String filePath, String key) {
  Properties props = new Properties();
  try {
   InputStream in = MongoUtil.class.getResourceAsStream(filePath);
   props.load(in);
   String value = props.getProperty(key);
   return value;
  } catch (Exception e) {
   logger.info("load mongo properties exception {}", e);
   System.exit(0);
   return null;
  }
 }

 /**
  * 获取集合（表）
  * 
  * @param collection
  */
 public DBCollection getCollection(String collection) {
  DBCollection collect = db.getCollection(collection);
  return collect;
 }

 /**
  * 插入
  * 
  * @param collection
  * @param o
  */
 public void insert(String collection, DBObject o) {
  getCollection(collection).insert(o);
  // 添加到MC控制
  MC.add(o, o.get(DB_ID));
 }

 /**
  * 批量插入
  * 
  * @param collection
  * @param list
  */
 public void insertBatch(String collection, List<DBObject> list) {
  if (list == null || list.isEmpty()) {
   return;
  }
  getCollection(collection).insert(list);
  // 批量插入MC
  for (DBObject o : list) {
   MC.add(o, o.get(DB_ID));
  }
 }

 /**
  * 删除
  * 
  * @param collection
  * @param q
  *            查询条件
  */
 public List<DBObject> delete(String collection, DBObject q) {
  getCollection(collection).remove(q);
  List<DBObject> list = find(collection, q);
  // MC中删除
  for (DBObject tmp : list) {
   DBObject dbObject = MC.<DBObject> get(DBObject.class,
     (Long) tmp.get(DB_ID));
   if (null != dbObject) {
    MC.delete(DBObject.class, (Long) dbObject.get(DB_ID));
   }
  }
  return list;
 }

 /**
  * 批量删除
  * 
  * @param collection
  * @param list
  *            删除条件列表
  */
 public void deleteBatch(String collection, List<DBObject> list) {
  if (list == null || list.isEmpty()) {
   return;
  }
  for (int i = 0; i < list.size(); i++) {
   // 批量条件删除
   delete(collection, list.get(i));
  }
 }

 /**
  * 计算集合总条数
  * 
  * @param collection
  */
 public int getCount(String collection) {
  int count = (int) getCollection(collection).find().count();
  return count;
 }

 /**
  * 计算满足条件条数
  * 
  * @param collection
  * @param q
  *            查询条件
  */

 public long getCount(String collection, DBObject q) {
  return getCollection(collection).getCount(q);
 }

 /**
  * 更新
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param setFields
  *            更新对象
  * @return List<DBObject> 更新后的对象列表
  */
 public List<DBObject> update(String collection, DBObject q,
   DBObject setFields) {
  getCollection(collection).updateMulti(q,
    new BasicDBObject("$set", setFields));
  List<DBObject> list = find(collection, q);
  // 遍历
  for (DBObject dbObject : list) {
   // MC 中修改
   DBObject tmp = MC.<DBObject> get(DBObject.class,
     (Long) dbObject.get(DB_ID));
   if (null != tmp) {
    MC.update(dbObject, (Long) tmp.get(DB_ID));
   }
  }
  return list;
 }

 /**
  * 查找集合所有对象
  * 
  * @param collection
  */
 public List<DBObject> findAll(String collection) {
  List<DBObject> list = getCollection(collection).find().toArray();
  return list;
 }

 /**
  * 按顺序查找集合所有对象
  * 
  * @param collection
  *            数据集
  * @param orderBy
  *            排序
  */
 public List<DBObject> findAll(String collection, DBObject orderBy) {
  return getCollection(collection).find().sort(orderBy).toArray();
 }

 /**
  * 查找（返回一个对象）
  * 
  * @param collection
  * @param q
  *            查询条件
  */
 public DBObject findOne(String collection, DBObject q) {
  return findOne(collection, q, null);
 }

 /**
  * 查找（返回一个对象）
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param fileds
  *            返回字段
  */
 public DBObject findOne(String collection, DBObject q, DBObject fields) {
  if (q.containsField(DB_ID)) {// 如果根据id来查询,先从缓存取数据
   DBObject tmp = MC.<DBObject> get(DBObject.class,
     (Long) q.get(DB_ID));
   if (tmp != null) {// 缓存没有数据，从数据库取
    if (fields != null) {// 留下需要返回的字段
     for (String key : tmp.keySet()) {
      if (!fields.containsField(key)) {
       tmp.removeField(key);
      }
     }
    }
    return tmp;
   }
  }
  return fields == null ? getCollection(collection).findOne(q)
    : getCollection(collection).findOne(q, fields);
 }

 /**
  * 查找返回特定字段（返回一个List<DBObject>）
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param fileds
  *            返回字段
  */
 public List<DBObject> findLess(String collection, DBObject q,
   DBObject fileds) {
  DBCursor c = getCollection(collection).find(q, fileds);
  if (c != null)
   return c.toArray();
  else
   return null;
 }

 /**
  * 查找返回特定字段（返回一个List<DBObject>）
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param fileds
  *            返回字段
  * @param orderBy
  *            排序
  */
 public List<DBObject> findLess(String collection, DBObject q,
   DBObject fileds, DBObject orderBy) {
  DBCursor c = getCollection(collection).find(q, fileds).sort(orderBy);
  if (c != null)
   return c.toArray();
  else
   return null;
 }

 /**
  * 分页查找集合对象，返回特定字段
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param fileds
  *            返回字段
  * @pageNo 第n页
  * @perPageCount 每页记录数
  */
 public List<DBObject> findLess(String collection, DBObject q,
   DBObject fileds, int pageNo, int perPageCount) {
  return getCollection(collection).find(q, fileds)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * 按顺序分页查找集合对象，返回特定字段
  * 
  * @param collection
  *            集合
  * @param q
  *            查询条件
  * @param fileds
  *            返回字段
  * @param orderBy
  *            排序
  * @param pageNo
  *            第n页
  * @param perPageCount
  *            每页记录数
  */
 public List<DBObject> findLess(String collection, DBObject q,
   DBObject fileds, DBObject orderBy, int pageNo, int perPageCount) {
  return getCollection(collection).find(q, fileds).sort(orderBy)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * 查找（返回一个List<DBObject>）
  * 
  * @param collection
  * @param q
  *            查询条件
  */
 public List<DBObject> find(String collection, DBObject q) {
  DBCursor c = getCollection(collection).find(q);
  if (c != null)
   return c.toArray();
  else
   return null;
 }

 /**
  * 按顺序查找（返回一个List<DBObject>）
  * 
  * @param collection
  * @param q
  *            查询条件
  * @param orderBy
  *            排序
  */
 public List<DBObject> find(String collection, DBObject q, DBObject orderBy) {
  DBCursor c = getCollection(collection).find(q).sort(orderBy);
  if (c != null)
   return c.toArray();
  else
   return null;
 }

 /**
  * 分页查找集合对象
  * 
  * @param collection
  * @param q
  *            查询条件
  * @pageNo 第n页
  * @perPageCount 每页记录数
  */
 public List<DBObject> find(String collection, DBObject q, int pageNo,
   int perPageCount) {
  return getCollection(collection).find(q)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * 按顺序分页查找集合对象
  * 
  * @param collection
  *            集合
  * @param q
  *            查询条件
  * @param orderBy
  *            排序
  * @param pageNo
  *            第n页
  * @param perPageCount
  *            每页记录数
  */
 public List<DBObject> find(String collection, DBObject q, DBObject orderBy,
   int pageNo, int perPageCount) {
  return getCollection(collection).find(q).sort(orderBy)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * distinct操作
  * 
  * @param collection
  *            集合
  * @param field
  *            distinct字段名称
  */
 public Object[] distinct(String collection, String field) {
  return getCollection(collection).distinct(field).toArray();
 }

 /**
  * distinct操作
  * 
  * @param collection
  *            集合
  * @param field
  *            distinct字段名称
  * @param q
  *            查询条件
  */
 public Object[] distinct(String collection, String field, DBObject q) {
  return getCollection(collection).distinct(field, q).toArray();
 }

 /**
  * group分组查询操作，返回结果少于10,000keys时可以使用
  * 
  * @param collection
  *            集合
  * @param key
  *            分组查询字段
  * @param q
  *            查询条件
  * @param reduce
  *            reduce Javascript函数，如：function(obj,
  *            out){out.count++;out.csum=obj.c;}
  * @param finalize
  *            reduce
  *            function返回结果处理Javascript函数，如：function(out){out.avg=out.csum
  *            /out.count;}
  */
 public BasicDBList group(String collection, DBObject key, DBObject q,
   DBObject initial, String reduce, String finalize) {
  return ((BasicDBList) getCollection(collection).group(key, q, initial,
    reduce, finalize));
 }

 /**
  * group分组查询操作，返回结果大于10,000keys时可以使用
  * 
  * @param collection
  *            集合
  * @param map
  *            映射javascript函数字符串，如：function(){ for(var key in this) {
  *            emit(key,{count:1}) } }
  * @param reduce
  *            reduce Javascript函数字符串，如：function(key,emits){ total=0; for(var
  *            i in emits){ total+=emits[i].count; } return {count:total}; }
  * @param q
  *            分组查询条件
  * @param orderBy
  *            分组查询排序
  */
 public Iterable<DBObject> mapReduce(String collection, String map,
   String reduce, DBObject q, DBObject orderBy) {
  // DBCollection coll = db.getCollection(collection);
  // MapReduceCommand cmd = new MapReduceCommand(coll, map, reduce, null,
  // MapReduceCommand.OutputType.INLINE, q);
  // return coll.mapReduce(cmd).results();
  MapReduceOutput out = getCollection(collection).mapReduce(map, reduce,
    null, q);
  return out.getOutputCollection().find().sort(orderBy).toArray();
 }

 /**
  * group分组分页查询操作，返回结果大于10,000keys时可以使用
  * 
  * @param collection
  *            集合
  * @param map
  *            映射javascript函数字符串，如：function(){ for(var key in this) {
  *            emit(key,{count:1}) } }
  * @param reduce
  *            reduce Javascript函数字符串，如：function(key,emits){ total=0; for(var
  *            i in emits){ total+=emits[i].count; } return {count:total}; }
  * @param q
  *            分组查询条件
  * @param orderBy
  *            分组查询排序
  * @param pageNo
  *            第n页
  * @param perPageCount
  *            每页记录数
  */
 public List<DBObject> mapReduce(String collection, String map,
   String reduce, DBObject q, DBObject orderBy, int pageNo,
   int perPageCount) {
  MapReduceOutput out = getCollection(collection).mapReduce(map, reduce,
    null, q);
  return out.getOutputCollection().find().sort(orderBy)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * group分组查询操作，返回结果大于10,000keys时可以使用
  * 
  * @param collection
  *            集合
  * @param map
  *            映射javascript函数字符串，如：function(){ for(var key in this) {
  *            emit(key,{count:1}) } }
  * @param reduce
  *            reduce Javascript函数字符串，如：function(key,emits){ total=0; for(var
  *            i in emits){ total+=emits[i].count; } return {count:total}; }
  * @param outputCollectionName
  *            输出结果表名称
  * @param q
  *            分组查询条件
  * @param orderBy
  *            分组查询排序
  */
 public List<DBObject> mapReduce(String collection, String map,
   String reduce, String outputCollectionName, DBObject q,
   DBObject orderBy) {
  if (!db.collectionExists(outputCollectionName)) {
   getCollection(collection).mapReduce(map, reduce,
     outputCollectionName, q);
  }
  return getCollection(outputCollectionName)
    .find(null, new BasicDBObject("_id", false)).sort(orderBy)
    .toArray();
 }

 /**
  * group分组分页查询操作，返回结果大于10,000keys时可以使用
  * 
  * @param collection
  *            集合
  * @param map
  *            映射javascript函数字符串，如：function(){ for(var key in this) {
  *            emit(key,{count:1}) } }
  * @param reduce
  *            reduce Javascript函数字符串，如：function(key,emits){ total=0; for(var
  *            i in emits){ total+=emits[i].count; } return {count:total}; }
  * @param outputCollectionName
  *            输出结果表名称
  * @param q
  *            分组查询条件
  * @param orderBy
  *            分组查询排序
  * @param pageNo
  *            第n页
  * @param perPageCount
  *            每页记录数
  */
 public List<DBObject> mapReduce(String collection, String map,
   String reduce, String outputCollectionName, DBObject q,
   DBObject orderBy, int pageNo, int perPageCount) {
  if (!db.collectionExists(outputCollectionName)) {
   getCollection(collection).mapReduce(map, reduce,
     outputCollectionName, q);
  }
  return getCollection(outputCollectionName)
    .find(null, new BasicDBObject("_id", false)).sort(orderBy)
    .skip((pageNo - 1) * perPageCount).limit(perPageCount)
    .toArray();
 }

 /**
  * @Title: getServerAddress
  * @Description: 获取数据库服务器列表
  * @param dbName
  * @return
  * @throws UnknownHostException
  * @return List<ServerAddress>
  * @throws
  */
 private static List<ServerAddress> getServerAddress(String dbName)
   throws UnknownHostException {
  List<ServerAddress> list = new ArrayList<ServerAddress>();
  String hosts = getProperty(CONF_PATH, dbName + ".host");
  for (String host : hosts.split("&")) {
   String ip = host.split(":")[0];
   String port = host.split(":")[1];
   list.add(new ServerAddress(ip, Integer.parseInt(port)));
  }
  return list;
 }

 /**
  * @Title: getMongoCredential
  * @Description: 获取数据库安全验证信息
  * @param dbName
  * @return
  * @return List<MongoCredential>
  * @throws
  */
 private static List<MongoCredential> getMongoCredential(String dbName) {
  String username = getProperty(CONF_PATH, dbName + ".username");
  String password = getProperty(CONF_PATH, dbName + ".password");
  String database = getProperty(CONF_PATH, dbName + ".database");
  MongoCredential credentials = MongoCredential.createMongoCRCredential(
    username, database, password.toCharArray());
  List<MongoCredential> credentialsList = new ArrayList<MongoCredential>();
  credentialsList.add(credentials);
  return credentialsList;
 }

 /**
  * @Title: getDBOptions
  * @Description: 获取数据参数设置
  * @return
  * @return MongoClientOptions
  * @throws
  */
 private static MongoClientOptions getDBOptions(String dbName) {
  MongoClientOptions.Builder build = new MongoClientOptions.Builder();
  build.connectionsPerHost(Integer.parseInt(getProperty(CONF_PATH, dbName
    + ".connectionsPerHost"))); // 与目标数据库能够建立的最大connection数量为50
  build.threadsAllowedToBlockForConnectionMultiplier(Integer
    .parseInt(getProperty(CONF_PATH, dbName
      + ".threadsAllowedToBlockForConnectionMultiplier"))); // 如果当前所有的connection都在使用中，则每个connection上可以有50个线程排队等待
  build.maxWaitTime(Integer.parseInt(getProperty(CONF_PATH, dbName
    + ".maxWaitTime")));
  build.connectTimeout(Integer.parseInt(getProperty(CONF_PATH, dbName
    + ".connectTimeout")));
  MongoClientOptions myOptions = build.build();
  return myOptions;
 }

 public static void main(String[] args) {
  try {
   // getInstance().insert(
   // "user",
   // new BasicDBObject().append("name", "admin3")
   // .append("type", "2").append("score", 70)
   // .append("level", 2)
   // .append("inputTime", new Date().getTime()));
   // getInstance().update("user",
   // new BasicDBObject().append("status", 1),
   // new BasicDBObject().append("status", 2));
   // === group start =============
   // StringBuilder sb = new StringBuilder(100);
   // sb.append("function(obj, out){out.count++;out.").append("scoreSum")
   // .append("+=obj.").append("score").append(";out.")
   // .append("levelSum").append("+=obj.").append("level")
   // .append('}');
   // String reduce = sb.toString();
   // BasicDBList list = getInstance().group(
   // "user",
   // new BasicDBObject("type", true),
   // new BasicDBObject(),
   // new BasicDBObject().append("count", 0)
   // .append("scoreSum", 0).append("levelSum", 0)
   // .append("levelAvg", (Double) 0.0), reduce,
   // "function(out){ out.levelAvg = out.levelSum / out.count }");
   // for (Object o : list) {
   // DBObject obj = (DBObject) o;
   // System.out.println(obj);
   // }
   // ======= group end=========
   // === mapreduce start =============
   // Iterable<DBObject> list2 = getInstance()
   // .mapReduce(
   // "user",
   // "function(){emit( {type:this.type}, {score:this.score, level:this.level} );}",
   // "function(key,values){var result={score:0,level:0};var count = 0;values.forEach(function(value){result.score += value.score;result.level += value.level;count++});result.level = result.level / count;return result;}",
   // new BasicDBObject(), new BasicDBObject("score", 1));
   // for (DBObject o : list2) {
   // System.out.println(o);
   // }

   // List<DBObject> list3 = getInstance().mapReduce("user",
   // "function(){emit({type:this.type},{type:this.type,score:this.score,level:this.level});}",
   // "function(key,values){var result={type:key.type,score:0,level:0};var count=0;values.forEach(function(value){result.score+=value.score;result.level+=value.level;count++});result.level=result.level/count;return result;}",
   // "group_temp_user",
   // new BasicDBObject(),
   // new BasicDBObject("score",1));
   // for (DBObject o : list3) {
   // System.out.println(o);
   // }
   // ======= mapreduce end=========
   // System.out.print(getInstance().findAll("user"));
   // System.out.print(getInstance().find(
   // "user",
   // new BasicDBObject("inputTime", new BasicDBObject("$gt",
   // 1348020002890L)),
   // new BasicDBObject().append("_id", "-1"), 1, 2));
   // getInstance().delete("user", new BasicDBObject());
  } catch (Exception e) {
   System.out.println(e.getMessage());
  }
 }
}
```
以下是mongo的连接配置properties文件
```properties
#ip和端口，多个主机用&相连
db.host=127.0.0.1:27017
#数据库名字
db.database=war
#用户名
db.username=root
#密码
db.password=123456
#每个主机的最大连接数
db.connectionsPerHost=50
#线程允许最大等待连接数
db.threadsAllowedToBlockForConnectionMultiplier=50
#连接超时时间1分钟
db.connectTimeout=60000
#一个线程访问数据库的时候，在成功获取到一个可用数据库连接之前的最长等待时间为2分钟
#这里比较危险，如果超过maxWaitTime都没有获取到这个连接的话，该线程就会抛出Exception
#故这里设置的maxWaitTime应该足够大，以免由于排队线程过多造成的数据库访问失败
db.maxWaitTime=120000
```
DBObject和Javabean之间的转换就容易多了，可以通过json为中介来转换。
```java
public class DBObjectUtil {

 /**
  * 把实体bean对象转换成DBObject
  * 
  * @param bean
  * @return
  * @throws IllegalArgumentException
  * @throws IllegalAccessException
  */
 public static <T> DBObject bean2DBObject(T bean) {
  if (bean == null) {
   return null;
  }
  DBObject dbObject = new BasicDBObject();
  String json = JsonUtils.objectToJson(bean);
  dbObject = (DBObject) JSON.parse(json);
  return dbObject;
 }

 /**
  * 把DBObject转换成bean对象
  * 
  * @param dbObject
  * @param bean
  * @return
  * @throws IllegalAccessException
  * @throws InvocationTargetException
  * @throws NoSuchMethodException
  */
 @SuppressWarnings("unchecked")
 public static <T> T dbObject2Bean(DBObject dbObject, T bean) {
  if (bean == null) {
   return null;
  }
  String json = JSON.serialize(dbObject);
  bean = (T) JsonUtils.jsonToBean(json, bean.getClass());
  return bean;
 }
}
```
至此，mongo搭建基本完成，更多关于mongo的探索，还是要在实践中完成，实践是检验真理的唯一标准，nosql如今炙手可热，但我们也要保持理性的态度看待问题，传统数据库和nosql究竟谁更胜一筹，不妨我们都动手试一试，是骡子是马，都拉出来溜溜！以上代码可直接用过工具类，欢迎交流探讨！
