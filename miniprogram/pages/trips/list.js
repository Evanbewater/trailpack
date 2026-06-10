const api = require("../../utils/api");
const { ensureLogin } = require("../../utils/auth");

Page({
  data: { trips: [], loading: true, error: "" },

  onShow() {
    if (typeof this.getTabBar === "function") {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadTrips();
  },

  onPullDownRefresh() {
    this.loadTrips().finally(() => wx.stopPullDownRefresh());
  },

  async loadTrips() {
    this.setData({ loading: true, error: "" });
    try {
      await ensureLogin();
      const { trips } = await api.getTrips();
      this.setData({ trips, loading: false });
    } catch (e) {
      this.setData({
        loading: false,
        error: e.message || "加载失败",
      });
    }
  },

  goNew() {
    wx.navigateTo({ url: "/pages/trips/new" });
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/trips/detail?id=${id}` });
  },

  onLongPress(e) {
    const { id, title } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ["删除行程"],
      itemColor: "#f87171",
      success: async (res) => {
        if (res.tapIndex !== 0) return;
        wx.showModal({
          title: "删除行程",
          content: `确定删除「${title}」？`,
          confirmColor: "#ef4444",
          success: async (modal) => {
            if (!modal.confirm) return;
            try {
              await api.deleteTrip(id);
              wx.showToast({ title: "已删除" });
              this.loadTrips();
            } catch (err) {
              wx.showToast({ title: err.message || "删除失败", icon: "none" });
            }
          },
        });
      },
    });
  },
});
