---
title: Java游戏服务器成长之路——弱联网游戏篇（源码分析）
date: 2016-01-17 14:01
categories: Java
tags: [Java,弱联网,游戏服务器]
---
### 前言
前段时间由于公司的一款弱联网游戏急着上线，没能及时分享，现在基本做的差不多，剩下的就是测试阶段了（本来说元旦来分享一下服务器技术的）。公司的这款游戏已经上线一年多了，在我来之前一直都是单机版本，由于人民群众的力量太强大，各种内购破解，<!--more-->刷体力，刷金币，刷钻石版本的出现，公司才决定将这款游戏转型为弱联网游戏，压制百分之八十的破解用户（毕竟原则上还是属于单机游戏，不可能做到百分之百的防破解），招了我这一个服务器来进行后台的开发。什么是弱联网游戏？在这之前我也没有做过弱联网游戏的服务器，但是按照我对策划对我提出的需求的理解，就是游戏的大部分逻辑运算都是在移动端本地完成，而服务器要做的就是登录、支付验证、游戏存档读档的工作，这相对于我在上家公司做的ARPG那种强联网游戏要简单多了，那款ARPG就是所有游戏产出，逻辑运算都是在服务器端完成，服务器要完成大部分的游戏运算，而我做的这款弱联网游戏，只需要简简单单的登录、验证、读取和存储。这一类的游戏，做的最火的，就是腾讯早期手游中的《全民消消乐》《节奏大师》《天天飞车》（天天飞车后来加的实时竞赛应该还是强联网的实时数据）等，这类游戏中，服务器就只需要负责游戏数据存储和一些简单的社交功能，例如qq好友送红心送体力的等。
### 概括
公司招聘我进来做服务器开发其实是为了两个项目，一个是这款单机转弱联网的游戏，另一款是公司准备拿来发家致富的SLG——战争策略游戏。从入职到现在，我一直是在支持弱联网游戏的开发，到现在，基本上这款游戏也算是差不多了，这款游戏的目前版本仍然基本属于单机，到年后会加上竞技场功能，到时候可能就会需要实时的数据交互了，现在就先来分享一下目前这个版本开发的过程。
要开发一个后台系统，首先要考虑的就是架构了，系统的高效稳定性，可扩展性。在游戏开发中，我认为后台服务器无非负责几个大得模块：
1. 网络通信
2. 逻辑处理
3. 数据存储
4. 游戏安全

首先从需求分析入手，我在这款弱联网游戏中，后端需要做的事情就是，登录，支付验证，数据存储，数据读取，再加上一些简单的逻辑判断，第一眼看去，并没有任何难点，我就分别从以上几点一一介绍
###网络通信
弱联网游戏，基本上来说，最简单直接的，就是使用http短连接来进行网络层的通信，那么我又用什么来做http服务器呢，servlet还是springmvc，还是其他框架。因为之前做的ARPG用的一款nio框架——mina，然后对比servlet和springmvc的bio（实质上，springmvc只是层层封装servlet后的框架，它的本质原理还是servlet），个人还是觉得，作为需要处理大量高并发请求的业务需求来说，还是nio框架更适合，然而，我了解到netty又是比mina更好一点的框架，于是我选择了netty，然后自己写了demo测试，发现netty的处理性能确实是很可观的，netty是一个异步的，事件驱动的网络编程框架，使用netty可以快速开发出可维护的，高性能、高扩展能力的协议服务及其客户端应用。netty使用起来基本上就是傻瓜式的，它很好的封装了java的nio api。我也是刚刚接触这款网络通信框架，为此我还买了《Netty权威指南》，想系统的多了解下这款框架，以下几点，就是我使用netty作为网络层的理由：
  1. netty的通信机制就是它本身最大的优势，nio的通信机制无论是可靠性还是吞吐量都是优于bio的。
  2. netty使用自建的buffer API，而不是使用NIO的ByteBuffer来代表一个连续的字节序列。与ByteBuffer相比这种方式拥有明显的优势。netty使用新的buffer类型ChannelBuffer，ChannelBuffer被设计为一个可从底层解决ByteBuffer问题（netty的ByteBuf的使用跟C语言中使用对象一样，需要手动malloc和release，否则可能出现内存泄露，昨天遇到这个问题我都傻眼了，后来才知道，原来netty的ByteBuf是需要手动管理内存的，它不受java的gc机制影响，这点设定有点返璞归真的感觉！）。
  3. netty也提供了多种编码解码类，可以支持Google的Protobuffer，Facebook的Trift，JBoss的Marshalling以及MessagePack等编解码框架，我记得用mina的时候，当时看老大写的编解码的类，貌似是自己写protobuffer编解码工具的，mina并没有支持protobuffer。这些编解码框架的出现就是解决Java序列化后的一些缺陷。
  4. netty不仅能进行TCP/UDP开发，更是支持Http开发，netty的api中就有支持http开发的类，以及http请求响应的编解码工具，真的可谓是人性化，我使用的就是这些工具，除此之外，netty更是支持WebSocket协议的开发，还记得之前我自己试着写过mina的WebSocket通信，我得根据WebSocket的握手协议自己来写消息编解码机制，虽然最终也写出来了，但是当我听说netty的api本身就能支持WebSocket协议开发的时候，我得内心几乎是崩溃的，为什么当初不用netty呢？
  5. 另外，netty还有处理TCP粘包拆包的工具类！
  可能对于netty的理解还是太浅，不过以上几个优势就让我觉得，我可以使用这款框架。实时也证明，它确实很高效很稳定的。
  废话不多说，以下就贴出我使用netty作为Http通信的核心类：


