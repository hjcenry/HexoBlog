var skillpage = 1;
var projectpage = 1;
var skillPageNum = 3;
var projectPageNum = 4;
var gzPageNum = 5;
var qxPageNum = 5;
var tjgdPageNum = 5;
var swzPageNum = 5;
var qxpage = 1;
var tjgdpage = 1;
var gzpage = 1;
var swzpage = 1;
$(document).ready(function() {
	// 工作技能翻页
	$("#skillpre").click(function() {
		if (skillpage > 1) {
			$("#skillpre").attr({
				"disabled": "disabled"
			});
			$(".skill" + skillpage + "").fadeOut(500, function() {
				$(".skill" + (skillpage - 1) + "").fadeIn(500);
				skillpage--;
				$("#skillNum").html(skillpage + "/" + skillPageNum);
				$("#skillpre").removeAttr("disabled"); //将按钮可用
			});
		}
	});
	$("#skillafter").click(function() {
		if (skillpage < skillPageNum) {
			$("#skillafter").attr({
				"disabled": "disabled"
			});
			$(".skill" + skillpage + "").fadeOut(500, function() {
				$(".skill" + (skillpage + 1) + "").fadeIn(500);
				skillpage++;
				$("#skillNum").html(skillpage + "/" + skillPageNum);
				$("#skillafter").removeAttr("disabled"); //将按钮可用
			});
		}
	});
	// 项目经验翻页
	$("#projectpre").click(function() {
		if (projectpage > 1) {
			$("#projectpre").attr({
				"disabled": "disabled"
			});
			$(".project" + projectpage + "").fadeOut(500, function() {
				$(".project" + (projectpage - 1) + "").fadeIn(500);
				// 图片切换
				$(".project" + projectpage + "img").fadeOut(500, function() {
					$(".project" + (projectpage - 1) + "img").fadeIn(500);
					projectpage--;
					$("#projectNum").html(projectpage + "/" + projectPageNum);
					$("#projectpre").removeAttr("disabled"); //将按钮可用
				});
			});
		}
	});
	$("#projectafter").click(function() {
		if (projectpage < projectPageNum) {
			$("#projectafter").attr({
				"disabled": "disabled"
			});
			$(".project" + projectpage + "").fadeOut(500, function() {
				$(".project" + (projectpage + 1) + "").fadeIn(500);
				// 图片切换
				$(".project" + projectpage + "img").fadeOut(500, function() {
					$(".project" + (projectpage + 1) + "img").fadeIn(500);
					projectpage++;
					$("#projectNum").html(projectpage + "/" + projectPageNum);
					$("#projectafter").removeAttr("disabled"); //将按钮可用
				});
			});
		}
	});
	// 英雄守卫战翻页
	$("#swzpre").click(function() {
		if (swzpage > 1) {
			$("#swzpre").attr({
				"disabled": "disabled"
			});
			swzpage--;
			$(".project" + projectpage + "img img").attr("src", "images/swz/" + swzpage + ".jpg");
			$("#swzNum").html(swzpage + "/" + swzPageNum);
			$("#swzpre").removeAttr("disabled"); //将按钮可用
		}
	});
	$("#swzafter").click(function() {
		if (swzpage < swzPageNum) {
			$("#swzafter").attr({
				"disabled": "disabled"
			});
			swzpage++;
			$(".project" + projectpage + "img img").attr("src", "images/swz/" + swzpage + ".jpg");
			$("#swzNum").html(swzpage + "/" + swzPageNum);
			$("#swzafter").removeAttr("disabled"); //将按钮可用
		}
	});
	// 国战三国志翻页
	$("#gzpre").click(function() {
		if (gzpage > 1) {
			$("#gzpre").attr({
				"disabled": "disabled"
			});
			gzpage--;
			$(".project" + projectpage + "img img").attr("src", "images/gz/" + gzpage + ".jpg");
			$("#gzNum").html(gzpage + "/" + gzPageNum);
			$("#gzpre").removeAttr("disabled"); //将按钮可用
		}
	});
	$("#gzafter").click(function() {
		if (gzpage < gzPageNum) {
			$("#gzafter").attr({
				"disabled": "disabled"
			});
			gzpage++;
			$(".project" + projectpage + "img img").attr("src", "images/gz/" + gzpage + ".jpg");
			$("#gzNum").html(gzpage + "/" + gzPageNum);
			$("#gzafter").removeAttr("disabled"); //将按钮可用
		}
	});
	// 七雄翻页
	$("#qxpre").click(function() {
		if (qxpage > 1) {
			$("#qxpre").attr({
				"disabled": "disabled"
			});
			qxpage--;
			$(".project" + projectpage + "img img").attr("src", "images/qx/" + qxpage + ".jpg");
			$("#qxNum").html(qxpage + "/" + qxPageNum);
			$("#qxpre").removeAttr("disabled"); //将按钮可用
		}
	});
	$("#qxafter").click(function() {
		if (qxpage < qxPageNum) {
			$("#qxafter").attr({
				"disabled": "disabled"
			});
			qxpage++;
			$(".project" + projectpage + "img img").attr("src", "images/qx/" + qxpage + ".jpg");
			$("#qxNum").html(qxpage + "/" + qxPageNum);
			$("#qxafter").removeAttr("disabled"); //将按钮可用
		}
	});
	// 天津广电翻页
	$("#tjgdpre").click(function() {
		if (tjgdpage > 1) {
			$("#tjgdpre").attr({
				"disabled": "disabled"
			});
			tjgdpage--;
			$(".project" + projectpage + "img img").attr("src", "images/tjgd/" + tjgdpage + ".png");
			$("#tjgdNum").html(tjgdpage + "/" + tjgdPageNum);
			$("#tjgdpre").removeAttr("disabled"); //将按钮可用
		}
	});
	$("#tjgdafter").click(function() {
		if (tjgdpage < tjgdPageNum) {
			$("#tjgdafter").attr({
				"disabled": "disabled"
			});
			tjgdpage++;
			$(".project" + projectpage + "img img").attr("src", "images/tjgd/" + tjgdpage + ".png");
			$("#tjgdNum").html(tjgdpage + "/" + tjgdPageNum);
			$("#tjgdafter").removeAttr("disabled"); //将按钮可用
		}
	});
});