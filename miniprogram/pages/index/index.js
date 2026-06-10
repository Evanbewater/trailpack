const { ensureLogin } = require("../../utils/auth");

Page({
  data: {
    examples: [
      "川西四姑娘山二峰冲顶，2天1夜，11月，有雪线，3人轻装",
      "雨崩冰湖一日游，夏季，5人常规徒步",
      "武功山2日露营穿越，秋季，重装",
    ],
    workflow: [
      { label: "描述路线", detail: "像跟队友聊天，说说去哪、几天、什么季节", icon: "🥾" },
      { label: "解析条件", detail: "读懂海拔、雪线、露营与轻装需求", icon: "🏔️" },
      { label: "生成清单", detail: "按类别列出装备，勾选打包，支持分工", icon: "🎒" },
    ],
    features: [
      { title: "路线解析", desc: "天数、海拔、季节、冰雪与露营，山野条件一次读懂", icon: "🌲" },
      { title: "智能清单", desc: "AI 思考 + 规则引擎，高海拔到露营都有参考", icon: "⛅" },
      { title: "分工导出", desc: "领队队员各背什么，勾选进度，一键导出", icon: "⛺" },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === "function") {
      this.getTabBar().setData({ selected: 0 });
    }
    ensureLogin().catch(() => {});
  },

  goNew() {
    wx.navigateTo({ url: "/pages/trips/new" });
  },

  goList() {
    wx.switchTab({ url: "/pages/trips/list" });
  },

  fillExample(e) {
    const { text } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/trips/new?example=${encodeURIComponent(text)}`,
    });
  },
});
