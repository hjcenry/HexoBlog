---
title: Java读取CSV和XML文件方法
date: 2016-02-18 15:59
categories: Java
tags: [Java,csv,xml]
---
游戏开发中，读取策划给的配置表是必不可少的，我在之前公司，策划给的是xml表来读取，现在公司策划给的是CSV表来读取，其实大同小异，也并不是什么难点，我就简单分享下Java如何读取XML文件和CSV文件。以下工具类可随意拿去使用。
<!--more-->
### Java读XML文件
如果是Maven项目，则依赖以下包（如果不是，则自己在项目添加配置相应jar包）
```xml
        <!-- dom4j begin -->
		<dependency>
			<groupId>dom4j</groupId>
			<artifactId>dom4j</artifactId>
			<version>1.6.1</version>
		</dependency>
		<!-- dom4j end -->
		<!--xml转换 -->
		<dependency>
			<groupId>com.thoughtworks.xstream</groupId>
			<artifactId>xstream</artifactId>
			<version>1.4.3</version>
		</dependency>
```
读取XML文件应该是比较常见的，用dom4j就可以很简单的读出来，首先准备一个XML文件，来映射出所有的XML资源文件的名字，资源文件如下：
dataConfig.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
 	<file name="Test.xml" />
</config>
```
示例资源XML文件如下
Test.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<dataset>
 	<Test attr1="" attr2="" attr3="" />
</dataset>
```
Java项目中建一个类，变量名与XML中属性名相同，Java代码通过这个XML文件来找出所有的资源XML文件，然后将XML文件中的属性值全部读取到类中，再把类放进Map，加载到内存中，这样，每次需要读取配置表，就可以直接从内存中读取，快速且方便
以下是XmlDataLoader.java，作用是从数据表中读取属性值到内存
```java
package com.hjc._36.util.xml;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.hjc._36.core.GameInit;
import com.hjc._36.util.csv.TempletService;

/**
 * 1 所有的template类都必须在一个包中 2 通过读取xml 遍历所有的Element，通过Element.name和 package 得到具体的
 * className; 3 通过Element的 attr 获取方法，并且根据parameterType 强制转换类型
 *
 * @author Administrator
 *
 */
public class XmlDataLoader {
	private String packageName;
	private String config; // 每一行就是一个配置文件名字
	private static Logger logger = LoggerFactory.getLogger(XmlDataLoader.class);
	public static int ActivityMaxValue;

	public XmlDataLoader(String packageName, String config) {
		this.packageName = packageName;
		this.config = config;
	}

	/**
	 * 调用load方法加载所有的配置文件
	 */
	public void load() {
		SAXReader reader = new SAXReader();
		try {
			Document doc = reader.read(new InputStreamReader(this.getClass()
					.getResourceAsStream(this.config)));
			List<?> nodes = doc.selectNodes("/config/file");
			Map<String, List<?>> dataMap = new HashMap<String, List<?>>();
			List<String> files = new LinkedList<String>();
			for (Object n : nodes) {
				Element t = (Element) n;
				String f = t.attributeValue("name");
				List<?> dataList = this.loadFile(f, true);
				for (Object o : dataList) {
					TempletService.getInstance().registerObject(o, dataMap);
				}
				files.add(f);
			}
			logger.info("读取配置完毕，准备afterLoad");
			TempletService.templetMap = dataMap;
			TempletService.getInstance().afterLoad();
			logger.info("afterLoad 完毕");
		} catch (DocumentException e) {
			e.printStackTrace();
		} finally {

		}
	}

	private List<?> loadFile(String file, boolean exitWhenFail) {
		try {
			file = GameInit.confFileBasePath + file;
			logger.info("load file: {}", file);
			InputStream resourceAsStream = this.getClass().getResourceAsStream(
					file);
			if (resourceAsStream == null) {
				logger.error("文件不存在:" + file);
				if (exitWhenFail) {
					System.exit(0);
				}
				return null;
			}
			return loadFromStream(resourceAsStream);
		} catch (Exception e) {
			logger.error("载入文件出错：" + file);
			e.printStackTrace();
			System.exit(0);
		} finally {
		}
		return Collections.EMPTY_LIST;
	}

	public List<?> loadFromStream(InputStream resourceAsStream)
			throws UnsupportedEncodingException, DocumentException,
			InstantiationException, IllegalAccessException {
		SAXReader reader = new SAXReader();
		Document doc = reader.read(new InputStreamReader(resourceAsStream,
				"utf-8"));
		Element dataSet = (Element) doc.selectNodes("/dataset").get(0);
		List<?> nodes = dataSet.elements();
		// get clazz
		String className = this.packageName
				+ ((Element) nodes.get(0)).getName();
		try {
			Class<?> classObject = Class.forName(className);
			if (classObject == null) {
				logger.error("未找到类" + className);
				return null;
			}
			// Get all the declared fields
			Field[] fields = classObject.getDeclaredFields();
			LinkedList<Field> fieldList = new LinkedList<Field>();
			int length = fields.length;
			for (int i = -1; ++i < length;) {
				boolean isStaticField = Modifier.isStatic(fields[i]
						.getModifiers());
				if (isStaticField)
					continue;
				boolean isTransientField = Modifier.isTransient(fields[i]
						.getModifiers());
				if (isTransientField)
					continue;
				fieldList.add(fields[i]);
			}
			// Get all the declared fields of supper class
			Class<?> tmp = classObject;
			while ((tmp = tmp.getSuperclass()) != Object.class) {
				System.out.print("the extends class is" + tmp.getName());
				fields = tmp.getDeclaredFields();
				length = fields.length;
				if (length == 0)
					continue;
				for (int i = -1; ++i < length;) {
					boolean isStaticField = Modifier.isStatic(fields[i]
							.getModifiers());
					if (isStaticField)
						continue;
					boolean isTransientField = Modifier.isTransient(fields[i]
							.getModifiers());
					if (isTransientField)
						continue;
					fieldList.add(fields[i]);
				}
			}
			// The truly need to return object
			List<Object> instances = new ArrayList<Object>(nodes.size());
			Object instance = null;
			String fieldName = null;
			String fieldValue = null;
			for (Object node : nodes) {
				if (node != null) {
					instance = classObject.newInstance();
					boolean ok = false;
					Element row = (Element) node;
					for (Field field : fieldList) {
						fieldName = field.getName();
						fieldValue = row.attributeValue(fieldName);
						if (fieldValue == null)
							continue;
						try {
							this.setField(instance, field, fieldValue);
							ok = true;
						} catch (Exception e) {
							logger.error("类名称是" + className + "的属性" + fieldName
									+ "没有被成功赋予静态数据");
							continue;
						}
					}
					if (ok)
						instances.add(instance);
				}
			}
			return instances;
		} catch (ClassNotFoundException e1) {
			e1.printStackTrace();
			logger.error("未找到类" + className);
			return null;
		}
	}

	public void reload() {
	}

	/**
	 *
	 * @Title: setUnknowField
	 * @Description:
	 * @param ob
	 * @param f
	 * @param v
	 * @throws IllegalArgumentException
	 * @throws IllegalAccessException
	 */
	private void setField(Object obj, Field f, String v)
			throws IllegalArgumentException, IllegalAccessException {
		f.setAccessible(true);
		if (f.getType() == int.class) {
			f.setInt(obj, Integer.parseInt(v));
		} else if (f.getType() == short.class) {
			f.setShort(obj, Short.parseShort(v));
		} else if (f.getType() == byte.class) {
			f.setByte(obj, Byte.parseByte(v));
		} else if (f.getType() == long.class) {
			f.setLong(obj, Long.parseLong(v));
		} else if (f.getType() == double.class) {
			f.setDouble(obj, Double.parseDouble(v));
		} else if (f.getType() == float.class) {
			f.setFloat(obj, Float.parseFloat(v));
		} else if (f.getType() == Timestamp.class) {
			f.set(obj, Timestamp.valueOf(v));
		} else {
			f.set(obj, f.getType().cast(v));
		}
	}

	/**
	 * Test Code
	 *
	 * @param args
	 */
	public static void main(String[] args) {
		XmlDataLoader dl = new XmlDataLoader("com.hjc._36.template.",
				"/dataConfig.xml");
		dl.load();
	}

}
```
如上的测试方法中看出，调用方式很简单，只需加载到映射XML文件，即可读取所有的配置XML文件，调用load()方法后，配置表就全部加载到了内存，我们通过以下类——TempletService.java来对这些配置数据进行管理：
```java
package com.hjc._36.util.csv;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 添加一个数据表需要做以下几步
 * 1.在包com.hjc._36.template下创建对应的模板类，类名与数据文件一致
 * 2.在src/main/resources/xml/中添加模板数据文件
 * 3.在src/main/resources/dataConfig.xml加入刚才的模板数据文件
 *
 * @author 何金成
 *
 */
public class TempletService {
	public static Logger log = LoggerFactory.getLogger(TempletService.class);
	public static TempletService templetService = new TempletService();
	/**
	 * key:实体名 value:该实体下的所有模板数据
	 */
	public static Map<String, List<?>> templetMap = new HashMap<String, List<?>>();

	public TempletService() {

	}

	public static TempletService getInstance() {
		return templetService;
	}

	/**
	 * 获取该实体类下所有模板数据
	 *
	 * @param beanName
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public static List listAll(String beanName) {
		return templetMap.get(beanName);
	}

	/**
	 * @Title: registerObject
	 * @Description: 注册对象到对应类的List中
	 * @param o
	 * @param dataMap
	 * @return void
	 * @throws
	 */
	public void registerObject(Object o, Map<String, List<?>> dataMap) {
		add(o.getClass().getSimpleName(), o, dataMap);
	}



	@SuppressWarnings("unchecked")
	private void add(String key, Object data, Map<String, List<?>> dataMap) {
		List list = dataMap.get(key);
		if (list == null) {
			list = new ArrayList();
			dataMap.put(key, list);
		}
		list.add(data);
	}

	public void afterLoad() {
		// 加载后处理
		// List tests = TempletService.listAll(Test.class.getSimpleName());
		// for (Object object : tests) {
		// Test test = (Test)object;
		// System.out.print(test.getEquipLv());
		// System.out.print(","+test.getLv1());
		// System.out.print(","+test.getLv2());
		// System.out.print(","+test.getLv3());
		// System.out.print(","+test.getLv4());
		// System.out.print(","+test.getLv5());
		// System.out.print(","+test.getLv6());
		// System.out.print(","+test.getLv7());
		// System.out.print(","+test.getLv8());
		// System.out.print(","+test.getLv9());
		// System.out.println(","+test.getLv10());
		// }
	}

	public void loadCanShu() {
		// 加载全局参数xml配置
	}
}
```
在load()中，变用到了上述类的registerObject方法来添加数据，在使用时，只需要调用listAll方法即可，在上面代码中的测试代码已经写明了用法。
### Java读取CSV文件
Java读CSV文件与读XML文件如出一辙，大致思路同上
dataConfig.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
 	<file name="Test.csv" />
 	<file name="JunjichuUpgrade.csv" />
 	<file name="Card.csv" />
 	<file name="Equip.csv" />
 	<file name="Prop.csv" />
