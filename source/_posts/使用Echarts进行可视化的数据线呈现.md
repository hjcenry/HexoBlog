---
title: 使用Echarts进行可视化的数据线呈现
date: 2016-01-17 14:18
categories: Java
tags: [Java,Echarts,游戏服务器]
---
由于游戏后台需要统计游戏玩家的支付情况，恰好那天看见同学群里聊天说到了Echarts，于是我就看了眼，一看，哟，还是百度的产品，看了文档，示例，确实很屌的样子啊，于是自己就开始试了，个人还是觉得这个效果挺棒的，清晰地看清了各个渠道、<!--more-->每一天的统计情况，图表是可以放大缩小的，柱状图也能转为折线图，其实我只是用到了Echarts的冰山一角，这是个十分强大的图标工具，官网：http://echarts.baidu.com/ 各位去官网看看文档，看看示例，看看api，就知道这款工具有多么强大，他还支持h5，也就是说，用h5做手机app的时候，也可以在手机端呈现如此强大的报表功能
最终效果如下：
![效果图](http://upload-images.jianshu.io/upload_images/1472037-41a6ca06a2507dce?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
，我就分享一下我做的这个报表的源代码：
前端页面代码：

```html
<%@ page language="java" contentType="text/html; charset=UTF-8"
 pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<head>
<meta charset="utf-8">
<title>ECharts</title>
<style type="text/css">
#summary {
 font-family: "微软雅黑";
 padding-left:80px;
 padding-top:30px;
 padding-bottom:50px;
}
#summary ul li{
 margin: 10px;
}
#main{
 padding-top:50px
}
</style>
</head>
<body>
 <!-- 为ECharts准备一个具备大小（宽高）的Dom -->
 <div id="main" style="width: 95%; height: 80%"></div>
 <div id="summary">
  <h3>支付统计情况</h3>
  <ul>
   <li><h4>总金额（元）：${sum }</h4></li>
   <c:forEach items="${channelValMap }" var="pay">
    <li><span class="channel">${pay.key }</span>: <span>${pay.value }</span></li>
   </c:forEach>
  </ul>
 </div>
 <!-- ECharts单文件引入 -->
 <script type="text/javascript">
  $('span[class=channel]').each(function() {
   $(this).html(replaceChannelName($(this).html()));
  });
  function replaceChannelName(name) {
   if (name == 'ios-haima') {
    name = '海马玩（iOS）';
   } else if (name == 'android-haima') {
    name = '海马玩（安卓）';
   } else if (name == 'android-xiaomi') {
    name = '小米（安卓）';
   } else if (name == 'ios-xy') {
    name = 'xy（iOS）';
   } else if (name == 'ios-kuaiyong') {
    name = '快用（iOS）';
   } else if (name == 'android-360') {
    name = '360（安卓）';
   }
   return name;
  }
  $
    .ajax({
     type : "GET",
     dataType : "text",
     url : "../paymgr/payChartHandle",
     success : function(data) {
      var ret = JSON.parse(data);
      // 替换渠道名
      for ( var tmp in ret.channelCharts) {
       ret.channelCharts[tmp] = replaceChannelName(ret.channelCharts[tmp]);
      }
      //console.log("====");
      for ( var tmp in ret.payChartDatas) {
       ret.payChartDatas[tmp].name = replaceChannelName(ret.payChartDatas[tmp].name);
      }
      // 路径配置
      require.config({
       paths : {
        echarts : 'http://echarts.baidu.com/build/dist'
       }
      });
      // 使用
      require(
        [ 'echarts', 'echarts/chart/bar',
          'echarts/chart/line',
          'echarts/component/dataZoom' // 使用柱状图就加载bar模块，按需加载
        ],
        function(ec) {
         // 基于准备好的dom，初始化echarts图表
         var myChart = ec.init(document
           .getElementById('main'));
         var option = {
          tooltip : {
           trigger : 'item'
          },
          toolbox : {
           show : true,
           feature : {
            mark : {
             show : true
            },
            dataView : {
             show : true,
             readOnly : false
            },
            dataZoom : {
             show : true,
            },
            magicType : {
             show : true,
             type : [ 'line', 'bar',
               'stack', 'tiled' ]
            },
            restore : {
             show : true
            },
            saveAsImage : {
             show : true
            }
           }
          },
          calculable : true,
          grid : {
           top : '12%',
           left : '1%',
           right : '10%',
           containLabel : true
          },
          legend : {
           data : ret.channelCharts
          },
          xAxis : [ {
           name : '支付日期',
           type : 'category',
           data : ret.dateCharts
          } ],
          yAxis : [ {
           name : '金额(元)',
           type : 'value'
          } ],
          dataZoom : {
           type : 'inside',
           show : true,
           realtime : true,
           y : 36,
           height : 20,
           backgroundColor : 'rgba(221,160,221,0.5)',
           dataBackgroundColor : 'rgba(138,43,226,0.5)',
           fillerColor : 'rgba(38,143,26,0.6)',
           handleColor : 'rgba(128,43,16,0.8)',
           start : 20,
           end : 80
          },
          series : ret.payChartDatas
         };
         // 为echarts对象加载数据 
         myChart.setOption(option);
        });
     },
    });
 </script>
</body>
```

Java后台处理：
```java
@RequestMapping(value = "/payChart")
 public void payChart(Model model) {
  double sum = 0;
  // 总金额统计
  List<Map<String, Object>> channelSumList = HibernateUtil
    .querySql("select sum(amount) as sum,channel from Pay where isFinished=2 group by channel");
  Map<String, Double> channelValMap = new HashMap<String, Double>();
  for (Map<String, Object> tmpMap : channelSumList) {
   double tmpSum = (double) tmpMap.get("sum");
   channelValMap.put((String) tmpMap.get("channel"), tmpSum);
   sum += tmpSum;
  }
  model.addAttribute("sum", sum);
  model.addAttribute("channelValMap", channelValMap);
 }

 @RequestMapping(value = "/payChartHandle")
 @ResponseBody
 public String payChartHandle() {
  // 日期数据
  List<Map<String, Object>> dateList = HibernateUtil
    .querySql("select distinct date(payDate) as paydate from Pay where isFinished=2 order by date(payDate)");
  List<String> dateCharts = new ArrayList<String>();
  for (Map<String, Object> tmpData : dateList) {
   dateCharts.add(String.valueOf(tmpData.get("paydate")));
  }
  // 渠道数据
  List<Map<String, Object>> channelList = HibernateUtil
    .querySql("select distinct channel from Pay where isFinished=2");
  List<String> channelCharts = new ArrayList<String>();
  for (Map<String, Object> tmpChannel : channelList) {
   channelCharts.add(String.valueOf(tmpChannel.get("channel")));
  }
  // 渠道-金额数据
  List<PayChartData> payChartDatas = new ArrayList<PayChartData>();
  for (Map<String, Object> tmpMap : channelList) {
   List<Map<String, Object>> payList = HibernateUtil
     .querySql("select sum(amount) as paySum,date(payDate) as paydate from Pay where isFinished=2 and channel='"
       + tmpMap.get("channel")
       + "' group by date(payDate)");
   List<Double> sums = new ArrayList<Double>();
   for (String tmpDate : dateCharts) {
    boolean flag = false;
    for (Map<String, Object> tmpPay : payList) {
     if (tmpPay.get("paydate").toString().equals(tmpDate)) {
      sums.add((Double) tmpPay.get("paySum"));
      flag = true;
     }
    }
    if (!flag) {
     sums.add(0d);
    }
   }
   PayChartData tmpChartData = new PayChartData();
   tmpChartData.setData(sums);
   tmpChartData.setName(tmpMap.get("channel").toString());
   tmpChartData.setType("bar");
   payChartDatas.add(tmpChartData);
  }
  JSONObject ret = new JSONObject();
  ret.put("dateCharts", dateCharts);
  ret.put("channelCharts", channelCharts);
  ret.put("payChartDatas", payChartDatas);
  return JsonUtils.objectToJson(ret);
 }
```
其中PayChartData是一个JavaBean

```java
public class PayChartData {
 private String name;
 private String type;
 private List<Double> data;

 public String getName() {
  return name;
 }

 public void setName(String name) {
  this.name = name;
 }

 public String getType() {
  return type;
 }

 public void setType(String type) {
  this.type = type;
 }

 public List<Double> getData() {
  return data;
 }

 public void setData(List<Double> data) {
  this.data = data;
 }
}
```
然而看完官网你们就知道了，Echarts还能做更多更多的事，我所用到的不是过是其中一小部分而已，这是一个十分强大的报表插件。