```java
public class HttpServer {
 public static Logger log = LoggerFactory.getLogger(HttpServer.class);
 public static HttpServer inst;
 public static Properties p;
 public static int port;
 private NioEventLoopGroup bossGroup = new NioEventLoopGroup();
 private NioEventLoopGroup workGroup = new NioEventLoopGroup();
 public static ThreadPoolTaskExecutor handleTaskExecutor;// 处理消息线程池

 private HttpServer() {// 线程池初始化

 }

 /** 
 * @Title: initThreadPool 
 * @Description: 初始化线程池
 * void
 * @throws 
 */
 public void initThreadPool() {
  handleTaskExecutor = new ThreadPoolTaskExecutor();
  // 线程池所使用的缓冲队列
 handleTaskExecutor.setQueueCapacity(Integer.parseInt(p
    .getProperty("handleTaskQueueCapacity")));
  // 线程池维护线程的最少数量
  handleTaskExecutor.setCorePoolSize(Integer.parseInt(p
    .getProperty("handleTaskCorePoolSize")));
  // 线程池维护线程的最大数量
  handleTaskExecutor.setMaxPoolSize(Integer.parseInt(p
    .getProperty("handleTaskMaxPoolSize")));
  // 线程池维护线程所允许的空闲时间
  handleTaskExecutor.setKeepAliveSeconds(Integer.parseInt(p
    .getProperty("handleTaskKeepAliveSeconds")));
  handleTaskExecutor.initialize();
 }

 public static HttpServer getInstance() {
  if (inst == null) {
   inst = new HttpServer();
   inst.initData();
   inst.initThreadPool();
  }
  return inst;
 }

 public void initData() {
  try {
   p = readProperties();
   port = Integer.parseInt(p.getProperty("port"));
  } catch (IOException e) {
   log.error("socket配置文件读取错误");
   e.printStackTrace();
  }
 }

 public void start() {
  ServerBootstrap bootstrap = new ServerBootstrap();
  bootstrap.group(bossGroup, workGroup);
  bootstrap.channel(NioServerSocketChannel.class);
  bootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
   @Override
   protected void initChannel(SocketChannel ch) throws Exception {
    ChannelPipeline pipeline = ch.pipeline();
    pipeline.addLast("decoder", new HttpRequestDecoder());
    pipeline.addLast("aggregator", new HttpObjectAggregator(65536));
    pipeline.addLast("encoder", new HttpResponseEncoder());
    pipeline.addLast("http-chunked", new ChunkedWriteHandler());
    pipeline.addLast("handler", new HttpServerHandler());
   }
  });
  log.info("端口{}已绑定", port);
  bootstrap.bind(port);
 }

 public void shut() {
  workGroup.shutdownGracefully();
  workGroup.shutdownGracefully();
  log.info("端口{}已解绑", port);
 }

 /**
  * 读配置socket文件
  * 
  * @return
  * @throws IOException
  */
 protected Properties readProperties() throws IOException {
  Properties p = new Properties();
  InputStream in = HttpServer.class
    .getResourceAsStream("/net.properties");
  Reader r = new InputStreamReader(in, Charset.forName("UTF-8"));
  p.load(r);
  in.close();
  return p;
 }
}
```
网络层，除了网络通信，还有就是数据传输协议了，服务器跟客户端怎么通信，传什么，怎么传。跟前端商议最终还是穿json格式的数据，前面说到了netty的编解码工具的使用，下面贴出消息处理类：