</config>
```
Test.csv如下：
```csv
﻿等级,1星,2星,3星,4星,5星,6星,7星,8星,9星,10星,11星,12星,13星,14星,15星,16星,17星,18星,19星,20星,21星,22星,23星,24星,25星
EquipLv,Lv1,Lv2,Lv3,Lv4,Lv5,Lv6,Lv7,Lv8,Lv9,Lv10,Lv11,Lv12,Lv13,Lv14,Lv15,Lv16,Lv17,Lv18,Lv19,Lv20,Lv21,Lv22,Lv23,Lv24,Lv25
10,2,4,8,12,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
20,6,12,24,36,48,60,72,84,96,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
30,12,24,48,72,96,120,144,168,192,216,240,264,288,312,336,0,0,0,0,0,0,0,0,0,0
40,20,40,80,120,160,200,240,280,320,360,400,440,480,520,560,0,0,0,0,0,0,0,0,0,0
50,30,60,120,180,240,300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,0,0,0,0,0
60,42,84,168,252,336,420,504,588,672,756,840,924,1008,1092,1176,1260,1344,1428,1512,1596,0,0,0,0,0
70,56,112,224,336,448,560,672,784,896,1008,1120,1232,1344,1456,1568,1680,1792,1904,2016,2128,0,0,0,0,0
80,72,144,288,432,576,720,864,1008,1152,1296,1440,1584,1728,1872,2016,2160,2304,2448,2592,2736,2880,3024,3168,3312,3456
90,90,180,360,540,720,900,1080,1260,1440,1620,1800,1980,2160,2340,2520,2700,2880,3060,3240,3420,3600,3780,3960,4140,4320
100,110,220,440,660,880,1100,1320,1540,1760,1980,2200,2420,2640,2860,3080,3300,3520,3740,3960,4180,4400,4620,4840,5060,5280
```
如上CSV表大家也能看出来，CSV文件中的数据是以一定规律呈现的，解析CSV便是根据CSV文件的这些特性来进行解析的，解析工具类CsvParser.java代码如下：
```java
package com.hjc._36.util.csv;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

