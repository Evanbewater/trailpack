const api = require("./api");

function saveSession(token, user) {
  wx.setStorageSync("token", token);
  wx.setStorageSync("user", user);
}

function getUser() {
  return wx.getStorageSync("user") || null;
}

function clearSession() {
  wx.removeStorageSync("token");
  wx.removeStorageSync("user");
}

function ensureLogin() {
  const token = wx.getStorageSync("token");
  if (token) {
    return Promise.resolve(getUser());
  }
  return login();
}

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error("wx.login 失败"));
          return;
        }
        try {
          const profile = await getUserProfileSafe();
          const nickname = profile?.nickName;
          const data = await api.wechatLogin(res.code, nickname);
          saveSession(data.token, data.user);
          resolve(data.user);
        } catch (wechatErr) {
          try {
            const data = await api.devLogin("小程序用户");
            saveSession(data.token, data.user);
            resolve(data.user);
          } catch (devErr) {
            reject(wechatErr);
          }
        }
      },
      fail: reject,
    });
  });
}

function getUserProfileSafe() {
  return new Promise((resolve) => {
    if (!wx.getUserProfile) {
      resolve(null);
      return;
    }
    wx.getUserProfile({
      desc: "用于展示昵称",
      success: (res) => resolve(res.userInfo),
      fail: () => resolve(null),
    });
  });
}

module.exports = {
  ensureLogin,
  login,
  getUser,
  clearSession,
  saveSession,
};