```java
public class HttpServerHandlerImp {
 private static Logger log = LoggerFactory
   .getLogger(HttpServerHandlerImp.class);
 public static String DATA = "data";// 游戏数据接口
 public static String PAY = "pay";// 支付接口
 public static String TIME = "time";// 时间验证接口
 public static String AWARD = "award";// 奖励补偿接口
 public static volatile boolean ENCRIPT_DECRIPT = true;

 public void channelRead(final ChannelHandlerContext ctx, final Object msg)
   throws Exception {
  HttpServer.handleTaskExecutor.execute(new Runnable() {
   @Override
   public void run() {
    if (!GameServer.shutdown) {// 服务器开启的情况下
     DefaultFullHttpRequest req = (DefaultFullHttpRequest) msg;
     if (req.getMethod() == HttpMethod.GET) { // 处理get请求
     }
     if (req.getMethod() == HttpMethod.POST) { // 处理POST请求
      HttpPostRequestDecoder decoder = new HttpPostRequestDecoder(
        new DefaultHttpDataFactory(false), req);
      InterfaceHttpData postGameData = decoder
        .getBodyHttpData(DATA);
      InterfaceHttpData postPayData = decoder
        .getBodyHttpData(PAY);
      InterfaceHttpData postTimeData = decoder
        .getBodyHttpData(TIME);
      InterfaceHttpData postAwardData = decoder
        .getBodyHttpData(AWARD);
      try {
       if (postGameData != null) {// 存档回档
        String val = ((Attribute) postGameData)
          .getValue();
        val = postMsgFilter(val);
        Router.getInstance().route(val, ctx);
       } else if (postPayData != null) {// 支付
        String val = ((Attribute) postPayData)
          .getValue();
        val = postMsgFilter(val);
        Router.getInstance().queryPay(val, ctx);
       } else if (postTimeData != null) {// 时间
        String val = ((Attribute) postTimeData)
          .getValue();
        val = postMsgFilter(val);
        Router.getInstance().queryTime(val, ctx);
       } else if (postAwardData != null) {// 补偿
        String val = ((Attribute) postAwardData)
          .getValue();
        val = postMsgFilter(val);
        Router.getInstance().awardOperate(val, ctx);
       }
      } catch (Exception e) {
       e.printStackTrace();
      }
      return;
     }
    } else {// 服务器已关闭
     JSONObject jsonObject = new JSONObject();
     jsonObject.put("errMsg", "server closed");
     writeJSON(ctx, jsonObject);
    }
   }
  });
 }

 private String postMsgFilter(String val)
   throws UnsupportedEncodingException {
  val = val.contains("%") ? URLDecoder.decode(val, "UTF-8") : val;
  String valTmp = val;
  val = ENCRIPT_DECRIPT ? XXTeaCoder.decryptBase64StringToString(val,
    XXTeaCoder.key) : val;
  if (Constants.MSG_LOG_DEBUG) {
   if (val == null) {
    val = valTmp;
   }
   log.info("server received : {}", val);
  }
  return val;
 }

 public static void writeJSON(ChannelHandlerContext ctx,
   HttpResponseStatus status, Object msg) {
  String sentMsg = JsonUtils.objectToJson(msg);
  if (Constants.MSG_LOG_DEBUG) {
   log.info("server sent : {}", sentMsg);
  }
  sentMsg = ENCRIPT_DECRIPT ? XXTeaCoder.encryptToBase64String(sentMsg,
    XXTeaCoder.key) : sentMsg;
  writeJSON(ctx, status,
    Unpooled.copiedBuffer(sentMsg, CharsetUtil.UTF_8));
  ctx.flush();
 }

 public static void writeJSON(ChannelHandlerContext ctx, Object msg) {
  String sentMsg = JsonUtils.objectToJson(msg);
  if (Constants.MSG_LOG_DEBUG) {
   log.info("server sent : {}", sentMsg);
  }
  sentMsg = ENCRIPT_DECRIPT ? XXTeaCoder.encryptToBase64String(sentMsg,
    XXTeaCoder.key) : sentMsg;
  writeJSON(ctx, HttpResponseStatus.OK,
    Unpooled.copiedBuffer(sentMsg, CharsetUtil.UTF_8));
  ctx.flush();
 }

 private static void writeJSON(ChannelHandlerContext ctx,
   HttpResponseStatus status, ByteBuf content/* , boolean isKeepAlive */) {
  if (ctx.channel().isWritable()) {
   FullHttpResponse msg = null;
   if (content != null) {
    msg = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status,
      content);
    msg.headers().set(HttpHeaders.Names.CONTENT_TYPE,
      "application/json; charset=utf-8");
   } else {
    msg = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status);
   }
   if (msg.content() != null) {
    msg.headers().set(HttpHeaders.Names.CONTENT_LENGTH,
      msg.content().readableBytes());
   }
   // not keep-alive
   ctx.write(msg).addListener(ChannelFutureListener.CLOSE);
  }
 }

 public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
   throws Exception {
 }

 public void messageReceived(ChannelHandlerContext ctx, FullHttpRequest msg)
   throws Exception {

 }
}
```
以上代码，由于最后商议所有接口都通过post实现，所以get请求部分代码全都注释掉了。解析json数据使用的是gson解析，因为gson是可以直接解析为JavaBean的，这一点是非常爽的。工具类中代码如下：