//JAVA 操作 excel 中的 .csv文件格式
public class CsvParser {
	private BufferedReader bufferedreader = null;
	private List list = new ArrayList();

	public CsvParser() {
	}

	public CsvParser(InputStream inStream) throws IOException {
		InputStreamReader isr = new InputStreamReader(inStream, "UTF-8");
		bufferedreader = new BufferedReader(isr);
		String stemp;
		while ((stemp = bufferedreader.readLine()) != null) {
			list.add(stemp);
		}
	}

	public List getList() throws IOException {
		return list;
	}

	public List getListWithNoHeader() throws IOException {
		return list.subList(2, list.size());
	}

	// 得到csv文件的行数
	public int getRowNum() {
		return list.size();
	}

	// 得到csv文件的列数
	public int getColNum() {
		if (!list.toString().equals("[]")) {
			if (list.get(0).toString().contains(",")) { // csv文件中，每列之间的是用','来分隔的
				return list.get(0).toString().split(",").length;
			} else if (list.get(0).toString().trim().length() != 0) {
				return 1;
			} else {
				return 0;
			}
		} else {
			return 0;
		}
	}

	// 取得指定行的值
	public String getRow(int index) {
		if (this.list.size() != 0)
			return (String) list.get(index);
		else
			return null;
	}

