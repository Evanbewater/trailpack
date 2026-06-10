const api = require("../../utils/api");
const {
  ACTIVITY_TYPES,
  SEASONS,
  DIFFICULTIES,
} = require("../../utils/constants");

function groupByCategory(items) {
  const map = {};
  (items || []).forEach((item) => {
    if (!map[item.category]) map[item.category] = [];
    map[item.category].push(item);
  });
  return Object.keys(map).map((category) => ({
    category,
    items: map[category],
  }));
}

function applyFilter(items, filter) {
  if (filter === "required") return items.filter((i) => i.priority === "必需");
  if (filter === "todo") return items.filter((i) => !i.checked && !i.owned);
  return items;
}

function buildListStats(items, filter) {
  const filtered = applyFilter(items, filter);
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const owned = items.filter((i) => i.owned).length;
  return {
    groupedItems: groupByCategory(filtered),
    checkedCount: checked,
    ownedCount: owned,
    progress: total ? Math.round((checked / total) * 100) : 0,
    needCount: items.filter((i) => !i.owned && !i.checked).length,
  };
}

function parseAssignments(checklist) {
  if (!checklist?.assignments) return [];
  return checklist.assignments.map((a) => {
    let itemNames = [];
    try {
      itemNames = JSON.parse(a.itemIds);
    } catch (_) {}
    return {
      id: a.id,
      roleLabel: a.roleLabel,
      memberName: a.memberName,
      itemNames,
    };
  });
}

function toEditForm(parsed) {
  if (!parsed) return null;
  return {
    ...parsed,
    activityTypeIndex: Math.max(0, ACTIVITY_TYPES.indexOf(parsed.activityType)),
    seasonIndex: Math.max(0, SEASONS.indexOf(parsed.season)),
    difficultyIndex: Math.max(0, DIFFICULTIES.indexOf(parsed.difficulty)),
  };
}

function fromEditForm(form) {
  const { activityTypeIndex, seasonIndex, difficultyIndex, ...rest } = form;
  return {
    ...rest,
    activityType: ACTIVITY_TYPES[activityTypeIndex] || "未知",
    season: SEASONS[seasonIndex] || "未知",
    difficulty: DIFFICULTIES[difficultyIndex] || "未知",
    days: form.days ? Number(form.days) : undefined,
    groupSize: form.groupSize ? Number(form.groupSize) : undefined,
    maxAltitudeM: form.maxAltitudeM ? Number(form.maxAltitudeM) : undefined,
  };
}

