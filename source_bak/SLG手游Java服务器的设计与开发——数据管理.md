---
title: SLG手游Java服务器的设计与开发——数据管理
date: 2016-09-04 10:13
categories: Java
tags: [Java,游戏服务器,SLG]
---
- `文章版权归腾讯GAD所有，禁止匿名转载；禁止商业使用；禁止个人使用。`

## 前言
上文介绍了我们的SLG手游的服务器架构设计以及网络通信部分，本文介绍数据管理部分，在数据存储方面，我选择了Mysql、Memcache和Redis，利用这三种数据库各自的优势，各自发挥所长，在项目中有着不同的应用。
<!--more-->
## 游戏数据分析
前文已经对游戏数据做了大概的分析，如下图所示：
![游戏数据](http://7xnnwn.com1.z0.glb.clouddn.com/%E6%B8%B8%E6%88%8F%E6%95%B0%E6%8D%AE.png)
这是我个人对游戏中的数据进行的一种划分。其中，游戏数据直接使用代码将表文件中的数据加载到内存，然后从内存中读取数据即可。玩家数据则分为了热数据和冷数据两部分分别进行存储，最大程度利用Mysql和Redis各自的优势。
## 游戏静态数据
在我们的这款游戏中，我们的静态数据配置在CSV表文件中，在服务器启动时，我读取所有的表文件，然后取出数据放到Map中，一般以一个标志性列（如ID）为key，一个JavaBean作为value放入到Map中。
读取CSV表文件步骤如下：
1.读取CSV文件
2.按一定格式对文件内容进行解析
3.将内容封装到JavaBean
4.存放数据到Map中
读取完了之后，在代码中如果需要，只需通过key在Map中来读取即可。
在项目中，我将整个过程进行了封装，封装成了dataConfig.xml文件、*.csv文件、JavaBean、CsvLoader.java、CsvParser.java和TempletService.java，添加一个CSV文件的步骤如下：
1.在dataConfig.xml中添加csv文件路径
2.创建一个和CSV文件中结构一模一样的JavaBean
3.服务器启动时调用CsvLoader的load()方法来加载所有的CSV文件
4.调用TempletService.listAll()方法，并传入Javabean的simpleName来加载CSV文件内容到List中
5.将List中的内容按一定结构存储（我一般都存为Map结构）
### dataConfig.xml
dataConfig.xml中存储所有CSV表的路径，在CsvLoader.java中直接对这个xml表中的路径下的CSV文件进行读取加载。
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
    <file name="Card.csv" />
    <file name="Equip.csv" />
    <!--省略更多CSV表-->
</config>
```
### CSV文件
CSV文件中存储具体的游戏数据，这个数据表一般是由数值策划来进行配置。CSV表的本质就是按逗号进行分割的数据，如下是卡牌表的前两行数据。
```csv
卡牌ID,卡牌名称,英雄动画名称,卡牌兵种name,卡牌兵种类型,卡牌兵种美术资源ID,品质编号,所属势力,英雄等级,英雄升星等级,技能id,统,勇,智,初始兵力,初始攻击力,兵力,攻击力,克制系数,被克制系数,移动速度,爆击率,爆击倍数,普攻伤害加深,普攻伤害减免,技能伤害加深,技能伤害减免,普攻伤害点数,普攻免伤点数,技能伤害点数,技能减伤点数,KPI,技能名称,技能描述：目标 目标个数（范围）效果数值buff描述,英雄定位
CardId,CardName,CardFlashName,CardSoldName,CardSoldID,CardSoldFlashID,RMBID,CountryID,CardLv,CardStar,SkillID,Tong,Yong,Zhi,HpStar,AttackStar,Hp,Attack,Kezhi,Beikezhi,Speed,Crit,Double,AttackAddbaifen,Attackreducebaifen,SkillAddbaifen,Skillreducebaifen,AttackNum,AttackreduceNum,SkillAddNum,SkillreduceNum,KPI,SkillName,SkillDes,HeroLocal
200001,吕布,lvbu,骑兵,2,4,8,4,1,1,200001,105,110,90,344,70,2.22,2.26,0.17,0.43,385,0.16,1.44,0.176,0.144,0.176,0.144,0,0,0,0,1000,猛将无双,对敌方所有目标造成 1倍伤害并且全体晕眩3秒
200002,赵云,zhaoyun,步兵,3,1,8,2,1,1,200002,103,106,100,381,62,2.464,2.008,0.31,0.29,300,0.16,1.44,0.128,0.208,0.128,0.208,0,0,0,0,1000,枪出如龙,对敌方目标造成3次0.5倍伤害并提升自身50%爆击率持续4秒
```
### JavaBean
添加了CSV文件之后，我们需要创建一个和CSV表结构一模一样的JavaBean，如下是卡牌表对应的JavaBean。
```java
package com.kidbear._36.template;

public class Card {
    private int CardId;
    private String CardName;
    private String CardFlashName;
    private String CardSoldName;
    private int CardSoldID;
    private int CardSoldFlashID;
    private int RMBID;
    private int CountryID;
    private int CardLv;
    private int CardStar;
    private int SkillID;
    private int Tong;
    private int Yong;
    private int Zhi;
    private int HpStar;
    private int AttackStar;
    private float Hp;
    private float Attack;
    private float Kezhi;
    private float Beikezhi;
    private int Speed;
    private float Crit;
    private float Double;
    private float AttackAddbaifen;
    private float Attackreducebaifen;
    private float SkillAddbaifen;
    private float Skillreducebaifen;
    private float AttackreduceNum;
    private float AttackNum;
    private float SkillAddNum;
    private float SkillreduceNum;
    private int KPI;

    // getter/setter

}
```
### CsvDataLoader.java
CsvDataLoader封装了对CSV数据的载入，包括使用SAXReader对dataConfig.xml文件的读取，以及对其中的CSV文件的内容的读取，代码如下：
```java
package com.kidbear._36.util.csv;

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

import com.kidbear._36.core.GameInit;

public class CsvDataLoader {
    public static Logger logger = LoggerFactory.getLogger(CsvDataLoader.class);
    private String packageName;
    private String config; // 每一行就是一个配置文件名字
    public static int ActivityMaxValue;
    private static CsvDataLoader inst;

    public CsvDataLoader(String packageName, String config) {
        this.packageName = packageName;
        this.config = config;
    }

    public static CsvDataLoader getInstance(String packageName, String config) {
        if (inst == null) {
            inst = new CsvDataLoader(packageName, config);
        }
        return inst;
    }

    /**
     * 调用load方法加载所有的配置文件
     */
    public void load() {
        SAXReader reader = new SAXReader();
        InputStream resourceStream = this.getClass().getResourceAsStream(
                this.config);
        InputStreamReader resourceStreamReader = new InputStreamReader(
                resourceStream);
        try {
            Document doc = reader.read(resourceStreamReader);
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
            if (resourceStreamReader != null) {
                try {
                    resourceStreamReader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (resourceStream != null) {
                try {
                    resourceStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private List<?> loadFile(String file, boolean exitWhenFail) {// 读文件
        InputStream resourceAsStream = null;
        try {
            String clzName = file.replaceAll(".csv", "");
            file = GameInit.confFileBasePath + file;
            logger.info("load file: {}", file);
            // resourceAsStream = this.getClass().getResourceAsStream(file);
            resourceAsStream = this.getClass().getClassLoader()
                    .getResource(file).openStream();
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
            if (resourceAsStream != null) {
                try {
                    resourceAsStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
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
        CsvDataLoader dl = new CsvDataLoader("com.kidbear._36.template.",
                "/dataConfig.xml");
        dl.load();
    }
}
```
### CsvParser
CsvDataLoader中用到的CsvParser是具体对CSV文件按逗号分割的格式的解析的类，代码如下：
```java
package com.kidbear._36.util.csv;

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
}
```
### TempletService.java
服务器启动时，调用CsvDataLoader的load()方法，以完成对CSV文件的加载，之后就需要使用TempletService的listAll方法来讲数据加载到List中，TempletService根据JavaBean的simpleName来对数据进行加载，代码如下：
```java
package com.kidbear._36.util.csv;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 添加一个数据表需要做以下几步 
 * 1.在包com.kidbear._36.template下创建对应的模板类，类名与数据文件一致 
 * 2.在src/main/resources/csv/中添加模板数据文件
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
### 使用静态数据
在完成了添加和加载等一系列操作之后，就可以在代码中调用CSV表中加载进来的数据了，例如上文提到的卡牌数据表，加载代码如下：
```java
// 卡牌数据表
List<Card> cardList = TempletService
                .listAll(Card.class.getSimpleName());
Map<Integer, Card> cardMap = new HashMap<Integer, Card>();
for (Card card : cardList) {
    cardMap.put(card.getCardId(), card);
}
this.cardMap = cardMap;
```
使用时只需要根据卡牌的Id，就可以取到这张卡牌的所有数据。
## Mysql存储数据
我们使用Mysql作为冷数据的存储数据库，并使用Druid和Hibernate来创建数据库的连接以及增删改查的操作。在游戏数据中，我对游戏中的冷数据做了一个总结，如下图所示：
![Mysql数据](http://7xnnwn.com1.z0.glb.clouddn.com/Mysql%E6%95%B0%E6%8D%AE.png)
完成要存储的游戏数据的分析之后，我们就可以进行具体建模建表的工作，完成对数据的设计。由于在游戏服务器的数据存储中，数据库基本上只是一个游戏数据临时存放的地方，所以游戏数据中的关联性并不是特别强，所以不需要严密的数据库设计，只需简单的将玩家所有的数据按照一个userid进行关联即可，在使用Hibernate的时候，我们使用了Hibernate4，使用了它注解JavaBean自动建表的功能，我们只需将需要存储的Model写成JavaBean，并写上注解，在启动时，Hibernate扫描到JavaBean会自动为我们创建或更新表。
### Druid数据库连接池
游戏服务器运行中经常是多个玩家同时在线的，可想而知，如果同时进行某一项涉及数据库的操作时，也会并发请求数据库，多个数据库请求就需要我们对多个数据库连接进行有效的管理，当然，我们可以自己写一个数据库卡连接池来进行数据库管理，但好在以后前辈为我们做足了工作，有很多成型的开源数据库连接池可供我们选择，常见的有c3p0、dbcp、proxool和driud等，这里我们使用阿里巴巴公司的开源产品Druid，这是我个人认为最好用的数据库连接池，它不仅提供了数据库连接池应有的功能，更是提供了良好的数据库监控性能，这是我们作为开发人员在遇到性能瓶颈时最需要的东西，感兴趣的朋友可以参考下官方github，根据官方wiki配置一个Druid的数据监控系统，通过系统可以查看数据库的各种性能指标。
Druid在github中的地址是：https://github.com/alibaba/druid
在项目中使用druid，首先我们需要导入druid所需jar包以及Mysql的驱动jar包，由于我们是maven项目，我们就直接添加pom依赖，代码如下：
```xml
<!--Mysql驱动-->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.22</version>
    <scope>runtime</scope>
</dependency>
<!--数据库连接池-->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>0.2.26</version>
</dependency>
```
在spring的xml中对druid进行配置
```xml
<bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource"
        init-method="init" destroy-method="close">
    <property name="url" value="${jdbc.url}" />
    <property name="username" value="${jdbc.user}" />
    <property name="password" value="${jdbc.password}" />
    <property name="maxActive" value="${jdbc.maxActive}" />
    <property name="initialSize" value="${jdbc.initialSize}" />
    <!-- 配置获取连接等待超时的时间 -->
    <property name="maxWait" value="${jdbc.maxWait}" />
    <!-- 配置间隔多久才进行一次检测，检测需要关闭的空闲连接，单位是毫秒 -->
    <property name="timeBetweenEvictionRunsMillis" value="${jdbc.timeBetweenEvictionRunsMillis}" />
    <!-- 配置一个连接在池中最小生存的时间，单位是毫秒 -->
    <property name="minEvictableIdleTimeMillis" value="${jdbc.minEvictableIdleTimeMillis}" />
    <!--过滤 -->
    <property name="filters" value="config,wall,mergeStat" />
    <!--密码加密 -->
    <!-- property name="connectionProperties" value="config.decrypt=true" / -->
    <!--合并多个数据源 -->
    <property name="useGloalDataSourceStat" value="true" />
    <property name="proxyFilters">
        <list>
            <ref bean="log-filter" />
            <ref bean="stat-filter" />
        </list>
    </property>
</bean>
<bean id="log-filter" class="com.alibaba.druid.filter.logging.Log4jFilter">
    <property name="statementLogErrorEnabled" value="true" />
    <property name="statementLogEnabled" value="true" />
</bean>
<bean id="stat-filter" class="com.alibaba.druid.filter.stat.StatFilter">
    <property name="slowSqlMillis" value="1000" />
    <property name="logSlowSql" value="true" />
</bean>
```
然后需要在web.xml中再对druid的filter进行配置：
```xml
<filter>
    <filter-name>DruidWebStatFilter</filter-name>
    <filter-class>com.alibaba.druid.support.http.WebStatFilter</filter-class>
<init-param>
    <param-name>exclusions</param-name>
    <param-value>weburi.json,.html,.js,.gif,.jpg,.png,.css,.ico,/fonts/*,/datas/*,images/*</param-value>
</init-param>
<init-param>
    <param-name>sessionStatMaxCount</param-name>
    <param-value>1000</param-value>
</init-param>
<init-param>
    <param-name>principalSessionName</param-name>
    <param-value>FRONT_USER</param-value>
</init-param>
</filter>
<filter-mapping>
    <filter-name>DruidWebStatFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
<servlet>
    <servlet-name>DruidStatView</servlet-name>
    <servlet-class>com.alibaba.druid.support.http.StatViewServlet</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>DruidStatView</servlet-name>
    <url-pattern>/druid/*</url-pattern>
</servlet-mapping>
```
至此为止，Druid的配置就算是完成，启动工程之后我们还能通过/druid路径来访问Druid提供的监控系统，更多关于Druid的使用可以参照github中的wiki介绍，了解更多Druid配置及参数设置。
### Hibernate
使用Hibernate作为Mysql数据库的ORM框架，主要是因为其良好的封装，首先我个人认为Hibernate的性能是不足与和原生JDBC以及MyBatis这样的框架所匹敌的，封装的更好却带来了更多的性能损失，但我使用他也是看中他良好的封装性，因为我对性能的需求还没有达到很高的级别；其次，Hibernate很难写出复杂的SQL查询，而MyBatis却可以写出一些复杂的SQL，但在我的设计中，我不需要太复杂的查询，基本上我所有的SQL语句的where条件都是"where userid=?"，因此在性能需求上以及易用的对比上，我选择了Hibernate。
我使用的版本你是Hibernate4，因为Hibernate4提供了注解自动创建表的功能，Hibernate集成在spring的配置的xml代码如下：
```xml
<!-- 定义事务管理 -->
<bean id="transactionManager"
    class="org.springframework.orm.hibernate4.HibernateTransactionManager">
    <property name="sessionFactory" ref="sessionFactory" />
</bean>
<tx:advice id="txAdvice" transaction-manager="transactionManager">
    <tx:attributes>
        <!-- 事务执行方式 REQUIRED：指定当前方法必需在事务环境中运行， 如果当前有事务环境就加入当前正在执行的事务环境， 如果当前没有事务，就新建一个事务。 
            这是默认值。 -->
        <tx:method name="create*" propagation="REQUIRED" />
        <tx:method name="save*" propagation="REQUIRED" />
        <tx:method name="add*" propagation="REQUIRED" />
        <tx:method name="update*" propagation="REQUIRED" />
        <tx:method name="remove*" propagation="REQUIRED" />
        <tx:method name="del*" propagation="REQUIRED" />
        <tx:method name="import*" propagation="REQUIRED" />
        <!-- 指定当前方法以非事务方式执行操作，如果当前存在事务，就把当前事务挂起，等我以非事务的状态运行完，再继续原来的事务。 查询定义即可 
            read-only="true" 表示只读 -->
        <tx:method name="*" propagation="NOT_SUPPORTED" read-only="true" />
    </tx:attributes>
</tx:advice>
<!-- hibernate SessionFactory -->
<bean id="sessionFactory"
    class="org.springframework.orm.hibernate4.LocalSessionFactoryBean">
    <!-- 数据源 -->
    <property name="dataSource" ref="dataSource" />
    <!-- hibernate的相关属性配置 -->
    <property name="hibernateProperties">
        <value>
            <!-- 设置数据库方言 -->
            hibernate.dialect=org.hibernate.dialect.MySQLDialect
            <!-- 设置自动创建|更新|验证数据库表结构 -->
            hibernate.hbm2ddl.auto=update
            <!-- 是否在控制台显示sql -->
            hibernate.show_sql=false
            <!-- 是否格式化sql，优化显示 -->
            hibernate.format_sql=false
            <!-- 是否开启二级缓存 -->
            hibernate.cache.use_second_level_cache=false
            <!-- 是否开启查询缓存 -->
            hibernate.cache.use_query_cache=false
            <!-- 数据库批量查询最大数 -->
            hibernate.jdbc.fetch_size=50
            <!-- 数据库批量更新、添加、删除操作最大数 -->
            hibernate.jdbc.batch_size=50
            <!-- 是否自动提交事务 -->
            hibernate.connection.autocommit=true
            <!-- 指定hibernate在何时释放JDBC连接 -->
            hibernate.connection.release_mode=auto
            <!-- 创建session方式 hibernate4.x 的方式 -->
            hibernate.current_session_context_class=thread
            <!-- javax.persistence.validation.mode默认情况下是auto的，就是说如果不设置的话它是会自动去你的classpath下面找一个bean-validation**包 
                所以把它设置为none即可 -->
            javax.persistence.validation.mode=none
        </value>
    </property>
    <!-- 自动扫描实体对象 tdxy.bean的包结构中存放实体类 -->
    <property name="packagesToScan" value="com.kidbear._36" />
</bean>
```
配置完了之后，我们需要对我们需要进行存储的数据进行注解，如君主信息的Model如下：
```java
package com.kidbear._36.manager.junzhu;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import com.kidbear._36.util.cache.MCSupport;

@Entity
@Table(name = "JunZhu")
public class JunZhu implements MCSupport {
    // id，用户id，用户名字，用户所属国家，用户头像（用数字表示），用户等级，用户vip等级，用户军令数，用户金宝，用户银宝，用户粮食，用户精铁，用户木材，
    // 用户兵数量，用户军工数，用户将魂数
    private static final long serialVersionUID = -5385044598250102957L;
    @Id
    public long id;// —用户id
    public String name;// — 用户名
    @Column(columnDefinition = "INT default 1")
    public int headImg;// —用户头像
    public int role;// —用户角色
    public int country;// —用户所属国家 1表示蜀国 2表示魏国 3表示吴国
    @Column(columnDefinition = "INT default 0")
    public int exp;// —用户等级 —君主等级
    @Column(columnDefinition = "INT default 1")
    public int level;// —用户等级 —君主等级
    @Column(columnDefinition = "INT default 0")
    public int vip;// —用户vip等级
    @Column(columnDefinition = "INT default 0")
    public int vipExp;// —用户vip经验
    @Column(columnDefinition = "INT default 0")
    public int junling;// —用户军令数
    @Column(columnDefinition = "INT default 0")
    public int coin;// —用户金币
    @Column(columnDefinition = "INT default 0")
    public int yuanbao;// —用户元宝
    @Column(columnDefinition = "INT default 0")
    public int food;// —用户粮食
    @Column(columnDefinition = "INT default 0")
    public int iron;// —用户精铁
    @Column(columnDefinition = "INT default 0")
    public int wood;// —用户木材
    @Column(columnDefinition = "INT default 0")
    public int soldierNum;// —用户兵力
    @Column(columnDefinition = "INT default 0")
    public int jungongNum;// —用户军功数
    @Column(columnDefinition = "INT default 0")
    public int jianghunNum;// —将魂数量
    @Column(columnDefinition = "INT default 0")
    public int shengwang;// —声望
    @Column(columnDefinition = "INT default 0")
    public int zxId;// —阵型id
    @Column(columnDefinition = "INT default 0")
    public int paySum;// -充值总额
    @Column(columnDefinition = "INT default 0")
    public int conduction;// -新手引导

    // getter/setter
}
```
以上代码中，@Entity和@Table(name = "JunZhu")就可以使Hibernate在启动时自动创建一个JunZhu表，@Id的属性即设为主键的字段。创建好Model之后，就可以使用Hibernate的session进行数据库操作，这里我将数据库的操作封装为一个工具类HibernateUtil，这个工具类大家可以拿去直接使用，具体代码如下：
```java
package com.kidbear._36.util.hibernate;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONObject;

import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.annotations.Where;
import org.hibernate.transform.Transformers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

import com.alibaba.fastjson.JSON;
import com.kidbear._36.core.GameInit;
import com.kidbear._36.manager.card.CardInfo;
import com.kidbear._36.manager.equip.EquipInfo;
import com.kidbear._36.manager.mail.MailInfo;
import com.kidbear._36.manager.pve.PveInfo;
import com.kidbear._36.manager.zhenxing.ZhenXingInfo;
import com.kidbear._36.manager.zhenxing.ZhenxingMgr;
import com.kidbear._36.task.ExecutorPool;
import com.kidbear._36.util.cache.MC;
import com.kidbear._36.util.cache.MCSupport;
import com.kidbear._36.util.memcached.MemcachedCRUD;

public class HibernateUtil {
    public static boolean showMCHitLog = false;
    public static Logger log = LoggerFactory.getLogger(HibernateUtil.class);
    public static Map<Class<?>, String> beanKeyMap = new HashMap<Class<?>, String>();
    public static long synDelayT = 0;// 延迟同步周期
    private static SessionFactory sessionFactory;

    public static void init() {
        sessionFactory = buildSessionFactory();
    }

    public static SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    public static Throwable insert(Object o, long id) {
        Session session = sessionFactory.getCurrentSession();
        session.beginTransaction();
        try {
            session.save(o);
            session.getTransaction().commit();
            if (MC.cachedList.contains(o.getClass().getSimpleName())) {
                synMC4Insert(o.getClass().getSimpleName(), o,
                        String.valueOf(id));
            }
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
    public static Throwable save(Object o, long id) {
        Session session = sessionFactory.getCurrentSession();
        Transaction t = session.beginTransaction();
        boolean mcOk = false;
        try {
            if (o instanceof MCSupport) {
                MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
                MC.update(o, String.valueOf(s.getIdentifier()));// MC中控制了哪些类存缓存。
                mcOk = true;
                // session.update(o);
                session.saveOrUpdate(o);
            } else {
                session.saveOrUpdate(o);
            }
            t.commit();
            if (o instanceof MCSupport) {
                if (MC.cachedList.contains(o.getClass().getSimpleName())) {
                    synMC4Save(o.getClass().getSimpleName(), o,
                            String.valueOf(id));
                }
            }
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

    public static Throwable update(Object o, String id) {
        Session session = sessionFactory.getCurrentSession();
        Transaction t = session.beginTransaction();
        try {
            if (o instanceof MCSupport) {
                MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
                MC.update(o, String.valueOf(s.getIdentifier()));// MC中控制了哪些类存缓存。
                session.update(o);
            } else {
                session.update(o);
            }
            t.commit();
            if (o instanceof MCSupport) {
                if (MC.cachedList.contains(o.getClass().getSimpleName())) {
                    synMC4Update(o.getClass().getSimpleName(), o,
                            String.valueOf(id));
                }
            }
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
        T ret = MC.get(t, String.valueOf(id));
        if (ret == null) {
            if (showMCHitLog)
                log.info("MC未命中{}#{}", t.getSimpleName(), id);
            ret = find(t, "where " + keyField + "=" + id, false);
            if (ret != null) {
                if (showMCHitLog)
                    log.info("DB命中{}#{}", t.getSimpleName(), id);
                MC.add(ret, String.valueOf(id));
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
        // if (checkMCControl && MC.cachedClass.contains(t)) {
        // // 请使用static <T> T find(Class<T> t,long id)
        // throw new BaseException("由MC控制的类不能直接查询DB:" + t);
        // }
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

    public static <T> List<T> list(Class<T> t, long id, String where) {
        String keyField = getKeyField(t);
        if (keyField == null) {
            throw new RuntimeException("类型" + t + "没有标注主键");
        }
        if (!MC.cachedList.contains(t.getSimpleName())) {
            return list(t, where, false);
        }
        List<T> ret = MC.getList(t, String.valueOf(id), where);
        if (ret == null) {
            if (showMCHitLog)
                log.info("MC未命中{}#{}", t.getSimpleName(), where);
            ret = list(t, where, false);
            if (ret != null) {
                if (showMCHitLog)
                    log.info("DB命中{}#{}", t.getSimpleName(), where);
                MC.addList(ret, t.getSimpleName(), String.valueOf(id), where);
            } else {
                if (showMCHitLog)
                    log.info("DB未命中{}#{}", t.getSimpleName(), where);
            }
        } else {
            if (showMCHitLog)
                log.info("MC命中{}#{}", t.getSimpleName(), where);
        }
        return ret;
    }

    /**
     * @param t
     * @param where
     *            例子： where uid>100
     * @return
     */
    public static <T> List<T> list(Class<T> t, String where,
            boolean checkMCControl) {
        // if (checkMCControl && MC.cachedList.contains(t)) {
        // // 请使用static <T> T find(Class<T> t,long id)
        // throw new BaseException("由MC控制的类不能直接查询DB:" + t);
        // }
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

    public static Throwable delete(Object o, long id) {
        if (o == null) {
            return null;
        }
        Session session = sessionFactory.getCurrentSession();
        session.beginTransaction();
        try {
            session.delete(o);
            session.getTransaction().commit();
            if (o instanceof MCSupport) {
                MCSupport s = (MCSupport) o;// 需要对控制了的对象在第一次存库时调用MC.add
                MC.delete(o.getClass(), String.valueOf(s.getIdentifier()));// MC中控制了哪些类存缓存。
                if (MC.cachedList.contains(o.getClass().getSimpleName())) {
                    synMC4Delete(o.getClass().getSimpleName(), o,
                            String.valueOf(id));
                }
            }
        } catch (Throwable e) {
            log.error("要删除的数据{}", o);
            log.error("出错", e);
            session.getTransaction().rollback();
            return e;
        }
        return null;
    }

    /**
     * 注意这个方法会返回大于等于1的值。数据库无记录也会返回1，而不是null
     * 
     * @param t
     * @return
     */
    public static <T> Long getTableIDMax(Class<T> t) {
        Long id = null;
        Session session = sessionFactory.getCurrentSession();
        Transaction tr = session.beginTransaction();
        String hql = "select max(id) from " + t.getSimpleName();
        try {
            Query query = session.createQuery(hql);
            Object uniqueResult = query.uniqueResult();
            if (uniqueResult == null) {
                id = 1L;
            } else {
                id = Long.parseLong(uniqueResult + "");
                id = Math.max(1L, id);
            }
            tr.commit();
        } catch (Exception e) {
            tr.rollback();
            log.error("query max id fail for {} {}", t, hql);
            log.error("query max id fail", e);
        }
        return id;
    }

    public static List<Map<String, Object>> querySql(String hql) {
        Session session = sessionFactory.getCurrentSession();
        Transaction tr = session.beginTransaction();
        List list = Collections.emptyList();
        try {
            SQLQuery query = session.createSQLQuery(hql);
            query.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
            list = query.list();
            tr.commit();
        } catch (Exception e) {
            tr.rollback();
            log.error("query  failed {}", hql);
            log.error("query count(type) fail", e);
        }
        return list;
    }
}
```
以上代码中，除了调用session的数据库操作API之外，我还使用了Memcache进行结果集的缓存，具体关系Memcache和Mysql的集合使用，在下文中在进行讲解。上文代码中首先在服务器启动时，需要构建SessionFactory，然后通过操作session开始事务，通过session调用CRUD方法进行操作，之后再调用commit方法提交并结束事务，中间如果发生异常则进行rollback操作回滚事务。
## Redis存储数据
游戏中的热数据的存储我选用了Redis，Redis不仅是运行在内存上的内存数据库，并且它的数据存储结构也是很丰富的，包括String，Set，List，Sorted Set和Hash五种数据结构，我对游戏数据的热数据进行了分析，如下图：
![Redis数据](http://7xnnwn.com1.z0.glb.clouddn.com/Redis%E6%95%B0%E6%8D%AE.png)
使用Redis首先得了解Redis的五种基本数据类型，每一种数据类型都对应不同的Redis操作API，在Java中使用Redis可以使用官方提供的Jedis客户端，Jedis客户端中包含了各种数据类型的操作，我将所有的Redis操作都封装在了Redis类中，启动时调用init方法进行Redis连接，使用时通过getInstance获取实例，再调用相应的API即可完成相关的Redis操作，在init方法中，我是通过调用JedisSentinelPool去获取Redis的连接，因为我在服务器对Redis做了Sentinel的集群部署，大家可以直接拿这个Redis工具类去使用，Redis类的方法如下：
```java
package com.kidbear._36.util.redis;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.beanutils.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisSentinelPool;
import redis.clients.jedis.Tuple;

import com.kidbear._36.core.GameInit;

public class Redis {
    private static Redis instance;
    public static Logger log = LoggerFactory.getLogger(Redis.class);
    public static final int GLOBAL_DB = 0;// 全局
    public static final int LOGIC_DB = GameInit.serverId;// 模块库
    public static String password = null;

    public static Redis getInstance() {
        if (instance == null) {
            instance = new Redis();
        }
        return instance;
    }

    // private JedisPool pool;
    private JedisSentinelPool sentinelPool;
    public String host;
    public int port;

    // public int getDB(long userid){
    //
    // }

    public Jedis getJedis() {
        return this.sentinelPool.getResource();
    }

    public void returnResource(Jedis jedis) {
        jedis.close();
        // this.sentinelPool.returnResource(jedis);
    }

    public void init() {
        String redisServer = null;
        if (GameInit.cfg != null) {
            redisServer = GameInit.cfg.get("redisServer");
            password = GameInit.cfg.get("redisPwd");
        }
        if (redisServer == null) {
            redisServer = "127.0.0.1:6440";
        }
        redisServer = redisServer.trim();
        String[] tmp = redisServer.split(":");
        host = tmp[0];
        port = Integer.parseInt(tmp[1]);
        if (tmp.length == 2) {
            port = Integer.parseInt(tmp[1].trim());
        }
        log.info("Redis sentinel at {}:{}", host, port);
        // sentinelPool = new JedisPool(host, port);
        Set sentinels = new HashSet();
        sentinels.add(new HostAndPort(host, port).toString());
        sentinelPool = new JedisSentinelPool("master1", sentinels);
    }

    // private void init() {
    // String redisServer = null;
    // if (GameInit.cfg != null) {
    // redisServer = GameInit.cfg.get("redisServer");
    // password = GameInit.cfg.get("redisPwd");
    // }
    // if (redisServer == null) {
    // redisServer = "127.0.0.1:6379";
    // }
    // redisServer = redisServer.trim();
    // String[] tmp = redisServer.split(":");
    // host = tmp[0];
    // port = Integer.parseInt(tmp[1]);
    // if (tmp.length == 2) {
    // port = Integer.parseInt(tmp[1].trim());
    // }
    // log.info("Redis at {}:{}", host, port);
    // // sentinelPool = new JedisPool(host, port);
    // JedisPoolConfig config = new JedisPoolConfig();
    // sentinelPool = new JedisPool(config, host, port, 100000, password);
    // }

    public void test() {
        Jedis j = getJedis();
        j.auth(password);
        returnResource(j);
    }

    public void select(int index) {
        Jedis j = getJedis();
        j.auth(password);
        j.select(index);
        returnResource(j);
    }

    public boolean hexist(int db, String key, String field) {
        if (key == null) {
            return false;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        boolean ret = redis.hexists(key, field);
        returnResource(redis);
        return ret;
    }

    public Long hdel(int db, String key, String... fields) {
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        Long cnt = redis.hdel(key, fields);
        returnResource(redis);
        return cnt;
    }

    public String hget(int db, String key, String field) {
        if (key == null) {
            return null;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        String ret = redis.hget(key, field);
        returnResource(redis);
        return ret;
    }

    public Map<String, String> hgetAll(int db, String key) {
        if (key == null) {
            return null;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        Map<String, String> ret = redis.hgetAll(key);
        returnResource(redis);
        return ret;
    }

    public void hset(int db, String key, String field, String value) {
        if (field == null || field.length() == 0) {
            return;
        }
        if (value == null || value.length() == 0) {
            return;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        redis.hset(key, field, value);
        returnResource(redis);
    }

    public void add(int db, String group, String key, String value) {
        if (value == null || key == null) {
            return;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        redis.hset(group, key, value);
        returnResource(redis);
    }

    public void set(int db, String key, String value) {
        if (value == null || key == null) {
            return;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        redis.set(key, value);
        returnResource(redis);
    }

    public String get(int db, String key) {
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        String ret = redis.get(key);
        returnResource(redis);
        return ret;
    }

    /**
     * 添加元素到集合中
     * 
     * @param key
     * @param element
     */
    public boolean sadd(int db, String key, String... element) {
        if (element == null || element.length == 0) {
            return false;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        boolean success = redis.sadd(key, element) == 1;
        returnResource(redis);
        return success;
    }

    public boolean smove(int db, String oldKey, String newKey, String element) {
        if (element == null) {
            return false;
        }
        Jedis redis = getJedis();
        redis.auth(password);
        redis.select(db);
        boolean success = (redis.smove(oldKey, newKey, element) == 1);
        returnResource(redis);
        return success;
    }

    public static void destroy() {
        getInstance().sentinelPool.destroy();
    }

    // 中间省略一万字：中间都是Redis的各种API的操作，需要了解的朋友可以去看看Jedis的API文档
```
## Memcache数据结果集缓存
上文在介绍Hibernate中说到了Memcache对Mysql结果集的缓存，Memcache作为一种内存数据库，经常用作应用系统的缓存系统，我也将Memcache引入到项目作为Mysql数据结果集的缓存系统，其实在实现Memcache对Mysql查询的缓存的过程中，我曾进行了多种尝试，具体有以下几种缓存模型：
1.无缓存
这种方式不使用Memcache缓存，游戏服务器的操作直接穿透到Mysql中，这种方式在高并发环境下容易引起Mysql服务器高负载情况，如下图所示：
![缓存模型1](http://7xnnwn.com1.z0.glb.clouddn.com/%E5%AD%98%E5%82%A8%E6%A8%A1%E5%9E%8B1.png)
2.查询使用缓存，更新穿透到数据库，数据库同步数据到缓存
这种方式在客户端表现来看可以提供一部分速度，因为查询操作都是基于缓存的，但实际上Mysql的负担反而加大了，因为每一个更新请求，都需要Mysql同步最新的查询结果集给Memcache，因为每一个更新操作都会带来一个查询操作，当然这个同步过程可以使异步，但是就算我们感受不到这个同步的过程，但在实际上也是加大了数据库的负载，如下图所示：
![缓存模型2](http://7xnnwn.com1.z0.glb.clouddn.com/%E5%AD%98%E5%82%A8%E6%A8%A1%E5%9E%8B2.png)
3.更新和查询都使用缓存，缓存按策略与数据库进行同步
这种方式是比较好的方式，因为客户端的所有操作都是被缓存给拦截下来了，所有操作均是基于缓存，不会穿透到数据库，而缓存与数据库之间可以按照一定策略进行同步，如每5分钟同步一次数据到数据库等，具体同步策略可根据情况具体调整，当然这种方式的缺陷就是一旦服务器宕机，那么在上次同步到宕机这段时间之间的数据都会丢失，如下图所示：
![缓存模型3](http://7xnnwn.com1.z0.glb.clouddn.com/%E5%AD%98%E5%82%A8%E6%A8%A1%E5%9E%8B3.png)
4.更新和查询都是用缓存，更新操作同时穿透到数据库，数据库同步缓存的查询
这种方式是我最终使用的方式，虽然更新操作穿透到数据库，但是我可以在保证查询效率的同时，也保证数据的安全稳定性，因为每一步更新操作都是要进行数据库存储的，并且所有的查询操作可以直接在缓存中进行，如下图所示：
![缓存模型4](http://7xnnwn.com1.z0.glb.clouddn.com/%E5%AD%98%E5%82%A8%E6%A8%A1%E5%9E%8B4.png)

需要支持缓存的类需实现MCSupport接口：
```java
package com.kidbear._36.util.cache;

import java.io.Serializable;

/**
 * 实现此接口后还需要再MC类中增加cachedClass，并使用
 * com.qx.persistent.HibernateUtil.find(Class<T>, long)
 * 代替where进行查询。
 * 需要对控制了的对象在第一次存库时调用MC.add，再调用HIbernateUtil.insert
 * @author 何金成
 *
 */
public interface MCSupport extends Serializable{
    long getIdentifier();
}
```
Memcache的工具类MemcacheCRUD实现了Memcache的连接，以及add，update，delete等操作，具体代码如下：
```java
package com.kidbear._36.util.memcached;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.danga.MemCached.MemCachedClient;
import com.danga.MemCached.SockIOPool;
import com.kidbear._36.core.GameInit;

/**
 * @author 何金成
 */
public class MemcachedCRUD {

    protected static Logger logger = LoggerFactory
            .getLogger(MemcachedCRUD.class);
    public static String poolName = "gameDBPool";
    protected static MemCachedClient memCachedClient;
    protected static MemcachedCRUD memcachedCRUD = null;
    public static SockIOPool sockIoPool;

    private MemcachedCRUD() {
    }

    public void init() {
        sockIoPool = init(poolName, "cacheServer");
        memCachedClient = new MemCachedClient(poolName);
        // if true, then store all primitives as their string value.
        memCachedClient.setPrimitiveAsString(true);
    }

    public static SockIOPool init(String poolName, String confKey) {
        // 缓存服务器
        String cacheServers = null;
        if (GameInit.cfg != null) {
            cacheServers = GameInit.cfg.getServerByName(confKey);
        }
        String server[] = { "127.0.0.1:11211" };
        if (cacheServers == null || "".equals(cacheServers)) {
        } else {
            server[0] = cacheServers;
        }
        // 创建一个连接池
        SockIOPool pool = SockIOPool.getInstance(poolName);
        logger.info("连接池{}缓存配置 {}", poolName, Arrays.toString(server));
        pool.setServers(server);// 缓存服务器
        pool.setInitConn(50); // 初始化链接数
        pool.setMinConn(50); // 最小链接数
        pool.setMaxConn(500); // 最大连接数
        pool.setMaxIdle(1000 * 60 * 60);// 最大处理时间
        pool.setMaintSleep(3000);// 设置主线程睡眠时,每3秒苏醒一次，维持连接池大小
        pool.setNagle(false);// 关闭套接字缓存
        pool.setSocketTO(3000);// 链接建立后超时时间
        pool.setSocketConnectTO(0);// 链接建立时的超时时间
        pool.initialize();
        return pool;
    }

    public static void destroy() {
        sockIoPool.shutDown();
    }

    public static MemcachedCRUD getInstance() {
        if (memcachedCRUD == null) {
            memcachedCRUD = new MemcachedCRUD();
        }
        return memcachedCRUD;
    }

    private static final long INTERVAL = 100;

    public boolean exist(String key) {
        return memCachedClient.keyExists(key);
    }

    public boolean add(String key, Object o) {
        return memCachedClient.add(key, o);
    }

    public boolean update(String key, Object o) {
        return memCachedClient.replace(key, o);
    }

    public boolean saveObject(String key, Object msg) {
        boolean o = memCachedClient.keyExists(key);
        if (o) {// 存在替换掉
            return memCachedClient.replace(key, msg);
        } else {
            return memCachedClient.add(key, msg);
        }
    }

    public boolean keyExist(String key) {
        return memCachedClient.keyExists(key);
    }

    /**
     * delete
     * 
     * @param key
     */
    public boolean deleteObject(String key) {
        return memCachedClient.delete(key);
    }

    public Object getObject(String key) {
        Object obj = memCachedClient.get(key);
        return obj;
    }

    public static MemCachedClient getMemCachedClient() {
        return memCachedClient;
    }
}
```
使用Memcache进行缓存，则需要封装一个缓存的操作工具类MC，封装各种缓存操作方法，具体代码如下：
```java
package com.kidbear._36.util.cache;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson.JSON;
import com.kidbear._36.core.GameInit;
import com.kidbear._36.manager.bag.ItemInfo;
import com.kidbear._36.manager.building.BuildingInfo;
import com.kidbear._36.manager.card.CardInfo;
import com.kidbear._36.manager.equip.EquipInfo;
import com.kidbear._36.manager.junzhu.JunZhu;
import com.kidbear._36.manager.mail.MailInfo;
import com.kidbear._36.manager.pve.PveInfo;
import com.kidbear._36.manager.task.MainTaskInfo;
import com.kidbear._36.manager.tec.TecInfo;
import com.kidbear._36.manager.zhenxing.ZhenXingInfo;
import com.kidbear._36.util.memcached.MemcachedCRUD;

public class MC {
    /**
     * 控制哪些类进行memcached缓存。 被控制的类在进行创建时，需要注意调用MC的add和hibernate的insert。
     */
    public static Set<Class<? extends MCSupport>> cachedClass = new HashSet<Class<? extends MCSupport>>();
    public static Set<String> cachedList = new HashSet<String>();
    static {
        cachedClass.add(JunZhu.class);
        // 添加需要缓存find操作的类
    }
    static {
        cachedList.add(CardInfo.class.getSimpleName());
        // 添加需要缓存list操作的类
    }

    public static <T> T get(Class<T> t, String id) {
        if (!cachedClass.contains(t)) {
            return null;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(t.getSimpleName())
                .append("#").append(id);
        Object o = MemcachedCRUD.getInstance().getObject(key.toString());
        return (T) o;
    }

    public static <T> List<T> getList(Class<T> t, String id, String where) {
        if (!cachedList.contains(t.getSimpleName())) {
            return null;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(id).append("#")
                .append(t.getSimpleName()).append("#").append(where);
        Object o = MemcachedCRUD.getInstance().getObject(key.toString());
        return (List<T>) o;
    }

    public static <T> String getListKeys(String tName, String id) {
        if (!cachedList.contains(tName)) {
            return null;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(id).append("#")
                .append(tName);
        Object o = MemcachedCRUD.getInstance().getObject(key.toString());
        return (String) o;
    }

    public static Object getValue(String key) {
        Object o = MemcachedCRUD.getInstance().getObject(key);
        return o;
    }

    public static boolean add(Object t, String id) {
        if (!cachedClass.contains(t.getClass())) {
            return false;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#")
                .append(t.getClass().getSimpleName()).append("#").append(id);
        return MemcachedCRUD.getInstance().add(key.toString(), t);
    }

    public static boolean addList(List list, String tName, String id,
            String where) {
        if (!cachedList.contains(tName)) {
            return false;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(id).append("#")
                .append(tName);
        String c = key.toString();
        key.append("#").append(where);
        Object tmp = MemcachedCRUD.getInstance().getObject(c);
        String keys = tmp == null ? "" : (String) tmp;
        if (keys.equals("")) {
            MemcachedCRUD.getInstance().add(c, key.toString());
        } else if (!keys.contains(key.toString())) {
            MemcachedCRUD.getInstance().update(c, keys + "," + key.toString());
        }
        return MemcachedCRUD.getInstance().add(key.toString(), list);
    }

    public static boolean addKeyValue(String key, Object value) {
        return MemcachedCRUD.getInstance().add(key, value);
    }

    public static void update(Object t, String id) {
        if (!cachedClass.contains(t.getClass())) {
            return;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#")
                .append(t.getClass().getSimpleName()).append("#").append(id);
        MemcachedCRUD.getInstance().update(key.toString(), t);
    }

    public static boolean updateList(List list, String tName, String id,
            String where) {
        if (!cachedList.contains(tName)) {
            return false;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(id).append("#")
                .append(tName);
        String c = key.toString();
        key.append("#").append(where);
        Object tmp = MemcachedCRUD.getInstance().getObject(c);
        String keys = tmp == null ? "" : (String) tmp;
        if (keys.equals("")) {
            MemcachedCRUD.getInstance().add(c, key.toString());
        } else if (!keys.contains(key)) {
            MemcachedCRUD.getInstance().update(c, keys + "," + key.toString());
        }
        return MemcachedCRUD.getInstance().update(key.toString(), list);
    }

    /**
     * 根据主键删除缓存
     * 
     * @param obj
     *            删除对象
     * @param id
     *            主键id
     */
    public static void delete(Class clazz, String id) {
        if (!cachedClass.contains(clazz)) {
            return;
        }
        StringBuffer key = new StringBuffer();
        key.append(GameInit.serverId).append("#").append(clazz.getSimpleName())
                .append("#").append(id);
        MemcachedCRUD.getInstance().deleteObject(key.toString());
    }
}
```
以上代码中，find方法的缓存和list方法的缓存需要分别实现，find方法缓存只需要将类名和id作为key，对象作为value即可，而list的缓存不仅需要缓存所有的结果集，还需要缓存所有的where查询条件，根据类型查询出where条件，然后根据where条件分别进行缓存。
HibernateUtil中使用缓存部分的java代码如下，其中注释的方法为上面第二种缓存模型的实现（现已被我淘汰）：
```java
public static void synMC4Insert(String tName, Object o, String id) {
    String keys = MC.getListKeys(tName, id);
    if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
        String[] wheres = keys.split(",");
        for (String where : wheres) {
            where = where.split("#")[3];
            List list = MC.getList(o.getClass(), id, where);
            list.add(o);
            MC.updateList(list, tName, id, where);
        }
    }
}

public static void synMC4Save(String tName, Object o, String id) {
    String keys = MC.getListKeys(tName, id);
    if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
        String[] wheres = keys.split(",");
        for (String where : wheres) {
            where = where.split("#")[3];
            List list = MC.getList(o.getClass(), id, where);
            MCSupport mc = (MCSupport) o;
            boolean flag = false;
            int index = 0;
            for (Iterator iterator = list.iterator(); iterator.hasNext(); index++) {
                MCSupport tmpObj = (MCSupport) iterator.next();
                if (tmpObj.getIdentifier() == mc.getIdentifier()) {
                    list.set(index, o);
                    flag = true;
                }
            }
            if (!flag) {
                list.add(o);
            }
            MC.updateList(list, tName, id, where);
        }
    }
}

public static void synMC4Update(String tName, Object o, String id) {
    String keys = MC.getListKeys(tName, id);
    if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
        String[] wheres = keys.split(",");
        for (String where : wheres) {
            where = where.split("#")[3];
            List list = MC.getList(o.getClass(), id, where);
            MCSupport mc = (MCSupport) o;
            int index = 0;
            for (Iterator iterator = list.iterator(); iterator.hasNext(); index++) {
                MCSupport tmpObj = (MCSupport) iterator.next();
                if (tmpObj.getIdentifier() == mc.getIdentifier()) {
                    list.set(index, o);
                    break;
                }
            }
            MC.updateList(list, tName, id, where);
        }
    }
}

public static void synMC4Delete(String tName, Object o, String id) {
    String keys = MC.getListKeys(tName, id);
    if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
        String[] wheres = keys.split(",");
        for (String where : wheres) {
            where = where.split("#")[3];
            List list = MC.getList(o.getClass(), id, where);
            MCSupport mc = (MCSupport) o;
            for (Iterator iterator = list.iterator(); iterator.hasNext();) {
                MCSupport tmpObj = (MCSupport) iterator.next();
                if (tmpObj.getIdentifier() == mc.getIdentifier()) {
                    iterator.remove();
                    break;
                }
            }
            MC.updateList(list, tName, id, where);
        }
    }
}

// public static <T> void synchronizeDB2MemAsy(final Class<T> t,
// final String id) {
// ExecutorPool.dbThread.execute(new Runnable() {
// @Override
// public void run() {
// String keys = MC.getListKeys(t.getSimpleName(), id);
// if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
// String[] wheres = keys.split(",");
// for (String where : wheres) {
// where = where.split("#")[3];
// List<T> list = list(t, where, false);
// MC.updateList(list, t.getSimpleName(), id, where);
// if (showMCHitLog) {
// log.info("DB 同步 MC 成功 t:{},where:{}",
// t.getSimpleName(), where);
// }
// }
// }
// }
// });
// }
//
// public static <T> void synchronizeDB2MemSyn(final Class<T> t,
// final String id) {
// String keys = MC.getListKeys(t.getSimpleName(), id);
// if (keys != null && keys.length() > 0) {// 遍历所有的where缓存
// String[] wheres = keys.split(",");
// for (String where : wheres) {
// where = where.split("#")[3];
// List<T> list = list(t, where, false);
// MC.updateList(list, t.getSimpleName(), id, where);
// if (showMCHitLog) {
// log.info("DB 同步 MC 成功 t:{},where:{}", t.getSimpleName(),
// where);
// }
// }
// }
// }
```
## 总结
以上是本文对我们这款游戏中的数据管理的介绍，游戏服务器中的各种数据是多种多样的，我们应该根据各种数据的各种性质，合理利用进行存取，以保证不管什么类型的游戏数据，在我们的游戏服务器中都可以安全稳定的运行，数据安全，玩家才会放心！

