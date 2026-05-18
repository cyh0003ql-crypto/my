const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    orderId: '',
  },

  _carrier: '',
  _number: '',

  onLoad(options) {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    const orderId = options.id || '';
    this.setData({ orderId });
    this._carrier = '';
    this._number = '';
  },

  onCarrierInput(e) {
    this._carrier = e.detail.value;
  },

  onNumberInput(e) {
    this._number = e.detail.value;
  },

  onSave() {
    const { orderId } = this.data;
    const number = (this._number || '').trim();
    const carrier = (this._carrier || '').trim();
    if (!number) {
      wx.showToast({ title: '请填写物流单号', icon: 'none' }); return;
    }
    const tracking = {
      carrier: carrier || '快递',
      number,
      shippedAt: new Date().toISOString(),
    };
    db.updateOrderStatus(orderId, 'shipped', tracking);
    wx.showToast({ title: '已标记发货', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