```java
/** 
     * 将json转换成bean对象 
     * @author fuyzh 
     * @param jsonStr 
     * @return 
     */  
    public static Object jsonToBean(String jsonStr, Class<?> cl) {  
        Object obj = null;  
        if (gson != null) {  
            obj = gson.fromJson(jsonStr, cl);  
        }  
        return obj;  
    }  
 /** 
     * 将对象转换成json格式 
     * @author fuyzh
     * @param ts 
     * @return 
     */  
    public static String objectToJson(Object ts) {  
        String jsonStr = null;  
        if (gson != null) {  
            jsonStr = gson.toJson(ts);  
        }  
        return jsonStr;  
    }
```

### 逻辑处理
在这款弱联网游戏中，一个是登录逻辑，游戏有一个管理服务器，管理其他的逻辑服务器（考虑到下版本开竞技场会有分服选服），登录和支付都是在管理服务器造成的，其他接口才会通过管理服务器上获得的逻辑服务器IP去完成其他交互，在逻辑服务器上基本上也不会有什么逻辑处理，基本上是接到数据就进行解析，然后就进行存储或缓存。唯一有一点逻辑处理的就是，例如金币钻石减少到负数了，就把数据置零。逻辑上，netty接收到请求之后，就进入我的一个核心处理类，Router，由Router再将消息分发到各个功能模块。Router代码如下：