	// 取得指定列的值
	public String getCol(int index) {
		if (this.getColNum() == 0) {
			return null;
		}
		StringBuffer scol = new StringBuffer();
		String temp = null;
		int colnum = this.getColNum();
		if (colnum > 1) {
			for (Iterator it = list.iterator(); it.hasNext();) {
				temp = it.next().toString();
				scol = scol.append(temp.split(",")[index] + ",");
			}
		} else {
			for (Iterator it = list.iterator(); it.hasNext();) {
				temp = it.next().toString();
				scol = scol.append(temp + ",");
			}
		}
		String str = new String(scol.toString());
		str = str.substring(0, str.length() - 1);
		return str;
	}

	// 取得指定行，指定列的值
	public String getString(int row, int col) {
		String temp = null;
		int colnum = this.getColNum();
		if (colnum > 1) {
			temp = list.get(row).toString().split(",")[col];
		} else if (colnum == 1) {
			temp = list.get(row).toString();
		} else {
			temp = null;
		}
		return temp;
	}

	public void CsvClose() throws IOException {
		this.bufferedreader.close();
	}

	public List readCvs(String filename) throws IOException {
		CsvParser cu = new CsvParser(new FileInputStream(new File(filename)));
		List list = cu.getList();

		return list;
	}

	public void createCsv(String biao, List list, String path)
			throws IOException {
		List tt = list;
		String data = "";
		SimpleDateFormat dataFormat = new SimpleDateFormat("yyyyMMdd");
		Date today = new Date();
		String dateToday = dataFormat.format(today);
		File file = new File(path + "resource/expert/" + dateToday
				+ "importerrorinfo.csv");
		if (!file.exists())
			file.createNewFile();
		else
			file.delete();
		String str[];
		StringBuilder sb = new StringBuilder("");
		sb.append(biao);
		FileOutputStream writerStream = new FileOutputStream(file, true);
		BufferedWriter output = new BufferedWriter(new OutputStreamWriter(
				writerStream, "UTF-8"));
		for (Iterator itt = tt.iterator(); itt.hasNext();) {
			String fileStr = itt.next().toString();
			// str = fileStr.split(",");
			// for (int i = 0; i <= str.length - 1; i++) { // 拆分成数组 用于插入数据库中
			// System.out.print("str[" + i + "]=" + str[i] + " ");
			// }
			// System.out.println("");
			sb.append(fileStr + "\r\n");
		}
		output.write(sb.toString());
		output.flush();
		output.close();
	}

