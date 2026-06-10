const api = require("../../utils/api");
const { GEAR_CATEGORIES } = require("../../utils/constants");
const { ensureLogin } = require("../../utils/auth");
const {
  groupByCategory,
  getCategoryStats,
  parseWeightGInput,
  enrichGear,
} = require("../../utils/gear");

function applyCategoryFilter(gear, filter) {
  if (!filter || filter === "all") return gear;
  return gear.filter((g) => g.category === filter);
}

Page({
  data: {
    gear: [],
    grouped: [],
    categories: GEAR_CATEGORIES,
    showForm: false,
    editingId: "",
    form: { name: "", category: GEAR_CATEGORIES[0], brand: "", weight: "", note: "", imageUrl: "" },
    imagePreview: "",
    initialImageUrl: "",
    uploadingImage: false,
    categoryIndex: 0,
    loading: false,
    error: "",
    pickMode: false,
    tripId: "",
    existingIds: [],
    selectedIds: [],
    categoryFilter: "all",
    categoryStats: [],
  },

  onLoad(options) {
    const pickMode = options.pick === "1";
    const tripId = options.tripId || "";
    let existingIds = [];
    if (options.existing) {
      try {
        existingIds = JSON.parse(decodeURIComponent(options.existing));
      } catch (_) {}
    }
    this.setData({ pickMode, tripId, existingIds });
    if (options.tripId) {
      wx.setNavigationBarTitle({ title: "选取个人装备" });
    }
    this.loadGear();
  },

  async loadGear() {
    this.setData({ loading: true, error: "" });
    try {
      await ensureLogin();
      const { gear } = await api.getGear();
      const available = enrichGear(
        this.data.pickMode
          ? gear.filter((g) => !this.data.existingIds.includes(g.id))
          : gear,
      );
      const filtered = applyCategoryFilter(available, this.data.categoryFilter);
      this.setData({
        gear: available,
        categoryStats: getCategoryStats(available),
        grouped: groupByCategory(filtered),
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false, error: e.message || "加载失败" });
    }
  },

  openForm() {
    this.setData({
      showForm: true,
      editingId: "",
      form: { name: "", category: GEAR_CATEGORIES[0], brand: "", weight: "", note: "", imageUrl: "" },
      imagePreview: "",
      initialImageUrl: "",
      uploadingImage: false,
      categoryIndex: 0,
      error: "",
    });
  },

  openEdit(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.gear.find((g) => g.id === id);
    if (!item) return;
    const categoryIndex = Math.max(0, GEAR_CATEGORIES.indexOf(item.category));
    this.setData({
      showForm: true,
      editingId: item.id,
      form: {
        name: item.name,
        category: item.category,
        brand: item.brand || "",
        weight: item.weightG ? String(item.weightG) : "",
        note: item.note || "",
        imageUrl: item.imageUrl || "",
      },
      imagePreview: item.imageFullUrl || "",
      initialImageUrl: item.imageUrl || "",
      uploadingImage: false,
      categoryIndex,
      error: "",
    });
  },

  closeForm() {
    this.setData({
      showForm: false,
      editingId: "",
      imagePreview: "",
      initialImageUrl: "",
      error: "",
    });
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
      });
      const filePath = res.tempFiles[0]?.tempFilePath;
      if (!filePath) return;

      this.setData({ uploadingImage: true, imagePreview: filePath, error: "" });
      const { imageUrl } = await api.uploadGearImage(filePath);
      this.setData({
        "form.imageUrl": imageUrl,
        uploadingImage: false,
      });
    } catch (e) {
      this.setData({
        uploadingImage: false,
        error: e.message || "图片上传失败",
      });
    }
  },

  removeImage() {
    this.setData({
      "form.imageUrl": "",
      imagePreview: "",
    });
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value);
    this.setData({
      categoryIndex: index,
      "form.category": GEAR_CATEGORIES[index],
    });
  },

  async submitForm() {
    const { form, editingId } = this.data;
    if (!form.name.trim()) {
      this.setData({ error: "请填写装备名称" });
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      weightG: parseWeightGInput(form.weight),
      note: form.note.trim() || undefined,
    };
    if (form.imageUrl) {
      payload.imageUrl = form.imageUrl;
    } else if (editingId && this.data.initialImageUrl) {
      payload.imageUrl = null;
    }
    this.setData({ loading: true, error: "" });
    try {
      if (editingId) {
        await api.updateGear(editingId, payload);
      } else {
        await api.createGear(payload);
      }
      this.setData({ showForm: false, loading: false });
      await this.loadGear();
      wx.showToast({ title: "已保存" });
    } catch (e) {
      this.setData({ loading: false, error: e.message || "保存失败" });
    }
  },

  async deleteGear(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: "删除装备",
      content: `确定删除「${name}」？`,
      confirmColor: "#dc2626",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.deleteGear(id);
          wx.showToast({ title: "已删除" });
          this.loadGear();
        } catch (err) {
          wx.showToast({ title: err.message || "删除失败", icon: "none" });
        }
      },
    });
  },

  setCategoryFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    const filtered = applyCategoryFilter(this.data.gear, filter);
    this.setData({
      categoryFilter: filter,
      grouped: groupByCategory(filtered),
    });
  },

  togglePick(e) {
    const { id } = e.currentTarget.dataset;
    const selected = new Set(this.data.selectedIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    this.setData({ selectedIds: [...selected] });
  },

  async confirmPick() {
    const { tripId, selectedIds } = this.data;
    if (!tripId || selectedIds.length === 0) return;
    this.setData({ loading: true });
    try {
      await api.addGearToTrip(tripId, selectedIds);
      wx.showToast({ title: "已添加" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || "添加失败", icon: "none" });
    }
  },
});
