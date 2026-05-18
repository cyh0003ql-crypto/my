Page({
  data: {
    wechatId: 'artfulliving_service',
    description: '工作日 9:00-18:00，节假日可能延迟回复',
    note: '微信搜索客服号或扫描下方二维码，添加时备注「艺术生活」即可获得专属服务。',
    qrPath: '',
  },

  onShow() {
    this.loadServiceConfig();
  },

  loadServiceConfig() {
    const config = wx.getStorageSync('serviceConfig') || {};
    this.setData({
      wechatId: config.wechatId || 'artfulliving_service',
      description: config.description || '工作日 9:00-18:00，节假日可能延迟回复',
      note: config.note || '微信搜索客服号或扫描下方二维码，添加时备注「艺术生活」即可获得专属服务。',
      qrPath: config.qrPath || '',
    });
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({ title: '微信号已复制', icon: 'success' });
      },
    });
  },

  onPreviewQr() {
    const { qrPath } = this.data;
    if (!qrPath) return;
    wx.previewImage({ current: qrPath, urls: [qrPath] });
  },
});
