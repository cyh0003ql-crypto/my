const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    baseFee: 15,
    freeThreshold: 200,
    baseFeeStr: '15',
    freeThresholdStr: '200',
  },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    const cfg = db.getShippingSettings();
    this.setData({
      baseFee: cfg.baseFee,
      freeThreshold: cfg.freeThreshold,
      baseFeeStr: String(cfg.baseFee),
      freeThresholdStr: String(cfg.freeThreshold),
    });
  },

  onBaseFeeInput(e) {
    this.setData({ baseFeeStr: e.detail.value });
  },

  onFreeThresholdInput(e) {
    this.setData({ freeThresholdStr: e.detail.value });
  },

  onSave() {
    const baseFee = parseFloat(this.data.baseFeeStr);
    const freeThreshold = parseFloat(this.data.freeThresholdStr);
    if (isNaN(baseFee) || baseFee < 0) {
      wx.showToast({ title: '运费金额无效', icon: 'none' }); return;
    }
    if (isNaN(freeThreshold) || freeThreshold < 0) {
      wx.showToast({ title: '满免门槛无效', icon: 'none' }); return;
    }
    db.saveShippingSettings({ baseFee, freeThreshold });
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1200);
  },
});