	public static void main(String[] args) throws IOException {
		CsvParser test = new CsvParser();
		List aaa = test.readCvs("D:/abc.csv");
		for (int i = 0; i < aaa.size(); i++) {
			System.out.println(i + "---" + aaa.get(i));
			String a = (String) aaa.get(i).toString().split(",")[0];
		}
		System.out.println(aaa.size());
		//String biao = "用户名,姓名,排序,专家类型,业务专长,错误信息\n";
		//test.createCsv(biao, aaa, "D:/");
		// test.run("D:/abc.csv");
		// HttpServletResponse response = null;
		// test.createCsv(response);
//		CSVReader reader = new CSVReader(new FileReader("D:/abc.csv"));
//		ColumnPositionMappingStrategy<Test> strat = new ColumnPositionMappingStrategy<Test>();
//		strat.setType(Test.class);
//		String[] columns = new String[] {"EquipLv","Lv1","Lv2","Lv3","Lv4","Lv5","Lv6","Lv7","Lv8","Lv9","Lv10","Lv11","Lv12","Lv13","Lv14","Lv15"}; // the fields to bind do in your JavaBean
//		strat.setColumnMapping(columns);
//		CsvToBean<Test> csv = new CsvToBean<Test>();
//		List<Test> list = csv.parse(strat, reader);
//		System.out.println(list.size());
//		for (Test test : list) {
//			System.out.println(test.getEquipLv());
//			System.out.print(test.getLv1());
//			System.out.print(test.getLv2());
//			System.out.print(test.getLv3());
//			System.out.print(test.getLv4());
//			System.out.print(test.getLv5());
//			System.out.print(test.getLv6());
//			System.out.print(test.getLv7());
//			System.out.print(test.getLv8());
//			System.out.print(test.getLv9());
//			System.out.print(test.getLv10());
//			System.out.print(test.getLv11());
//			System.out.print(test.getLv12());
//			System.out.print(test.getLv13());
//			System.out.print(test.getLv14());
//			System.out.print(test.getLv15());
//		}

	}
}
```
CSV解析与XML解析的区别仅限于此，XML使用SaxReader来进行解析，而CSV自定义解析方式（当然网上也有很多别得第三方解析工具），接下来的步骤与XML解析一模一样，CsvDataLoader.java稍有不同的地方就是解析CSV文件的部分，代码如下：
```java
package com.hjc._36.util.csv;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.hjc._36.core.GameInit;

public class CsvDataLoader {
	public static Logger logger = LoggerFactory.getLogger(CsvDataLoader.class);
	private String packageName;
	private String config; // 每一行就是一个配置文件名字
	public static int ActivityMaxValue;

	public CsvDataLoader(String packageName, String config) {
		this.packageName = packageName;
		this.config = config;
	}

	/**
	 * 调用load方法加载所有的配置文件
	 */
	public void load() {
		SAXReader reader = new SAXReader();
		try {
			Document doc = reader.read(new InputStreamReader(this.getClass()
					.getResourceAsStream(this.config)));
			List<?> nodes = doc.selectNodes("/config/file");
			Map<String, List<?>> dataMap = new HashMap<String, List<?>>();
			List<String> files = new LinkedList<String>();
			for (Object n : nodes) {
				Element t = (Element) n;
				String f = t.attributeValue("name");
				List<?> dataList = this.loadFile(f, true);
				for (Object o : dataList) {
					TempletService.getInstance().registerObject(o, dataMap);
				}
				files.add(f);
			}
			logger.info("读取配置完毕，准备afterLoad");
			TempletService.templetMap = dataMap;
			TempletService.getInstance().afterLoad();
			logger.info("afterLoad 完毕");
		} catch (DocumentException e) {
			e.printStackTrace();
		} finally {

		}
	}

	private List<?> loadFile(String file, boolean exitWhenFail) {// 读文件
		try {
			String clzName = file.replaceAll(".csv", "");
			file = GameInit.confFileBasePath + file;
			logger.info("load file: {}", file);
			InputStream resourceAsStream = this.getClass().getResourceAsStream(
					file);
			if (resourceAsStream == null) {
				logger.error("文件不存在:" + file);
				if (exitWhenFail) {
					System.exit(0);
				}
				return null;
			}
			return loadFromStream(resourceAsStream, clzName);
		} catch (Exception e) {
			logger.error("载入文件出错：" + file);
			e.printStackTrace();
			System.exit(0);
		} finally {
		}
		return Collections.EMPTY_LIST;
	}

