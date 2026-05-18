const app = getApp();

Page({
  data: {
    cases: [],
    showModal: false,
    newCase: { image: '', name: '', price: '', description: '' },
  },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    this.loadCases();
  },

  onShow() { this.loadCases(); },

  loadCases() {
    const cases = wx.getStorageSync('merchantCases') || [];
    this.setData({ cases });
  },

  onAddCase() {
    this.setData({
      showModal: true,
      newCase: { image: '', name: '', price: '', description: '' },
    });
  },

  onCloseModal() {
    this.setData({ showModal: false });
  },

  onPickImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ 'newCase.image': res.tempFiles[0].tempFilePath });
      },
    });
  },

  onNameInput(e) { this.setData({ 'newCase.name': e.detail.value }); },
  onPriceInput(e) { this.setData({ 'newCase.price': e.detail.value }); },
  onDescInput(e) { this.setData({ 'newCase.description': e.detail.value }); },

  onConfirmAdd(e) {
    const { newCase } = this.data;
    if (!newCase.name.trim()) {
      wx.showToast({ title: '请填写案例名称', icon: 'none' }); return;
    }
    const cases = wx.getStorageSync('merchantCases') || [];
    cases.unshift({
      id: 'CASE' + Date.now(),
      image: newCase.image,
      name: newCase.name.trim(),
      price: newCase.price ? parseFloat(newCase.price) : null,
      description: newCase.description.trim(),
      createdAt: new Date().toISOString(),
    });
    wx.setStorageSync('merchantCases', cases);
    this.setData({ showModal: false, cases });
    wx.showToast({ title: '案例已添加', icon: 'success' });
  },

  onDeleteCase(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除案例', content: '确认删除此参考案例？', confirmText: '删除', confirmColor: '#C87341',
      success: (res) => {
        if (!res.confirm) return;
        const cases = (wx.getStorageSync('merchantCases') || []).filter(c => c.id !== id);
        wx.setStorageSync('merchantCases', cases);
        this.setData({ cases });
        wx.showToast({ title: '已删除', icon: 'success' });
      },
    });
  },

  onPreview(e) {
    const { src } = e.currentTarget.dataset;
    wx.previewImage({ current: src, urls: [src] });
  },
});
