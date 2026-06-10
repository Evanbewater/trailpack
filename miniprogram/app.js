const { ensureLogin } = require("./utils/auth");

App({
  globalData: {
    user: null,
  },
  onLaunch() {
    ensureLogin()
      .then((user) => {
        this.globalData.user = user;
      })
      .catch(() => {
        // 首页会提示登录
      });
  },
});
