const api = require("../../utils/api");
const { API_BASE } = require("../../utils/config");
const { ensureLogin, getUser, clearSession, login } = require("../../utils/auth");

Page({
  data: {
    user: null,
    tripCount: 0,
    aiCount: 0,
    apiBase: API_BASE,
  },

  onShow() {
    if (typeof this.getTabBar === "function") {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadProfile();
  },

  async loadProfile() {
    try {
      await ensureLogin();
      const user = getUser();
      const { trips } = await api.getTrips();
      this.setData({
        user,
        tripCount: trips.length,
        aiCount: trips.filter((t) => !t.demoMode).length,
      });
    } catch (_) {
      this.setData({ user: null, tripCount: 0, aiCount: 0 });
    }
  },

  async reLogin() {
    clearSession();
    try {
      await login();
      wx.showToast({ title: "登录成功" });
      this.loadProfile();
    } catch (e) {
      wx.showToast({ title: e.message || "登录失败", icon: "none" });
    }
  },

  logout() {
    clearSession();
    this.setData({ user: null, tripCount: 0, aiCount: 0 });
    wx.showToast({ title: "已退出" });
  },
});