```java
/**
  * @Title: route
  * @Description: 路由分发
  * @param @param msg
  * @param @param ctx
  * @return void
  * @throws
  */
 public void route(String msg, ChannelHandlerContext ctx) {
  GameData data = null;
  try {
   data = (GameData) JsonUtils.jsonToBean(msg, GameData.class);
  } catch (Exception e) {
   logger.error("gameData的json格式错误,{}", msg);
   e.printStackTrace();
   HttpServerHandler.writeJSON(ctx, HttpResponseStatus.NOT_ACCEPTABLE,
     new BaseResp(1));
   return;
  }
  if (data.getUserID() == null) {
   logger.error("存放/回档错误，uid为空");
   HttpServerHandler.writeJSON(ctx, new BaseResp(1));
   return;
  }
  long junZhuId = data.getUserID() * 1000 + GameInit.serverId;
  /** 回档 **/
  if (JSONObject.fromObject(msg).keySet().size() == 1) {
   GameData ret = junZhuMgr.getMainInfo(junZhuId);
   ret.setTime(new Date().getTime());
   ret.setPay(getPaySum(data.getUserID()));
   HttpServerHandler.writeJSON(ctx, ret);
   return;
  }
  /** 存档 **/
  if (data.getDiamond() != null) {// 钻石
   if (!junZhuMgr.setDiamond(junZhuId, data)) {
    HttpServerHandler.writeJSON(ctx, new BaseResp(1));
    return;
   }
  }
  // 其他模块处理代码就省了
  JunZhu junZhu = HibernateUtil.find(JunZhu.class, junZhuId);
  HttpServerHandler.writeJSON(ctx, new BaseResp(junZhu.coin,
    junZhu.diamond, 0));
 }
```
GameData则是用于发送接收的消息Bean
### 数据存储
在这样的游戏中，逻辑运算基本由客户端操作了，因此游戏数据的持久化才是服务器的重点，必须要保证游戏的数据的完整性。数据库上，我选择了Mysql，事实上，我认为MongoDB更适合这类数据的存储，因为本身数据库就可以完全按照json格式原样存储到数据库中，但由于项目预期紧，我也不敢去尝试我没尝试过的方式，然而选择mysql，也不是什么坏事，mysql在游戏数据的处理也是相当给力，mongo虽好，却没有关系型数据库的事务管理。根据策划的需求，我将游戏数据分析完了之后，就基本理清了数据库表结构，在项目中我使用了Hibernate4作为ORM框架，相对于前面的版本，Hibernate4有一个很爽的功能，就是在JavaBean中添加一些注解，就能在构建Hibernate的session的时候，自动在数据库创建表，这样使得开发效率快了好几倍，Hibernate本身就已经够爽了，我认为至今没有什么ORM框架能跟它比，以前也用过MyBatis，个人感觉MyBatis更适合那种需要手动写很复杂的sql才用的，每一个查询都要写sql，在Hibernate中，简简单单几行代码，就能完成一个查询，一下贴出Hibernate工具类：