	public List<?> loadFromStream(InputStream resourceAsStream, String clzName)
			throws DocumentException, InstantiationException,
			IllegalAccessException, IOException {// 读csv文件
		CsvParser csvParser = new CsvParser(resourceAsStream);
		List<String> nodes = csvParser.getListWithNoHeader();
		// get clazz
		String className = this.packageName + clzName;
		try {
			Class<?> classObject = Class.forName(className);
			if (classObject == null) {
				logger.error("未找到类" + className);
				return null;
			}
			// Get all the declared fields
			Field[] fields = classObject.getDeclaredFields();
			LinkedList<Field> fieldList = new LinkedList<Field>();
			int length = fields.length;
			for (int i = -1; ++i < length;) {
				boolean isStaticField = Modifier.isStatic(fields[i]
						.getModifiers());
				if (isStaticField)
					continue;
				boolean isTransientField = Modifier.isTransient(fields[i]
						.getModifiers());
				if (isTransientField)
					continue;
				fieldList.add(fields[i]);
			}
			// Get all the declared fields of supper class
			Class<?> tmp = classObject;
			while ((tmp = tmp.getSuperclass()) != Object.class) {
				System.out.print("the extends class is" + tmp.getName());
				fields = tmp.getDeclaredFields();
				length = fields.length;
				if (length == 0)
					continue;
				for (int i = -1; ++i < length;) {
					boolean isStaticField = Modifier.isStatic(fields[i]
							.getModifiers());
					if (isStaticField)
						continue;
					boolean isTransientField = Modifier.isTransient(fields[i]
							.getModifiers());
					if (isTransientField)
						continue;
					fieldList.add(fields[i]);
				}
			}
			// The truly need to return object
			List<Object> instances = new ArrayList<Object>(nodes.size());
			Object instance = null;
			String fieldName = null;
			String fieldValue = null;
			for (String node : nodes) {
				if (node != null) {
					instance = classObject.newInstance();
					boolean ok = false;
					// Element row = (Element) node;
					String[] values = node.split(",");// csv文件以英文逗号分割值
					for (int i = 0; i < fieldList.size(); i++) {
						Field field = fieldList.get(i);
						fieldName = field.getName();
						fieldValue = values[i];
						if (fieldValue == null)
							continue;
						try {
							this.setField(instance, field, fieldValue);
							ok = true;
						} catch (Exception e) {
							logger.error("类名称是" + className + "的属性" + fieldName
									+ "没有被成功赋予静态数据");
							continue;
						}
					}
					if (ok) {
						instances.add(instance);
					}
				}
			}
			return instances;
		} catch (ClassNotFoundException e1) {
			e1.printStackTrace();
			logger.error("未找到类" + className);
			return null;
		}
	}

	/**
	 *
	 * @Title: setUnknowField
	 * @Description:
	 * @param ob
	 * @param f
	 * @param v
	 * @throws IllegalArgumentException
	 * @throws IllegalAccessException
	 */
	private void setField(Object obj, Field f, String v)
			throws IllegalArgumentException, IllegalAccessException {
		f.setAccessible(true);
		if (f.getType() == int.class) {
			f.setInt(obj, Integer.parseInt(v));
		} else if (f.getType() == short.class) {
			f.setShort(obj, Short.parseShort(v));
		} else if (f.getType() == byte.class) {
			f.setByte(obj, Byte.parseByte(v));
		} else if (f.getType() == long.class) {
			f.setLong(obj, Long.parseLong(v));
		} else if (f.getType() == double.class) {
			f.setDouble(obj, Double.parseDouble(v));
		} else if (f.getType() == float.class) {
			f.setFloat(obj, Float.parseFloat(v));
		} else if (f.getType() == Timestamp.class) {
			f.set(obj, Timestamp.valueOf(v));
		} else {
			f.set(obj, f.getType().cast(v));
		}
	}

	/**
	 * Test Code
	 *
	 * @param args
	 */
	public static void main(String[] args) {
		CsvDataLoader dl = new CsvDataLoader("com.hjc._36.template.",
				"/dataConfig.xml");
		dl.load();
	}
}
```
最后load()加载过后，依然使用TempletService来进行管理，使用方法也相同，具体代码参照上面。

##### 以上便是我对Java读取CSV和XML资源文件的总结，有需要的同学可以直接拿去用。
