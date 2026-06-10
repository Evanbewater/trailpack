const api = require("../../utils/api");
const { ensureLogin } = require("../../utils/auth");
const { EXAMPLE_TRIP } = require("../../utils/constants");

const STEP_DEFS = [
  { key: "create", label: "创建行程", icon: "1" },
  { key: "parse", label: "解析路线", icon: "2" },
  { key: "generate", label: "生成装备清单", icon: "3" },
];

function initSteps() {
  return STEP_DEFS.map((s) => ({ ...s, status: "pending" }));
}

Page({
  data: {
    description: "",
    running: false,
    started: false,
    failed: false,
    error: "",
    tripId: "",
    steps: initSteps(),
  },

  onLoad(options) {
    if (options.example) {
      this.setData({ description: decodeURIComponent(options.example) });
    }
  },

  onInput(e) {
    this.setData({ description: e.detail.value });
  },

  fillExample() {
    this.setData({ description: EXAMPLE_TRIP });
  },

  setStep(key, status) {
    const steps = this.data.steps.map((s) =>
      s.key === key ? { ...s, status } : s,
    );
    this.setData({ steps });
  },

  async runStep(key, fn) {
    this.setStep(key, "active");
    try {
      await fn();
      this.setStep(key, "done");
      return true;
    } catch (e) {
      this.setStep(key, "fail");
      this.setData({ error: e.message || "步骤失败", failed: true });
      return false;
    }
  },

  async submit() {
    const desc = this.data.description.trim();
    if (desc.length < 4) {
      this.setData({ error: "描述至少 4 个字符" });
      return;
    }

    this.setData({
      running: true,
      started: true,
      failed: false,
      error: "",
      tripId: "",
      steps: initSteps(),
    });

    try {
      await ensureLogin();

      let tripId = this.data.tripId;
      if (!tripId) {
        const ok = await this.runStep("create", async () => {
          const { trip } = await api.createTrip(desc);
          tripId = trip.id;
          this.setData({ tripId });
        });
        if (!ok) return;
      }

      const parseOk = await this.runStep("parse", () =>
        api.parseTrip(tripId),
      );
      if (!parseOk) return;

      const genOk = await this.runStep("generate", () =>
        api.generateTrip(tripId),
      );
      if (!genOk) return;

      wx.redirectTo({ url: `/pages/trips/detail?id=${tripId}` });
    } finally {
      this.setData({ running: false });
    }
  },

  async retryStep(e) {
    const { key } = e.currentTarget.dataset;
    if (!this.data.tripId && key !== "create") return;

    this.setData({ running: true, error: "", failed: false });

    const tripId = this.data.tripId;
    const desc = this.data.description.trim();

    try {
      if (key === "create") {
        await this.runStep("create", async () => {
          const { trip } = await api.createTrip(desc);
          this.setData({ tripId: trip.id });
        });
      } else if (key === "parse") {
        await this.runStep("parse", () => api.parseTrip(tripId));
      } else if (key === "generate") {
        await this.runStep("generate", () => api.generateTrip(tripId));
      }

      const allDone = this.data.steps.every((s) => s.status === "done");
      if (allDone && tripId) {
        wx.redirectTo({ url: `/pages/trips/detail?id=${tripId}` });
      }
    } finally {
      this.setData({ running: false });
    }
  },

  goDetail() {
    if (this.data.tripId) {
      wx.navigateTo({ url: `/pages/trips/detail?id=${this.data.tripId}` });
    }
  },
});