Page({
  data: {
    tripId: "",
    trip: null,
    parsed: null,
    checklist: null,
    groupedItems: [],
    assignments: [],
    versions: [],
    versionLabels: [],
    selectedVersionIndex: 0,
    selectedVersion: null,
    checkedCount: 0,
    ownedCount: 0,
    needCount: 0,
    progress: 0,
    filter: "all",
    weatherSummary: "",
    loading: "",
    savingRoute: false,
    pageLoading: true,
    status: "",
    error: "",
    activeTab: "list",
    editMode: false,
    editForm: null,
    activityTypes: ACTIVITY_TYPES,
    seasons: SEASONS,
    difficulties: DIFFICULTIES,
    showParseThinking: true,
    showGenThinking: true,
  },

  onLoad(options) {
    this.setData({ tripId: options.id });
    this.loadTrip();
  },

  onShow() {
    if (this.data.tripId && this.data.trip) {
      this.loadTrip();
    }
  },

  onPullDownRefresh() {
    this.loadTrip().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const { trip, tripId, progress } = this.data;
    return {
      title: trip ? `${trip.title} · 装备清单 ${progress}%` : "Trailpack 装备清单",
      path: `/pages/trips/detail?id=${tripId}`,
    };
  },

  onShareTimeline() {
    const { trip } = this.data;
    return {
      title: trip ? `${trip.title} - Trailpack` : "Trailpack 登山装备清单",
    };
  },

  async loadTrip(version) {
    this.setData({ pageLoading: !this.data.trip });
    try {
      const ver = version ?? this.data.selectedVersion;
      const [{ trip }, { versions }] = await Promise.all([
        api.getTrip(this.data.tripId, ver),
        api.getVersions(this.data.tripId).catch(() => ({ versions: [] })),
      ]);

      let parsed = null;
      if (trip.parsedRoute) {
        try {
          parsed = JSON.parse(trip.parsedRoute);
        } catch (_) {}
      }
      let weatherSummary = "";
      if (trip.weatherSnapshot) {
        try {
          weatherSummary = JSON.parse(trip.weatherSnapshot).summary || "";
        } catch (_) {}
      }

      const checklist = trip.checklists?.[0] || null;
      const items = checklist?.items || [];
      const versionLabels = versions.map(
        (v) => `v${v.version}（${v._count.items}项）`,
      );
      const selectedVersionIndex = checklist
        ? Math.max(
            0,
            versions.findIndex((v) => v.version === checklist.version),
          )
        : 0;

      const stats = buildListStats(items, this.data.filter);

      this.setData({
        trip,
        parsed,
        editForm: toEditForm(parsed),
        checklist,
        versions,
        versionLabels,
        selectedVersionIndex,
        selectedVersion: checklist?.version ?? null,
        assignments: parseAssignments(checklist),
        weatherSummary,
        pageLoading: false,
        ...stats,
      });
    } catch (e) {
      this.setData({
        pageLoading: false,
        error: e.message || "加载失败",
      });
    }
  },

  onVersionChange(e) {
    const index = Number(e.detail.value);
    const version = this.data.versions[index]?.version;
    if (!version) return;
    this.setData({ selectedVersionIndex: index, selectedVersion: version });
    this.loadTrip(version);
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    const stats = buildListStats(this.data.checklist?.items || [], filter);
    this.setData({ filter, ...stats });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  toggleEdit() {
    const editMode = !this.data.editMode;
    this.setData({
      editMode,
      editForm: editMode ? toEditForm(this.data.parsed) : this.data.editForm,
    });
  },

  onEditInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`editForm.${field}`]: e.detail.value });
  },

  onEditNumber(e) {
    const { field } = e.currentTarget.dataset;
    const val = e.detail.value;
    this.setData({ [`editForm.${field}`]: val ? Number(val) : "" });
  },

  onEditPicker(e) {
    const { field } = e.currentTarget.dataset;
    const index = Number(e.detail.value);
    const maps = {
      activityType: ACTIVITY_TYPES,
      season: SEASONS,
      difficulty: DIFFICULTIES,
    };
    const list = maps[field];
    this.setData({
      [`editForm.${field}Index`]: index,
      [`editForm.${field}`]: list[index],
    });
  },

  onEditSwitch(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`editForm.${field}`]: e.detail.value });
  },

  async saveRoute() {
    if (!this.data.editForm) return;
    this.setData({ savingRoute: true, error: "" });
    try {
      const route = fromEditForm(this.data.editForm);
      await api.updateRoute(this.data.tripId, route);
      this.setData({
        parsed: route,
        editForm: toEditForm(route),
        editMode: false,
        savingRoute: false,
        status: "路线已保存，可点击「生成清单」应用新参数",
      });
      wx.showToast({ title: "已保存" });
    } catch (e) {
      this.setData({ savingRoute: false, error: e.message || "保存失败" });
    }
  },

  copyChecklist() {
    const { checklist, trip } = this.data;
    if (!checklist) return;
    const lines = [`# ${trip.title}`, "", trip.rawDescription, "", "## 装备清单", ""];
    groupByCategory(checklist.items).forEach(({ category, items }) => {
      lines.push(`### ${category}`);
      items.forEach((i) => {
        const flags = [i.checked ? "x" : " ", i.owned ? "已有" : ""].filter(Boolean).join(",");
        lines.push(`- [${i.checked ? "x" : " "}] ${i.name} (${i.priority})${i.owned ? " ·已有" : ""}`);
      });
      lines.push("");
    });
    wx.setClipboardData({
      data: lines.join("\n"),
      success: () => wx.showToast({ title: "已复制" }),
    });
  },

  confirmDelete() {
    wx.showModal({
      title: "删除行程",
      content: "确定删除此行程？不可恢复。",
      confirmColor: "#ef4444",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.deleteTrip(this.data.tripId);
          wx.showToast({ title: "已删除" });
          setTimeout(() => wx.switchTab({ url: "/pages/trips/list" }), 500);
        } catch (e) {
          wx.showToast({ title: e.message || "删除失败", icon: "none" });
        }
      },
    });
  },

  async runParse() {
    if (this.data.loading) return;
    this.setData({ loading: "parse", error: "", status: "正在解析路线，请稍候…" });
    try {
      const res = await api.parseTrip(this.data.tripId);
      await this.loadTrip();
      this.setData({
        loading: "",
        status: res.reasoning ? "解析完成，已获取思考过程" : "解析完成",
        error: res.aiError ? `AI：${res.aiError}` : "",
      });
    } catch (e) {
      this.setData({ loading: "", error: e.message, status: "" });
    }
  },

  async runGenerate() {
    if (this.data.loading) return;
    this.setData({
      loading: "generate",
      error: "",
      status: "正在生成清单，AI 思考可能需要 30-60 秒…",
    });
    try {
      const res = await api.generateTrip(this.data.tripId);
      await this.loadTrip();
      this.setData({
        loading: "",
        status: res.reasoning ? "清单已生成，已获取思考过程" : "清单已生成",
        error: res.aiError ? `AI：${res.aiError}` : "",
      });
    } catch (e) {
      this.setData({ loading: "", error: e.message, status: "" });
    }
  },

  updateItemsLocally(updater) {
    const items = this.data.checklist.items.map(updater);
    const stats = buildListStats(items, this.data.filter);
    this.setData({
      checklist: { ...this.data.checklist, items },
      ...stats,
    });
  },

  async toggleItem(e) {
    const { id, checked } = e.currentTarget.dataset;
    const next = !checked;
    try {
      await api.updateItem(this.data.tripId, id, { checked: next });
      this.updateItemsLocally((i) =>
        i.id === id ? { ...i, checked: next } : i,
      );
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  async toggleOwned(e) {
    const { id, owned } = e.currentTarget.dataset;
    const next = !owned;
    try {
      await api.updateItem(this.data.tripId, id, { owned: next });
      this.updateItemsLocally((i) =>
        i.id === id ? { ...i, owned: next } : i,
      );
    } catch (err) {
      wx.showToast({ title: err.message || "更新失败", icon: "none" });
    }
  },

  toggleParseThinking() {
    this.setData({ showParseThinking: !this.data.showParseThinking });
  },

  toggleGenThinking() {
    this.setData({ showGenThinking: !this.data.showGenThinking });
  },

  goPickGear() {
    if (!this.data.checklist) {
      wx.showToast({ title: "请先生成清单", icon: "none" });
      return;
    }
    const existing = (this.data.checklist.items || [])
      .map((i) => i.personalGearId)
      .filter(Boolean);
    const existingParam = encodeURIComponent(JSON.stringify(existing));
    wx.navigateTo({
      url: `/pages/gear/index?pick=1&tripId=${this.data.tripId}&existing=${existingParam}`,
    });
  },
});
