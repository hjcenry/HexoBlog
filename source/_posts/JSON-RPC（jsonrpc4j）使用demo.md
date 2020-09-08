---
title: JSON-RPC（jsonrpc4j）使用demo
date: 2016-03-22 17:34
categories: Java
tags: [Java,rpc,jsonrpc,游戏服务器]
---
服务端开发，在很多情况下，需要使用到RPC框架，今天发现一款很轻量的RPC框架——JSON-RPC。json rpc 是一种以json为消息格式的远程调用服务，它是一套允许运行在不同操作系统、不同环境的程序实现基于Internet过程调用的规范和一系列的实现。<!--more-->这种远程过程调用可以使用http作为传输协议，也可以使用其它传输协议，传输的内容是json消息体。
json rpc 和xmlrpc相比具有很多优点。首先xmlrpc是以xml作为消息格式，xml具有体积大，格式复杂，传输占用带宽。程序对xml的解析也比较复杂，并且耗费较多服务器资源。json相比xml体积小巧，并且解析相对容易很多。
json-rpc是一种非常轻量级的跨语言远程调用协议，实现及使用简单。仅需几十行代码，即可实现一个远程调用的客户端，方便语言扩展客户端的实现。服务器端有php、java、python、ruby、.net等语言实现，是非常不错的及轻量级的远程调用协议。
其官网地址是：http://www.jsonrpc.org/
其Wiki地址是：http://json-rpc.org/wiki/implementations
可以看到，JSON-RPC有C，C++，C#，Javascipt，Erlang，Objective-C，Java等多种语言的实现，这里我简单介绍下Java使用JSON-RPC的示例，今天折腾了半天弄得。
首先就是要下载jsonrpc4j的jar包以及其依赖的jar包，这里我直接搭建Maven项目，使用Maven来管理jar包，其pom文件如下：

pom.xml
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>com.hjc.demo</groupId>
	<artifactId>jsonrpc_server</artifactId>
	<packaging>war</packaging>
	<version>0.0.1-SNAPSHOT</version>
	<name>jsonrpc_server Maven Webapp</name>
	<url>http://maven.apache.org</url>
	<dependencies>
		<!-- jsonrpc4j -->
		<dependency>
			<groupId>com.github.briandilley.jsonrpc4j</groupId>
			<artifactId>jsonrpc4j</artifactId>
			<version>1.0</version>
		</dependency>
		<!-- jsonrpc4j依赖的包 -->
		<dependency>
			<groupId>junit</groupId>
			<artifactId>junit</artifactId>
			<version>4.10</version>
		</dependency>
		<dependency>
			<groupId>com.fasterxml.jackson.core</groupId>
			<artifactId>jackson-core</artifactId>
			<version>2.0.2</version>
		</dependency>
		<dependency>
			<groupId>com.fasterxml.jackson.core</groupId>
			<artifactId>jackson-databind</artifactId>
			<version>2.0.2</version>
		</dependency>
		<dependency>
			<groupId>com.fasterxml.jackson.core</groupId>
			<artifactId>jackson-annotations</artifactId>
			<version>2.0.2</version>
		</dependency>
		<dependency>
			<groupId>javax.portlet</groupId>
			<artifactId>portlet-api</artifactId>
			<version>2.0</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-core</artifactId>
			<version>3.1.2.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context</artifactId>
			<version>3.1.2.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-web</artifactId>
			<version>3.1.2.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-test</artifactId>
			<version>3.1.2.RELEASE</version>
		</dependency>
		<dependency>
			<groupId>commons-codec</groupId>
			<artifactId>commons-codec</artifactId>
			<version>1.4</version>
		</dependency>
		<dependency>
			<groupId>org.apache.httpcomponents</groupId>
			<artifactId>httpcore-nio</artifactId>
			<version>4.2.1</version>
		</dependency>
		<dependency>
			<groupId>org.jmock</groupId>
			<artifactId>jmock-junit4</artifactId>
			<version>2.5.1</version>
		</dependency>
		<dependency>
			<groupId>org.jmock</groupId>
			<artifactId>jmock</artifactId>
			<version>2.5.1</version>
		</dependency>
		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-server</artifactId>
			<version>9.0.0.RC0</version>
		</dependency>
		<dependency>
			<groupId>org.eclipse.jetty</groupId>
			<artifactId>jetty-servlet</artifactId>
			<version>9.0.0.RC0</version>
		</dependency>
		<dependency>
			<groupId>org.ow2.chameleon.fuchsia.base.json-rpc</groupId>
			<artifactId>org.ow2.chameleon.fuchsia.base.json-rpc.json-rpc-bundle</artifactId>
			<version>0.0.2</version>
		</dependency>

	</dependencies>
	<build>
		<finalName>jsonrpc_server</finalName>
	</build>
