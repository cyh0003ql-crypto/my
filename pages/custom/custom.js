const app = getApp();

Page({
  data: {
    uploadedImages: [],
    showDesc: false,
    showSize: false,
    showCases: false,
    merchantCases: [],
    selectedCases: [],
    submitted: false,
    form: {
      description: '',
      size: '',
      remark: '',
    },
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2, cartCount: app.globalData.cartCount });
    }
    // Refresh merchant cases each time page shows
    this.refreshCases();
  },

  refreshCases() {
    const cases = wx.getStorageSync('merchantCases') || [];
    const selectedIds = this.data.selectedCases;
    const merchantCases = cases.map(c => ({ ...c, isSelected: selectedIds.includes(c.id) }));
    this.setData({ merchantCases });
  },

  // 上传图片
  onUpload() {
    const remaining = 9 - this.data.uploadedImages.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张', icon: 'none' }); return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        const uploadedImages = [...this.data.uploadedImages, ...newImages];
        this.setData({ uploadedImages });
        wx.showToast({ title: '已上传' + newImages.length + '张', icon: 'success' });
      },
    });
  },

  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const uploadedImages = [...this.data.uploadedImages];
    uploadedImages.splice(index, 1);
    this.setData({ uploadedImages });
  },

  onPreviewImage(e) {
    const { src } = e.currentTarget.dataset;
    wx.previewImage({ current: src, urls: this.data.uploadedImages });
  },

  // 展开/收起文字描述
  onToggleDesc() {
    this.setData({ showDesc: !this.data.showDesc, showSize: false, showCases: false });
  },

  onDescInput(e) {
    this.setData({ 'form.description': e.detail.value });
  },

  // 展开/收起尺寸
  onToggleSize() {
    this.setData({ showSize: !this.data.showSize, showDesc: false, showCases: false });
  },

  onSizeInput(e) {
    this.setData({ 'form.size': e.detail.value });
  },

  // 参考案例：显示商家上传的案例
  onChooseReference() {
    const isOpen = this.data.showCases;
    this.refreshCases();
    this.setData({ showCases: !isOpen, showDesc: false, showSize: false });
  },

  onToggleCase(e) {
    const { id } = e.currentTarget.dataset;
    const selectedCases = [...this.data.selectedCases];
    const idx = selectedCases.indexOf(id);
    if (idx >= 0) selectedCases.splice(idx, 1);
    else selectedCases.push(id);
    const merchantCases = this.data.merchantCases.map(c => ({ ...c, isSelected: selectedCases.includes(c.id) }));
    this.setData({ selectedCases, merchantCases });
  },

  // 联系客服
  onContactService() {
    wx.navigateTo({ url: '/pages/service/service' });
  },

  onRemarkInput(e) {
    this.setData({ 'form.remark': e.detail.value });
  },

  noop() {},

  // 提交定制需求
  onSubmit() {
    const { uploadedImages, form, selectedCases, merchantCases } = this.data;
    if (uploadedImages.length === 0 && !form.description && !form.size && selectedCases.length === 0) {
      wx.showToast({ title: '请至少填写一项定制需求', icon: 'none' }); return;
    }

    const userInfo = app.globalData.userInfo;
    const selectedCaseNames = merchantCases.filter(c => selectedCases.includes(c.id)).map(c => c.name);

    const request = {
      id: 'CUS' + Date.now(),
      userId: userInfo ? userInfo.id : 'guest',
      userName: userInfo ? (userInfo.name || '微信用户') : '游客',
      userPhone: userInfo ? (userInfo.phone || '') : '',
      images: uploadedImages,
      description: form.description,
      size: form.size,
      remark: form.remark,
      selectedCases,
      selectedCaseNames,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const list = wx.getStorageSync('customRequests') || [];
    list.unshift(request);
    wx.setStorageSync('customRequests', list);

    wx.showToast({ title: '提交成功', icon: 'success' });
    this.setData({
      submitted: true,
      uploadedImages: [],
      selectedCases: [],
      merchantCases: this.data.merchantCases.map(c => ({ ...c, isSelected: false })),
      showDesc: false,
      showSize: false,
      showCases: false,
      form: { description: '', size: '', remark: '' },
    });

    setTimeout(() => {
      this.setData({ submitted: false });
    }, 5000);
  },
});
