const app = getApp();

Page({
  data: {
    form: {
      wechatId: 'artfulliving_service',
      description: '工作日 9:00-18:00，节假日可能延迟回复',
      note: '微信搜索客服号或扫描下方二维码，添加时备注「艺术生活」即可获得专属服务。',
      qrPath: '',
    },
  },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    this.loadConfig();
  },

  loadConfig() {
    const config = wx.getStorageSync('serviceConfig') || {};
    this.setData({
      'form.wechatId': config.wechatId || 'artfulliving_service',
      'form.description': config.description || '工作日 9:00-18:00，节假日可能延迟回复',
      'form.note': config.note || '微信搜索客服号或扫描下方二维码，添加时备注「艺术生活」即可获得专属服务。',
      'form.qrPath': config.qrPath || '',
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onChooseQr() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ 'form.qrPath': res.tempFiles[0].tempFilePath });
      },
    });
  },

  onPreviewQr() {
    const { qrPath } = this.data.form;
    if (!qrPath) return;
    wx.previewImage({ current: qrPath, urls: [qrPath] });
  },

  onClearQr() {
    wx.showModal({
      title: '确认删除', content: '是否删除当前二维码？',
      confirmText: '删除', confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) this.setData({ 'form.qrPath': '' });
      },
    });
  },

  onSave() {
    const { form } = this.data;
    if (!form.wechatId) {
      wx.showToast({ title: '请填写客服微信号', icon: 'none' }); return;
    }
    wx.setStorageSync('serviceConfig', { ...form });
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