</project>
```
待以上jar包等环境部署好了之后，就可以进行开发了，我们先要部署一个Servlet，作为RPC调用的接口。（我的环境的Tomcat6，Tomcat7的朋友可以直接使用@WebServlet来部署Servlet，具体代码因环境而异）。

web.xml
```xml
<!DOCTYPE web-app PUBLIC
 "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
 "http://java.sun.com/dtd/web-app_2_3.dtd" >

<web-app>
  <display-name>Archetype Created Web Application</display-name>
  <servlet>
  	<servlet-name>RpcServer</servlet-name>
  	<display-name>RpcServer</display-name>
  	<description></description>
  	<servlet-class>com.hjc.demo.RpcServer</servlet-class>
  </servlet>
  <servlet-mapping>
  	<servlet-name>RpcServer</servlet-name>
  	<url-pattern>/rpc</url-pattern>
  </servlet-mapping>
</web-app>
```

RpcServer.java

```java
package com.hjc.demo;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.googlecode.jsonrpc4j.JsonRpcServer;

public class RpcServer extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private JsonRpcServer rpcServer = null;

	public RpcServer() {
		super();
		rpcServer = new JsonRpcServer(new DemoServiceImply(), DemoService.class);
	}

	@Override
	protected void service(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		rpcServer.handle(request, response);
	}

}
```
其中，DemoService是RPC调用的接口，DemoServiceImply是DemoService接口的实现，他们的代码分别如下：

DemoService.java

```java
package com.hjc.demo;

public interface DemoService {

	public DemoBean getDemo(String code, String msg);

	public Integer getInt(Integer code);

	public String getString(String msg);

	public void doSomething();
}
```

DemoServiceImply.java

```java
package com.hjc.demo;

public class DemoServiceImply implements DemoService {

	public DemoBean getDemo(String code, String msg) {
		DemoBean bean1 = new DemoBean();
		bean1.setCode(Integer.parseInt(code));
		bean1.setMsg(msg);
		return bean1;
	}

	public Integer getInt(Integer code) {
		return code;
	}

	public String getString(String msg) {
		return msg;
	}

	public void doSomething() {
		System.out.println("do something");
	}

}
```

DemoBean是一个普通的JavaBean，其代码如下：

DemoBean.java

```java
package com.hjc.demo;

import java.io.Serializable;

public class DemoBean implements Serializable{
	private static final long serialVersionUID = -5141784402935371524L;
	private int code;
	private String msg;

	public int getCode() {
		return code;
	}

	public void setCode(int code) {
		this.code = code;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}
}
```

以上代码即完成了服务端的代码，接下来写一个客户端的测试类：

JsonRpcTest.java

```java
package com.hjc.test;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.googlecode.jsonrpc4j.JsonRpcHttpClient;
import com.hjc.demo.DemoBean;

public class JsonRpcTest {
	static JsonRpcHttpClient client;

	public JsonRpcTest() {

	}