```java
public class HibernateUtil {
 public static boolean showMCHitLog = false;
 public static Logger log = LoggerFactory.getLogger(HibernateUtil.class);
 public static Map<Class<?>, String> beanKeyMap = new HashMap<Class<?>, String>();
 private static SessionFactory sessionFactory;

 public static void init() {
  sessionFactory = buildSessionFactory();
 }

 public static SessionFactory getSessionFactory() {
  return sessionFactory;
 }

 public static Throwable insert(Object o) {
  Session session = sessionFactory.getCurrentSession();
  session.beginTransaction();
  try {
   session.save(o);
   session.getTransaction().commit();
  } catch (Throwable e) {
   log.error("0要insert的数据{}", o == null ? "null" : JSONObject
     .fromObject(o).toString());
   log.error("0保存出错", e);
   session.getTransaction().rollback();
   return e;
  }
  return null;
 }

 /**
  * FIXME 不要这样返回异常，没人会关系返回的异常。
  * 
  * @param o
  * @return
  */
 public static Throwable save(Object o) {
  Session session = sessionFactory.getCurrentSession();
  Transaction t = session.beginTransaction();
  boolean mcOk = false;
  try {
   if (o instanceof MCSupport) {
    MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
    MC.update(o, s.getIdentifier());// MC中控制了哪些类存缓存。
    mcOk = true;
    session.update(o);
   } else {
    session.saveOrUpdate(o);
   }
   t.commit();
  } catch (Throwable e) {
   log.error("1要save的数据{},{}", o, o == null ? "null" : JSONObject
     .fromObject(o).toString());
   if (mcOk) {
    log.error("MC保存成功后报错，可能是数据库条目丢失。");
   }
   log.error("1保存出错", e);
   t.rollback();
   return e;
  }
  return null;
 }

 public static Throwable update(Object o) {
  Session session = sessionFactory.getCurrentSession();
  Transaction t = session.beginTransaction();
  try {
   if (o instanceof MCSupport) {
    MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
    MC.update(o, s.getIdentifier());// MC中控制了哪些类存缓存。
    session.update(o);
   } else {
    session.update(o);
   }
   t.commit();
  } catch (Throwable e) {
   log.error("1要update的数据{},{}", o, o == null ? "null" : JSONObject
     .fromObject(o).toString());
   log.error("1保存出错", e);
   t.rollback();
   return e;
  }
  return null;
 }
 public static <T> T find(Class<T> t, long id) {
  String keyField = getKeyField(t);
  if (keyField == null) {
   throw new RuntimeException("类型" + t + "没有标注主键");
  }
  if (!MC.cachedClass.contains(t)) {
   return find(t, "where " + keyField + "=" + id, false);
  }
  T ret = MC.get(t, id);
  if (ret == null) {
   if (showMCHitLog)
    log.info("MC未命中{}#{}", t.getSimpleName(), id);
   ret = find(t, "where " + keyField + "=" + id, false);
   if (ret != null) {
    if (showMCHitLog)
     log.info("DB命中{}#{}", t.getSimpleName(), id);
    MC.add(ret, id);
   } else {
    if (showMCHitLog)
     log.info("DB未命中{}#{}", t.getSimpleName(), id);
   }
  } else {
   if (showMCHitLog)
    log.info("MC命中{}#{}", t.getSimpleName(), id);
  }
  return ret;
 }

 public static <T> T find(Class<T> t, String where) {
  return find(t, where, true);
 }

 public static <T> T find(Class<T> t, String where, boolean checkMCControl) {
  if (checkMCControl && MC.cachedClass.contains(t)) {
   // 请使用static <T> T find(Class<T> t,long id)
   throw new BaseException("由MC控制的类不能直接查询DB:" + t);
  }
  Session session = sessionFactory.getCurrentSession();
  Transaction tr = session.beginTransaction();
  T ret = null;
  try {
   // FIXME 使用 session的get方法代替。
   String hql = "from " + t.getSimpleName() + " " + where;
   Query query = session.createQuery(hql);

   ret = (T) query.uniqueResult();
   tr.commit();
  } catch (Exception e) {
   tr.rollback();
   log.error("list fail for {} {}", t, where);
   log.error("list fail", e);
  }
  return ret;
 }

 /**
  * 通过指定key值来查询对应的对象
  * 
  * @param t
  * @param name
  * @param where
  * @return
  */
 public static <T> T findByName(Class<? extends MCSupport> t, String name,
   String where) {
  Class<? extends MCSupport> targetClz = t;// .getClass();
  String key = targetClz.getSimpleName() + ":" + name;
  Object id = MC.getValue(key);
  T ret = null;
  if (id != null) {
   log.info("id find in cache");
   ret = (T) find(targetClz, Long.parseLong((String) id));
   return ret;
  } else {
   ret = (T) find(targetClz, where, false);
  }
  if (ret == null) {
   log.info("no record {}, {}", key, where);
  } else {
   MCSupport mc = (MCSupport) ret;
   long mcId = mc.getIdentifier();
   log.info("found id from DB {}#{}", targetClz.getSimpleName(), mcId);
   MC.add(key, mcId);
   ret = (T) find(targetClz, mcId);
  }
  return ret;

 }

 /**
  * @param t
  * @param where
  *            例子： where uid>100
  * @return
  */
 public static <T> List<T> list(Class<T> t, String where) {
  Session session = sessionFactory.getCurrentSession();
  Transaction tr = session.beginTransaction();
  List<T> list = Collections.EMPTY_LIST;
  try {
   String hql = "from " + t.getSimpleName() + " " + where;
   Query query = session.createQuery(hql);

   list = query.list();
   tr.commit();
  } catch (Exception e) {
   tr.rollback();
   log.error("list fail for {} {}", t, where);
   log.error("list fail", e);
  }
  return list;
 }
 public static SessionFactory buildSessionFactory() {
  log.info("开始构建hibernate");
  String path = "classpath*:spring-conf/applicationContext.xml";
  ApplicationContext ac = new FileSystemXmlApplicationContext(path);
  sessionFactory = (SessionFactory) ac.getBean("sessionFactory");
  log.info("结束构建hibernate");
  return sessionFactory;
 }

 public static Throwable delete(Object o) {
  if (o == null) {
   return null;
  }
  Session session = sessionFactory.getCurrentSession();
  session.beginTransaction();
  try {
   if (o instanceof MCSupport) {
    MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
    MC.delete(o.getClass(), s.getIdentifier());// MC中控制了哪些类存缓存。
   }
   session.delete(o);
   session.getTransaction().commit();
  } catch (Throwable e) {
   log.error("要删除的数据{}", o);
   log.error("出错", e);
   session.getTransaction().rollback();
   return e;
  }
  return null;
 }
```
其中HibernateUtil中也用了SpyMemcached来做一些结果集的缓存，当然项目中也有其他地方用到了Memcache来做缓存。最开始的时候，我还纠结要不要把每个玩家的整个游戏数据（GameData）缓存起来，这样读起来会更快，但是我想了想，如果我把整个游戏数据缓存起来，那么每次存档，我都要把缓存中数据取出来，把要修改的那部分数据从数据库查询出来，再进行修改，再放回去，这样的话，每次存档就会多一次数据库操作，然而再想想，整个游戏中，读档只有进游戏的时候需要，而存档是随时都需要，权衡之下，还不如不做缓存，做了缓存反而需要更多数据库的操作。
 缓存部分代码如下：


