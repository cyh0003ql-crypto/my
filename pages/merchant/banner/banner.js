const db = require('../../../utils/db');

Page({
  data: {
    banners: [],
    saving: false,
  },

  onLoad() {
    this.loadBanners();
  },

  onShow() {
    this.loadBanners();
  },

  loadBanners() {
    const banners = db.getBanners().map(b => ({ ...b }));
    this.setData({ banners });
  },

  onMainTitleInput(e) {
    const { index } = e.currentTarget.dataset;
    const key = 'banners[' + index + '].mainTitle';
    this.setData({ [key]: e.detail.value });
  },

  onSubtitleInput(e) {
    const { index } = e.currentTarget.dataset;
    const key = 'banners[' + index + '].subtitle';
    this.setData({ [key]: e.detail.value });
  },

  onBtnInput(e) {
    const { index } = e.currentTarget.dataset;
    const key = 'banners[' + index + '].btn';
    this.setData({ [key]: e.detail.value });
  },

  onPickImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const key = 'banners[' + index + '].image';
        this.setData({ [key]: tempFilePath });
      },
      fail: () => {
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      },
    });
  },

  onMoveUp(e) {
    const { index } = e.currentTarget.dataset;
    if (index === 0) return;
    const banners = [...this.data.banners];
    const temp = banners[index];
    banners[index] = banners[index - 1];
    banners[index - 1] = temp;
    this.setData({ banners });
  },

  onMoveDown(e) {
    const { index } = e.currentTarget.dataset;
    const banners = [...this.data.banners];
    if (index >= banners.length - 1) return;
    const temp = banners[index];
    banners[index] = banners[index + 1];
    banners[index + 1] = temp;
    this.setData({ banners });
  },

  onDeleteBanner(e) {
    const { index } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除广告',
      content: '确认删除这条广告？',
      confirmText: '删除',
      confirmColor: '#C0735A',
      success: (res) => {
        if (res.confirm) {
          const banners = this.data.banners.filter((_, i) => i !== index);
          this.setData({ banners });
        }
      },
    });
  },

  onAddBanner() {
    const banners = [...this.data.banners];
    if (banners.length >= 3) {
      wx.showToast({ title: '最多3条广告', icon: 'none' });
      return;
    }
    const newBanner = {
      id: 'b' + Date.now(),
      image: '/images/products/p001.png',
      mainTitle: '新广告\n标题',
      subtitle: '副标题文字',
      btn: '立即查看',
      bg: 'linear-gradient(135deg,#EDE5D8,#E0D4C0)',
      link: 'category',
    };
    banners.push(newBanner);
    this.setData({ banners });
    wx.showToast({ title: '已添加，请填写内容', icon: 'none', duration: 2000 });
  },

  onSave() {
    const { banners, saving } = this.data;
    if (saving) return;
    if (!banners || banners.length === 0) {
      wx.showToast({ title: '至少保留1条广告', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    setTimeout(() => {
      db.saveBanners(banners);
      this.setData({ saving: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    }, 600);
  },

  onReset() {
    wx.showModal({
      title: '恢复默认广告',
      content: '将恢复为系统默认的3条广告内容，确认吗？',
      confirmText: '恢复',
      confirmColor: '#2C1A0E',
      success: (res) => {
        if (res.confirm) {
          const banners = db.resetBanners().map(b => ({ ...b }));
          this.setData({ banners });
          wx.showToast({ title: '已恢复默认', icon: 'success' });
        }
      },
    });
  },
});