	public static void main(String[] args) throws Throwable {
		// 实例化请求地址，注意服务端web.xml中地址的配置
		try {
			client = new JsonRpcHttpClient(new URL(
					"http://127.0.0.1:8080/jsonrpc_server/rpc"));
			// 请求头中添加的信息
			Map<String, String> headers = new HashMap<String, String>();
			headers.put("UserKey", "hjckey");
			// 添加到请求头中去
			client.setHeaders(headers);
			JsonRpcTest test = new JsonRpcTest();
			test.doSomething();
			DemoBean demo = test.getDemo(1, "哈");
			int code = test.getInt(2);
			String msg = test.getString("哈哈哈");
			// print
			System.out.println("===========================javabean");
			System.out.println(demo.getCode());
			System.out.println(demo.getMsg());
			System.out.println("===========================Integer");
			System.out.println(code);
			System.out.println("===========================String");
			System.out.println(msg);
			System.out.println("===========================end");
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void doSomething() throws Throwable {
		client.invoke("doSomething", null);
	}

	public DemoBean getDemo(int code, String msg) throws Throwable {
		String[] params = new String[] { String.valueOf(code), msg };
		DemoBean demo = null;
		demo = client.invoke("getDemo", params, DemoBean.class);
		return demo;
	}

	public int getInt(int code) throws Throwable {
		Integer[] codes = new Integer[] { code };
		return client.invoke("getInt", codes, Integer.class);
	}

	public String getString(String msg) throws Throwable {
		String[] msgs = new String[] { msg };
		return client.invoke("getString", msgs, String.class);
	}

}
```

最后的打印结果如下：

服务端：

```
do something
```

客户端：
```
===========================javabean
1
哈
===========================Integer
2
===========================String
哈哈哈
===========================end
```
以上就完成了JSON-RPC全部的代码，值得说的是，这其中我也爬了很多坑，这里也提一下，JsonRpcHttpClient类的invoke方法，如果你要传递参数，必须是一个数组，这里我传的String[]和Integer[]，如果传递了别的类型会发生什么呢？你可以试一下这样调用：
```java
client.invoke("getInt", 3, Integer.class);
```
然后你就会发现服务端报错：
```java
java.lang.IllegalArgumentException: Unknown params node type: 2
	at com.googlecode.jsonrpc4j.JsonRpcServer.findBestMethodByParamsNode(JsonRpcServer.java:612)
	at com.googlecode.jsonrpc4j.JsonRpcServer.handleObject(JsonRpcServer.java:373)
	at com.googlecode.jsonrpc4j.JsonRpcServer.handleNode(JsonRpcServer.java:293)
	at com.googlecode.jsonrpc4j.JsonRpcServer.handle(JsonRpcServer.java:230)
	at com.googlecode.jsonrpc4j.JsonRpcServer.handle(JsonRpcServer.java:207)
	at com.hjc.demo.RpcServer.service(RpcServer.java:24)
        ...
```
点进源码，你就全明白了，进入JsonRpcServer类查看findBestMethodByParamsNode方法，其代码如下：
```java
/**
	 * Finds the {@link Method} from the supplied {@link Set} that
	 * best matches the rest of the arguments supplied and returns
	 * it as a {@link MethodAndArgs} class.
	 *
	 * @param methods the {@link Method}s
	 * @param paramsNode the {@link JsonNode} passed as the parameters
	 * @return the {@link MethodAndArgs}
	 */
	private MethodAndArgs findBestMethodByParamsNode(Set<Method> methods, JsonNode paramsNode) {

		// no parameters
		if (paramsNode==null || paramsNode.isNull()) {
			return findBestMethodUsingParamIndexes(methods, 0, null);

		// array parameters
		} else if (paramsNode.isArray()) {
			return findBestMethodUsingParamIndexes(methods, paramsNode.size(), ArrayNode.class.cast(paramsNode));

		// named parameters
		} else if (paramsNode.isObject()) {
			Set<String> fieldNames = new HashSet<String>();
			Iterator<String> itr=paramsNode.fieldNames();
			while (itr.hasNext()) {
				fieldNames.add(itr.next());
			}
			return findBestMethodUsingParamNames(methods, fieldNames, ObjectNode.class.cast(paramsNode));

		}

		// unknown params node type
		throw new IllegalArgumentException("Unknown params node type: "+paramsNode.toString());
	}
```
所以我就明白了，除了null（不传参数），Array，Object，其他的类都是“Unknown params node type”，当时我也很疑惑，Integer不也是Object嘛，断点一下，原来它认为这是IntNode类，所以不能识别，其他的参数我也试过一些，目前还是数组是最靠谱的，网上资料还比较少，希望有懂得给指点指点。
这也是我今天花了半天时间弄得JSON-RPC，喜欢的朋友，源码地址在下面：
https://github.com/hjcenry/json-rpc-demo