```java
/**
 * 对SpyMemcached Client的二次封装,提供常用的Get/GetBulk/Set/Delete/Incr/Decr函数的同步与异步操作封装.
 * 
 * 未提供封装的函数可直接调用getClient()取出Spy的原版MemcachedClient来使用.
 * 
 * @author 何金成
 */
public class MemcachedCRUD implements DisposableBean {

 private static Logger logger = LoggerFactory.getLogger(MemcachedCRUD.class);
 private MemcachedClient memcachedClient;
 private long shutdownTimeout = 2500;
 private long updateTimeout = 2500;
 private static MemcachedCRUD inst;

 public static MemcachedCRUD getInstance() {
  if (inst == null) {
   inst = new MemcachedCRUD();
  }
  return inst;
 }

 // Test Code
 public static void main(String[] args) {
  MemcachedCRUD.getInstance().set("test", 0, "testVal");
  for (int i = 0; i < 100; i++) {
   new Thread(new Runnable() {

    @Override
    public void run() {
     try {
      Thread.sleep(1000);
     } catch (InterruptedException e) {
      e.printStackTrace();
     }
     String val = MemcachedCRUD.getInstance().get("test");
     Long a = MemcachedCRUD.getInstance().<Long> get("aaa");
     System.out.println(a);
     System.out.println(val);
    }
   }).start();
  }
 }

 private MemcachedCRUD() {
  String cacheServer = GameInit.cfg.get("cacheServer");
  if (cacheServer == null) {
   cacheServer = "localhost:11211";
  }
  // String cacheServer = "123.57.211.130:11211";
  String host = cacheServer.split(":")[0];
  int port = Integer.parseInt(cacheServer.split(":")[1]);
  List<InetSocketAddress> addrs = new ArrayList<InetSocketAddress>();
  addrs.add(new InetSocketAddress(host, port));
  try {
   ConnectionFactoryBuilder builder = new ConnectionFactoryBuilder();
   builder.setProtocol(Protocol.BINARY);
   builder.setOpTimeout(1000);
   builder.setDaemon(true);
   builder.setOpQueueMaxBlockTime(1000);
   builder.setMaxReconnectDelay(1000);
   builder.setTimeoutExceptionThreshold(1998);
   builder.setFailureMode(FailureMode.Retry);
   builder.setHashAlg(DefaultHashAlgorithm.KETAMA_HASH);
   builder.setLocatorType(Locator.CONSISTENT);
   builder.setUseNagleAlgorithm(false);
   memcachedClient = new MemcachedClient(builder.build(), addrs);
   logger.info("Memcached at {}:{}", host, port);
  } catch (IOException e) {
   e.printStackTrace();
  }
 }

 /**
  * Get方法, 转换结果类型并屏蔽异常, 仅返回Null.
  */
 public <T> T get(String key) {
  try {
   return (T) memcachedClient.get(key);
  } catch (RuntimeException e) {
   handleException(e, key);
   return null;
  }
 }
  /**
  * 异步Set方法, 不考虑执行结果.
  * 
  * @param expiredTime
  *            以秒过期时间，0表示没有延迟，如果exptime大于30天，Memcached将使用它作为UNIX时间戳过期
  */
 public void set(String key, int expiredTime, Object value) {
  memcachedClient.set(key, expiredTime, value);
 }

 /**
  * 安全的Set方法, 保证在updateTimeout秒内返回执行结果, 否则返回false并取消操作.
  * 
  * @param expiredTime
  *            以秒过期时间，0表示没有延迟，如果exptime大于30天，Memcached将使用它作为UNIX时间戳过期
  */
 public boolean safeSet(String key, int expiration, Object value) {
  Future<Boolean> future = memcachedClient.set(key, expiration, value);
  try {
   return future.get(updateTimeout, TimeUnit.MILLISECONDS);
  } catch (Exception e) {
   future.cancel(false);
  }
  return false;
 }

 /**
  * 异步 Delete方法, 不考虑执行结果.
  */
 public void delete(String key) {
  memcachedClient.delete(key);
 }

 /**
  * 安全的Delete方法, 保证在updateTimeout秒内返回执行结果, 否则返回false并取消操作.
  */
 public boolean safeDelete(String key) {
  Future<Boolean> future = memcachedClient.delete(key);
  try {
   return future.get(updateTimeout, TimeUnit.MILLISECONDS);
  } catch (Exception e) {
   future.cancel(false);
  }
  return false;
 }
}
```

