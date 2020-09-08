---
title: SLG手游Java服务器的设计与开发——网络通信
date: 2016-08-27 19:01
categories: Java
tags: [Java,游戏服务器,SLG]
---
- `文章版权归腾讯GAD所有，禁止匿名转载；禁止商业使用；禁止个人使用。`

## 前言
上文分析了我们这款SLG的架构，本章着重讲解我们的网络通信架构，由上文的功能分析我们可以得知，游戏的所有功能基本上属于非及时的通信机制，所以依靠HTTP短连接就能够基本满足游戏的通信需求。
<!--more-->
当然，我们先撇开国战部分不说，因为国战部分我们正在优化开发最新版本，之前我们做的版本是想通过异步战斗的机制达到实时战斗效果，通过使用HTTP的请求机制，加上前端画面表现，让玩家感觉到即时战斗的感觉，既能在地图上能看到其他玩家的行进队列，又能进入城池多国混战。可惜的是，让异步战斗来实现实时战斗的效果，会产生很多问题，最终因为机制的问题而商议出必须优化一版再上线。所以目前所有的功能均通过HTTP实现，如果后期国战需要使用TCP长连接可以单独对国战部分使用TCP长连接实现。
## 通信框架
### 使用Netty
在开始设计通信机制时，就需要选择合适的通信框架，当然，我们也可以自己动手写底层通信的实现，不过在前人已有成熟框架的情况下，我们大而不必重复造轮子，由于在通信方面，我们并没有太多的个性化需求，因此基本上成熟的通信框架都能满足目前所需。选择框架，无非就是看它们的底层架构是否符合需求、资料是否齐全、API文档是否详细、以及成熟案例有多少。上文提到，可以使用HTTP通信协议的框架中，有Servlet、Spring、Struts、Mina和Netty等常见的通信框架，在这其中我选择了Netty，Servlet、Spring和Struts属于同一系列，他们的底层都是Servlet的实现，在Servlet3.0以前均是BIO通信模式，而Mina和Netty均属于基于Java NIO的通信框架，由于通信机制的不同，基于NIO的通信程序比基于BIO的通信程序能承受更多的并发连接，而在后者的框架选择中，其实并没有太多的谁好与不好，Mina和Netty底层都是Java NIO的封装，并且两者的底层框架也是大致一样（其作者其实就是一个人），选择Netty更多的是因为Netty的有更多的资料可查，遇到问题可能会更容易解决，并且我个人在同时使用过Mina和Netty的情况下，认为Netty的API更友好，使用起来更方便（个人感觉哈）。综合种种原因，我选择了Netty作为我的底层通信框架。
### Netty的特点
选择了Netty，我们就应该明白Netty的一些特点，Netty具有以下特点：
1.异步、非阻塞、基于事件驱动的NIO框架
2.支持多种传输层通信协议，包括TCP、UDP等
3.开发异步HTTP服务端和客户端应用程序
4.提供对多种应用层协议的支持，包括TCP私有协议、HTTP协议、WebSocket协议、文件传输等
5.默认提供多种编解码能力，包括Java序列化、Google的ProtoBuf、二进制编解码、Jboss marshalling、文本字符串、base64、简单XML等，这些编解码框架可以被用户直接使用
6.提供形式多样的编解码基础类库，可以非常方便的实现私有协议栈编解码框架的二次定制和开发
7.经典的ChannelFuture-listener机制，所有的异步IO操作都可以设置listener进行监听和获取操作结果
8.基于ChannelPipeline-ChannelHandler的责任链模式，可以方便的自定义业务拦截器用于业务逻辑定制
9.安全性：支持SSL、HTTPS
10.可靠性：流量整形、读写超时控制机制、缓冲区最大容量限制、资源的优雅释放等
11.简洁的API和启动辅助类，简化开发难度，减少代码量
### NIO
Netty是基于NIO的通信框架，为什么要使用NIO而不是用传统的BIO通信机制呢，因为在BIO的线程模型上，存在着致命缺陷，由于线程模型问题，接入用户数与服务端创造线程数是1:1的关系，也就是说每一个用户从接入断开连接，服务端都要创造一个与之对应的线程做处理，一旦并发用户数增多，再好配置的服务器也有可能会有因为线程开销问题造成服务器崩溃宕机的情况。除此之外，BIO的所有IO操作都是同步的，当IO线程处理业务逻辑时，也会出现同步阻塞，其他请求都要进入阻塞状态。
相反，NIO的通信机制可以很好地解决BIO的线程开销问题，NIO采用Reactor通信模式，一个Reactor线程聚合一个多路复用Selector，这个Selector可同时注册、监听、轮回上百个Channel请求，这种情况下，一个IO线程就可以处理N个客户端的同时接入，接入用户数与线程数为N:1的关系，并且IO总数有限，不会出现频繁上下文切换，提高了CPU利用率，并且所有的 IO 操作都是异步的，即使业务线程直接进行IO操作，也不会被同步阻塞，系统不再依赖外部的网络环境和外部应用程序的处理性能
### Netty架构
Netty采用经典的MVC三层架构：
1.第一层：Reactor通信调度层，它由一系列辅助类组成，包括Reactor线程NioEventLoop 以及其父类、NioSocketChannel/NioServerSocketChannel 以及其父类、ByteBuffer 以及由其衍生出来的各种 Buffer、Unsafe 以及其衍生出的各种内部子类等。
2.第二层：职责链ChannelPipeLine，它负责调度事件在职责链中的传播，支持动态的编排职责链，职责链可以选择性的拦截自己关心的事件，对于其它IO操作和事件忽略，Handler同时支持inbound和outbound事件
3.第三层：业务逻辑编排层，业务逻辑编排层通常有两类：一类是纯粹的业务逻辑编排，还有一类是应用层协议插件，用于协议相关的编解码和链路管理，例如CMPP协议插件
## 基于Netty实现的HTTP Server
Netty其实更适合使用创建TCP长连接的Server，但是其也提供了HTTP的实现封装，我们也可以很容易的实现基于Netty的HTTP服务器。Netty实现HTTP服务器主要通过HttpResponseEncoder和HttpRequestDecoder来进行HTTP请求的解码以及HTTP响应的编码，通过HttpRequest和HttpResponse接口来实现对请求的解析以及对响应的构造。本节先描述整个处理流程，然后通过源码进行分享。
### 处理流程
使用Netty实现的HTTP Server的处理流程如下：
1.HttpServer接收到客户端的HttpRequest，打开Channel连接
2.pipeline中的HttpInHandler调用channelRead方法读取Channel中的ChannelHandlerContext和Object
3.channelRead中调用实现类HttpInHandlerImp中的处理，将请求按照Get或Post方式进行解析，并将数据转为ProtoMessage，然后转交给MsgHandler处理
4.MsgHandler将其封装为Message类添加到userid哈希的消息处理队列中，并对队列中的消息调用handle进行游戏的逻辑处理
5.在逻辑处理中，调用HttpInHandler的writeJSON方法构造并返回HttpResponse响应消息
6.HttpOutHandler截取消息并打印log日志
7.HttpResponse响应消息返回给客户端并断开Channel连接
整个流程的流程图如下：
![网络处理流程](http://7xnnwn.com1.z0.glb.clouddn.com/%E7%BD%91%E7%BB%9C%E6%B5%81%E7%A8%8B.png)
### HttpServer
HttpServer中负责创造并启动Netty实例，并绑定我们的逻辑Handler到pipeline，使请求进入我们自己的逻辑处理
```java
package com.kidbear._36.net.http;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpRequestDecoder;
import io.netty.handler.codec.http.HttpResponseEncoder;
import io.netty.handler.stream.ChunkedWriteHandler;
import io.netty.util.concurrent.DefaultThreadFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.Properties;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpServer {
    public static Logger log = LoggerFactory.getLogger(HttpServer.class);
    public static HttpServer inst;
    public static Properties p;
    public static String ip;
    public static int port;
    private NioEventLoopGroup bossGroup = null;
    private NioEventLoopGroup workGroup = null;

    private HttpServer() {

    }

    public static HttpServer getInstance() {
        if (inst == null) {
            inst = new HttpServer();
            inst.initData();
        }
        return inst;
    }

    public void initData() {
        try {
            p = readProperties();
            ip = p.getProperty("ip");
            port = Integer.parseInt(p.getProperty("port"));
        } catch (IOException e) {
            log.error("socket配置文件读取错误");
            e.printStackTrace();
        }
    }

    public void start() {
        bossGroup = new NioEventLoopGroup(0, Executors.newCachedThreadPool());// boss线程组
        workGroup = new NioEventLoopGroup(0, Executors.newCachedThreadPool());// work线程组
        ServerBootstrap bootstrap = new ServerBootstrap();
        bootstrap.group(bossGroup, workGroup);
        bootstrap.channel(NioServerSocketChannel.class);
        bootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
            @Override
            protected void initChannel(SocketChannel ch) throws Exception {
                ChannelPipeline pipeline = ch.pipeline();
                /* http request解码 */
                pipeline.addLast("decoder", new HttpRequestDecoder());
                pipeline.addLast("aggregator", new HttpObjectAggregator(65536));
                /* http response 编码 */
                pipeline.addLast("encoder", new HttpResponseEncoder());
                pipeline.addLast("http-chunked", new ChunkedWriteHandler());
                /* http response handler */
                pipeline.addLast("outbound", new HttpOutHandler());
                /* http request handler */
                pipeline.addLast("inbound", new HttpInHandler());
            }
        });
        bootstrap.bind(port);
        log.info("端口{}已绑定", port);
    }

    public void shut() {
        if (bossGroup != null && workGroup != null) {
            bossGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }
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
代码中首先使用NioEventLoopGroup构造boss线程和work线程，然后构造ServerBootstrap，来设置Server的一些属性，包括在pipeline中添加Http的编码解码以及逻辑处理相关类。通过调用该类的start方法即可启动此HTTP服务器，其中端口在配置文件中配置好，启动时从配置文件读取。
### HttpInHandler
Http请求的处理器，绑定在pipeLine中，负责请求的解析与逻辑处理，代码如下：
```java
package com.kidbear._36.net.http;

import io.netty.channel.ChannelHandlerAdapter;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.channel.ChannelPromise;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;

/**
 * @ClassName: HttpServerHandler
 * @Description: netty处理器
 * @author 何金成
 * @date 2015年12月18日 下午6:27:06
 * 
 */
public class HttpInHandler extends ChannelHandlerAdapter {

    public HttpInHandlerImp handler = new HttpInHandlerImp();

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg)
            throws Exception {
        handler.channelRead(ctx, msg);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
            throws Exception {
        handler.exceptionCaught(ctx, cause);
    }

    public static void writeJSON(ChannelHandlerContext ctx,
            HttpResponseStatus status, Object msg) {
        HttpInHandlerImp.writeJSON(ctx, status, msg);
    }

    public static void writeJSON(ChannelHandlerContext ctx, Object msg) {
        HttpInHandlerImp.writeJSON(ctx, msg);
    }
}
```
其中的实现方法我都将其分离出来为单独的类来处理，我这样做主要为了我以后能通过JSP热修复Bug（以后会讲到，通过JSP热加载的原理实现线上项目的热修复），分离出来的实现类代码如下：
```java
package com.kidbear._36.net.http;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufInputStream;
import io.netty.buffer.ByteBufOutputStream;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.DefaultFullHttpRequest;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.multipart.Attribute;
import io.netty.handler.codec.http.multipart.DefaultHttpDataFactory;
import io.netty.handler.codec.http.multipart.HttpPostRequestDecoder;
import io.netty.handler.codec.http.multipart.InterfaceHttpData;
import io.netty.util.CharsetUtil;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Future;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.kidbear._36.core.GameServer;
import com.kidbear._36.net.MsgHandler;
import com.kidbear._36.net.ProtoMessage;
import com.kidbear._36.net.ResultCode;
import com.kidbear._36.net.rpc.JsonRpcServers;
import com.kidbear._36.util.Constants;
import com.kidbear._36.util.encrypt.XXTeaCoder;

public class HttpInHandlerImp {
    private static Logger log = LoggerFactory.getLogger(HttpInHandlerImp.class);
    public static String DATA = "data";
    public static volatile boolean CODE_DEBUG = false;
    public ConcurrentHashMap<String, Future> executeMap = new ConcurrentHashMap<String, Future>();

    public void channelRead(final ChannelHandlerContext ctx, final Object msg)
            throws Exception {
        /** work线程的内容转交线程池管理类处理，缩短work线程耗时 **/
        if (!GameServer.shutdown) {// 服务器开启的情况下
            DefaultFullHttpRequest req = (DefaultFullHttpRequest) msg;
            if (req.getMethod() == HttpMethod.GET) { // 处理get请求
                getHandle(ctx, req);
            }
            if (req.getMethod() == HttpMethod.POST) { // 处理POST请求
                postHandle(ctx, req);
            }
        } else {// 服务器已关闭
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("errMsg", "server closed");
            writeJSON(ctx, jsonObject);
        }
    }

    private void postHandle(final ChannelHandlerContext ctx,
            final DefaultFullHttpRequest req) {
        HttpPostRequestDecoder decoder = new HttpPostRequestDecoder(
                new DefaultHttpDataFactory(false), req);
        // 逻辑接口处理
        try {
            InterfaceHttpData data = decoder.getBodyHttpData(DATA);
            if (data != null) {
                String val = ((Attribute) data).getValue();
                val = codeFilter(val);
                log.info("ip:{},read :{}", ctx.channel().remoteAddress(),
                        val);
                ProtoMessage msg = null;
                try {
                    msg = JSON.parseObject(val, ProtoMessage.class);
                } catch (Exception e) {
                    log.error("gameData的json格式转换错误");
                    HttpInHandler.writeJSON(ctx,
                            HttpResponseStatus.NOT_ACCEPTABLE,
                            "not acceptable");
                    return;
                }
                Long userid = msg.getUserid();
                // 添加到消息处理队列
                // MsgHandler.getInstance().addMsg(userid, msg, ctx);
                // 直接处理消息
                // MsgHandler.getInstance().handle(new Message(msg, ctx));
                // 处理消息队列
                MsgHandler.getInstance().handleMsg(userid, msg, ctx);
            }
        } catch (Exception e) {
            // 异常日志
            log.error("post error msg:", e);
            e.printStackTrace();
            // Print our stack trace
            StringBuffer eBuffer = new StringBuffer(e.getMessage() + ",");
            StackTraceElement[] trace = e.getStackTrace();
            for (StackTraceElement traceElement : trace) {
                eBuffer.append("\r\n " + traceElement);
            }
            HttpInHandler.writeJSON(ctx, ProtoMessage.getErrorResp(
                    ResultCode.SERVER_ERR, eBuffer.toString()));
        }
    }

    private void getHandle(final ChannelHandlerContext ctx,
            DefaultFullHttpRequest req) {
        QueryStringDecoder decoder = new QueryStringDecoder(req.getUri());
        Map<String, List<String>> params = decoder.parameters();
        List<String> typeList = params.get("type");
        if (Constants.MSG_LOG_DEBUG) {
            log.info("ip:{},read :{}", ctx.channel().remoteAddress(),
                    typeList.get(0));
        }
        writeJSON(ctx, HttpResponseStatus.NOT_IMPLEMENTED, "not implement");
    }

    /**
     * @Title: codeFilter
     * @Description: 编解码过滤
     * @param val
     * @return
     * @throws UnsupportedEncodingException
     *             String
     * @throws
     */
    private String codeFilter(String val) throws UnsupportedEncodingException {
        val = val.contains("%") ? URLDecoder.decode(val, "UTF-8") : val;
        String valTmp = val;
        val = CODE_DEBUG ? XXTeaCoder.decryptBase64StringToString(val,
                XXTeaCoder.key) : val;
        if (Constants.MSG_LOG_DEBUG) {
            if (val == null) {
                val = valTmp;
            }
        }
        return val;
    }

    public static void writeJSON(ChannelHandlerContext ctx,
            HttpResponseStatus status, Object msg) {
        String sentMsg = null;
        if (msg instanceof String) {
            sentMsg = (String) msg;
        } else {
            sentMsg = JSON.toJSONString(msg);
        }
        sentMsg = CODE_DEBUG ? XXTeaCoder.encryptToBase64String(sentMsg,
                XXTeaCoder.key) : sentMsg;
        writeJSON(ctx, status,
                Unpooled.copiedBuffer(sentMsg, CharsetUtil.UTF_8));
        ctx.flush();
    }

    public static void writeJSON(ChannelHandlerContext ctx, Object msg) {
        String sentMsg = null;
        if (msg instanceof String) {
            sentMsg = (String) msg;
        } else {
            sentMsg = JSON.toJSONString(msg);
        }
        sentMsg = CODE_DEBUG ? XXTeaCoder.encryptToBase64String(sentMsg,
                XXTeaCoder.key) : sentMsg;
        writeJSON(ctx, HttpResponseStatus.OK,
                Unpooled.copiedBuffer(sentMsg, CharsetUtil.UTF_8));
        ctx.flush();
    }

    private static void writeJSON(ChannelHandlerContext ctx,
            HttpResponseStatus status, ByteBuf content /*
                                                         * , boolean isKeepAlive
                                                         */) {
        if (ctx.channel().isWritable()) {
            FullHttpResponse msg = null;
            if (content != null) {
                msg = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status,
                        content);
                msg.headers().set(HttpHeaders.Names.CONTENT_TYPE,
                        "application/json; charset=utf-8");
                msg.headers().set("userid", 101);
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
        log.error("netty exception:", cause);
    }
}
```
以上代码实现了使用Netty中封装的Http请求的解析类对消息进行Get或Post解析，并使用了Http相应的构造类对返回消息进行Http消息格式的构造。
### MsgHandler
以上代码包含了Netty中的Get请求和Post请求的解析处理，请求消息以及响应消息的XXTea加密解密等。其中，服务器接受到请求后，会将请求交给一个消息处理类进行具体的消息处理，消息处理器MsgHandler的代码如下：
```java
package com.kidbear._36.net;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.MessageSizeEstimator.Handle;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.LinkedBlockingQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson.JSONObject;
import com.kidbear._36.core.GameServer;
import com.kidbear._36.core.Router;
import com.kidbear._36.manager.log.LogMgr;
import com.kidbear._36.net.http.HttpInHandler;
import com.kidbear._36.task.ExecutorPool;

/**
 * @ClassName: MsgHandler
 * @Description: 消息处理器
 * @author 何金成
 * @date 2016年8月22日 下午12:04:23
 * 
 */
public class MsgHandler {
    public static Logger logger = LoggerFactory.getLogger(MsgHandler.class);
    public static MsgHandler handler;

    public static MsgHandler getInstance() {
        return handler == null ? new MsgHandler() : handler;
    }

    protected MsgHandler() {

    }

    /**
     * @Fields msgMap : 并发消息处理map
     */
    public static ConcurrentMap<Long, BlockingQueue<Message>> msgMap = new ConcurrentHashMap<Long, BlockingQueue<Message>>();

    public void handleMsg(Long userid, ProtoMessage msg,
            ChannelHandlerContext ctx) throws InterruptedException {
        // add message
        Message message = new Message();
        message.msg = msg;
        message.ctx = ctx;
        BlockingQueue<Message> queue = null;
        if (msgMap.containsKey(userid)) {
            queue = msgMap.get(userid);
            queue.put(message);
        } else {
            queue = new LinkedBlockingQueue<Message>();
            queue.put(message);
            msgMap.put(userid, queue);
        }
        // log
        LogMgr.getInstance().concurrentLog(msgMap);
        // handle message
        while (!queue.isEmpty()) {
            message = queue.take();
            if (queue.size() == 0) {
                msgMap.remove(userid);
            }
            handle(message);
        }
    }

    /**
     * @Title: addMsg
     * @Description: 添加消息到处理队列
     * @param userid
     * @param msg
     * @param ctx
     * @throws InterruptedException
     *             void
     * @throws
     */
    public void addMsg(Long userid, ProtoMessage msg, ChannelHandlerContext ctx)
            throws InterruptedException {
        Message message = new Message();
        message.msg = msg;
        message.ctx = ctx;
        if (msgMap.containsKey(userid)) {
            BlockingQueue<Message> queue = msgMap.get(userid);
            queue.put(message);
        } else {
            BlockingQueue<Message> queue = new LinkedBlockingQueue<Message>();
            queue.put(message);
            msgMap.put(userid, queue);
        }
        LogMgr.getInstance().concurrentLog(msgMap);
    }

    /**
     * @Title: run
     * @Description: 处理消息队列 void
     * @throws
     */
    public void run() {
        ExecutorPool.msgHandleThread.execute(new Runnable() {
            @Override
            public void run() {
                logger.info("消息处理线程开启");
                while (!GameServer.shutdown) {
                    for (Iterator<Long> iterator = msgMap.keySet().iterator(); iterator
                            .hasNext();) {
                        Long userid = iterator.next();
                        BlockingQueue<Message> queue = msgMap.get(userid);
                        try {
                            Message msg = queue.take();
                            if (queue.size() == 0) {
                                iterator.remove();
                            }
                            handle(msg);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                            logger.error("msg handle err:{}", e);
                        }
                    }
                }
            }
        });
    }

    public void handle(final Message message) {
        ExecutorPool.channelHandleThread.execute(new Runnable() {
            @Override
            public void run() {
                Short typeid = message.msg.getTypeid();
                if (typeid == null) {
                    logger.error("没有typeid");
                    HttpInHandler.writeJSON(message.ctx,
                            ProtoMessage.getErrorResp("没有typeid"));
                    return;
                }
                JSONObject msgData = message.msg.getData();
                Router.getInstance().route(typeid, msgData,
                        message.msg.getUserid(), message.ctx);
            }
        });
    }
}
```
以上代码包含handleMsg、handle和addMsg方法，msgMap中包含每个用户的userid哈希对应的消息处理队列，原本我的设想是在服务器启动时，调用MsgHandler的run方法启动消息处理，无限循环的遍历msgMap，来处理所有玩家的消息处理队列，请求接入时，直接添加消息到msgMap的相应玩家的消息队列，然后由这个run方法中的线程来处理所有的消息，后来考虑到效率问题，改为直接在HttpInHandler中调用handleMsg方法，直接处理消息请求。每个玩家分配一个消息队列来进行处理主要是为了考虑到单个玩家的并发请求的情况。hash使用ConcurrentMap主要是考虑到这个Map的并发使用情景，使用ConcurrentMap的桶锁机制可以让它在并发情境中有更高的处理效率。
### Message
MsgHandle中使用的Message类是对消息的封装包括ProtoMessage和ChannelHandlerContext，代码如下：
```java
package com.kidbear._36.net;

import io.netty.channel.ChannelHandlerContext;

import java.util.concurrent.BlockingQueue;

public class Message {
    public ProtoMessage msg;
    public ChannelHandlerContext ctx;

    public Message() {
    }

    public Message(ProtoMessage msg, ChannelHandlerContext ctx) {
        this.msg = msg;
        this.ctx = ctx;
    }
}
```
### ProtoMessage
ProtoMessage是通信中对消息格式的封装，消息格式定义为："{typeid:1,userid:1,data:{}}"，typeid代表游戏中接口的协议号，userid代表玩家id，data代表具体传输的数据，其代码如下：
```java
package com.kidbear._36.net;

import java.io.Serializable;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

public class ProtoMessage implements Serializable {

    /**
     * @Fields serialVersionUID : TODO
     */
    private static final long serialVersionUID = -3460913241121151489L;
    private Short typeid;
    private Long userid;
    public JSONObject data;

    public ProtoMessage() {

    }

    public <T> ProtoMessage(Short typeid, T data) {
        this.typeid = typeid;
        this.setData(data);
    }

    public <T> ProtoMessage(T data) {
        this.setData(data);
    }

    public static ProtoMessage getResp(String msg, int code) {
        JSONObject ret = new JSONObject();
        ret.put("code", code);
        if (msg != null) {
            ret.put("err", msg);
        }
        return new ProtoMessage(ret);
    }

    public static ProtoMessage getSuccessResp() {
        return getResp(null, ResultCode.SUCCESS);
    }

    public static ProtoMessage getEmptyResp() {
        return new ProtoMessage();
    }

    public static ProtoMessage getErrorResp(String msg) {
        return getResp(msg, ResultCode.COMMON_ERR);
    }

    public static ProtoMessage getErrorResp(short id) {
        return getResp(null, ResultCode.COMMON_ERR);
    }

    public static ProtoMessage getErrorResp(int code) {
        return getResp(null, code);
    }

    public static ProtoMessage getErrorResp(int code, String msg) {
        return getResp(msg, code);
    }

    public JSONObject getData() {
        return this.data;
    }

    public void setData(JSONObject data) {
        this.data = data;
    }

    public <T> T getData(Class<T> t) {// 转换为对象传递
        return JSON.parseObject(JSON.toJSONString(data), t);
    }

    public <T> void setData(T t) {
        this.data = JSON.parseObject(JSON.toJSONString(t), JSONObject.class);
    }

    public Short getTypeid() {
        return typeid;
    }

    public void setTypeid(Short typeid) {
        this.typeid = typeid;
    }

    public Long getUserid() {
        return userid;
    }

    public void setUserid(Long userid) {
        this.userid = userid;
    }
}
```
### HttpOutHandler
绑定在pipeLine中，负责处理相应消息，其实响应消息的处理在HttpInHandler的writeJSON方法中已经完成，使用DefaultFullHttpResponse对响应消息进行Http格式构造，然后调用ChannelHandlerContext的write方法直接write到消息管道中，并且在完成消息传输后自动关闭管道。而HttpOutHandler则只是截取响应消息并进行log打印输出一下，然后继续调用super发送出去，其接口及实现类代码如下：
HttpOutHandler:
```java
package com.kidbear._36.net.http;

import io.netty.channel.ChannelHandlerAdapter;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelPromise;

public class HttpOutHandler extends ChannelHandlerAdapter {

    public HttpOutHandlerImp handler = new HttpOutHandlerImp();

    @Override
    public void write(ChannelHandlerContext ctx, Object msg,
            ChannelPromise promise) throws Exception {
        super.write(ctx, msg, promise);
        handler.write(ctx, msg, promise);
    }
}
```
HttpOutHandlerImp:
```java
package com.kidbear._36.net.http;

import java.nio.charset.Charset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.kidbear._36.util.Constants;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufUtil;
import io.netty.buffer.Unpooled;
import io.netty.buffer.UnpooledUnsafeDirectByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelPromise;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.HttpHeaders;

public class HttpOutHandlerImp {
    public Logger logger = LoggerFactory.getLogger(HttpOutHandlerImp.class);

    public void write(ChannelHandlerContext ctx, Object msg,
            ChannelPromise promise) throws Exception {
        if (Constants.MSG_LOG_DEBUG) {
            DefaultFullHttpResponse resp = (DefaultFullHttpResponse) msg;
            logger.info("ip:{},write:{}", ctx.channel().remoteAddress(), resp
                    .content().toString(Charset.forName("UTF-8")));
        }
    }
}
```
## 总结
本章内容介绍我们的这款游戏的网络通信的处理方式，总体来说，对目前的策划需求，以及目前的用户量来说，这个通信框架已经能满足，但客观的说，这个网络架构还是存在很多问题的，比如通信使用JSON字符串，使得通信数据的大小没有得到很好地处理，如果使用ProtoBuffer这样高效的二进制数据传输会有更小的数据传输量。另外，通信完全采用Http通信，使得游戏中一些需要实时展示的效果只能通过请求——响应式来获取最新数据，比如游戏中的邮件、战报等功能，只能通过客户端的不断请求来获取到最新消息，实时效果通过非实时通信来实现，会有很多冗余的请求，浪费带宽资源，如果以后玩家数量太多，对网络通信这块，我们肯定还会再进行优化。
下章内容，我们会对游戏中的数据缓存与存储进行介绍。
