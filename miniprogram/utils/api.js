const { API_BASE } = require("./config");

const LONG_TIMEOUT = 120000;

function getToken() {
  return wx.getStorageSync("token") || "";
}

function request(path, options = {}) {
  const { method = "GET", data, auth = true, timeout = 30000 } = options;
  const header = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) header.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${path}`,
      method,
      data,
      header,
      timeout,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || `请求失败 ${res.statusCode}`));
        }
      },
      fail(err) {
        const msg = err.errMsg || "网络错误";
        if (msg.includes("timeout")) {
          reject(new Error("请求超时，AI 生成较慢请稍后重试"));
        } else {
          reject(new Error(msg));
        }
      },
    });
  });
}

module.exports = {
  getTrips: () => request("/api/trips"),
  createTrip: (rawDescription) =>
    request("/api/trips", { method: "POST", data: { rawDescription } }),
  getTrip: (id, version) =>
    request(
      version ? `/api/trips/${id}?version=${version}` : `/api/trips/${id}`,
    ),
  getVersions: (id) => request(`/api/trips/${id}/versions`),
  deleteTrip: (id) => request(`/api/trips/${id}`, { method: "DELETE" }),
  parseTrip: (id) =>
    request(`/api/trips/${id}/parse`, { method: "POST", timeout: LONG_TIMEOUT }),
  generateTrip: (id) =>
    request(`/api/trips/${id}/generate`, {
      method: "POST",
      timeout: LONG_TIMEOUT,
    }),
  updateRoute: (id, parsedRoute) =>
    request(`/api/trips/${id}`, {
      method: "PATCH",
      data: { parsedRoute },
    }),
  updateItem: (tripId, itemId, patch) =>
    request(`/api/trips/${tripId}/items/${itemId}`, {
      method: "PATCH",
      data: patch,
    }),
  toggleItem: (tripId, itemId, checked) =>
    request(`/api/trips/${tripId}/items/${itemId}`, {
      method: "PATCH",
      data: { checked },
    }),
  devLogin: (nickname) =>
    request("/api/mp/auth/dev-login", {
      method: "POST",
      data: { nickname },
      auth: false,
    }),
  wechatLogin: (code, nickname) =>
    request("/api/mp/auth/login", {
      method: "POST",
      data: { code, nickname },
      auth: false,
    }),
  getGear: () => request("/api/gear"),
  createGear: (data) =>
    request("/api/gear", { method: "POST", data }),
  updateGear: (id, data) =>
    request(`/api/gear/${id}`, { method: "PATCH", data }),
  deleteGear: (id) => request(`/api/gear/${id}`, { method: "DELETE" }),
  addGearToTrip: (tripId, personalGearIds) =>
    request(`/api/trips/${tripId}/items`, {
      method: "POST",
      data: { personalGearIds },
    }),
  uploadGearImage: (filePath) =>
    new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${API_BASE}/api/gear/upload`,
        filePath,
        name: "file",
        header: {
          Authorization: `Bearer ${getToken()}`,
        },
        success(res) {
          let data = {};
          try {
            data = JSON.parse(res.data);
          } catch (_) {}
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || `上传失败 ${res.statusCode}`));
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || "上传失败"));
        },
      });
    }),
};