### 游戏安全
首先是数据传输的安全问题：当我们完成了接口对接之后，就会考虑一个问题，当别人进行抓包之后，就能很轻松的知道服务器和客户端传输的数据格式，这样的话，不说服务器攻击，至少会有人利用这些接口做出一大批外挂，本身我们加上弱联网就是为了杜绝作弊现象，于是，我们对传输消息做了加密，先做XXTea加密，再做Base64加密，用约定好的秘钥，进行加密解密，进行消息收发。再一个就是支付验证的安全问题，现在有人能破解内购，就是利用支付之后断网，然后模拟返回结果为true，破解内购。我们做了支付验证，在完成支付之后，必须到后台查询订单状态，状态为完成才能获得购买的物品，支付我之前也是没有做过，一点点摸索的。代码就不贴了，涉及到业务。
### 总结
本文章只为了记录这款弱联网游戏的后台开发历程，可能之后还会遇到很多的问题，问题都是在摸索中解决的，我还需要了解更多关于netty性能方面知识。以上代码只是项目中的部分代码，并不涉及业务部分。分享出来也是给大家一个思路，或是直接拿去用，都是可以的，因为自己踩过一些坑，所以希望将这些记录下来，下次不能踩同样的坑。到目前为止，这款游戏也经过了大概半个多月的时间，到此作为记录，作为经验分享，欢迎交流探讨。我要参与的下一款游戏是长连接的SLG，到时候我应该还会面临更多的挑战，加油！
