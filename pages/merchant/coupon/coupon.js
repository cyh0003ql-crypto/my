Page({
  data: {
    coupons: [],
    showForm: false,
    form: {
      title: '',
      type: 'fixed',
      discount: '',
      minAmount: '0',
      totalCount: '100',
      expiresAt: '2026-12-31',
      isPublic: true,
      isNewbie: false,
    },
    isSaving: false,
  },

  onShow() {
    this.loadCoupons();
  },

  loadCoupons() {
    const coupons = wx.getStorageSync('merchantCoupons') || this.getDefaultCoupons();
    this.setData({ coupons });
  },

  getDefaultCoupons() {
    const defaults = [
      {
        id: 'cpn_welcome',
        title: '新用户专享礼',
        type: 'fixed',
        discount: 100,
        minAmount: 500,
        totalCount: 100,
        usedCount: 3,
        claimedCount: 3,
        expiresAt: '2026-12-31',
        status: 'active',
        isPublic: true,
        isNewbie: true,
      },
      {
        id: 'cpn_summer',
        title: '夏日艺术季',
        type: 'fixed',
        discount: 50,
        minAmount: 300,
        totalCount: 200,
        usedCount: 18,
        claimedCount: 20,
        expiresAt: '2026-08-31',
        status: 'active',
        isPublic: true,
        isNewbie: false,
      },
      {
        id: 'cpn_vip',
        title: '会员专属九折',
        type: 'percent',
        discount: 9,
        minAmount: 0,
        totalCount: 50,
        usedCount: 12,
        claimedCount: 15,
        expiresAt: '2026-09-30',
        status: 'active',
        isPublic: false,
        isNewbie: false,
      },
    ];
    wx.setStorageSync('merchantCoupons', defaults);
    this._syncPublicPool(defaults);
    return defaults;
  },

  _syncPublicPool(coupons) {
    const publicPool = coupons
      .filter(c => c.isPublic && c.status === 'active')
      .map(c => ({ ...c, tag: c.type === 'fixed' ? '满减' : '折扣' }));
    wx.setStorageSync('publicCoupons', publicPool);
  },

  onAddCoupon() {
    this.setData({
      showForm: true,
      form: {
        title: '',
        type: 'fixed',
        discount: '',
        minAmount: '0',
        totalCount: '100',
        expiresAt: '2026-12-31',
        isPublic: true,
        isNewbie: false,
      },
    });
  },

  onCloseForm() {
    this.setData({ showForm: false });
  },

  onTypeChange(e) {
    this.setData({ 'form.type': e.detail.value === '0' ? 'fixed' : 'percent' });
  },

  onTitleInput(e) { this.setData({ 'form.title': e.detail.value }); },
  onDiscountInput(e) { this.setData({ 'form.discount': e.detail.value }); },
  onMinAmountInput(e) { this.setData({ 'form.minAmount': e.detail.value }); },
  onTotalCountInput(e) { this.setData({ 'form.totalCount': e.detail.value }); },
  onExpiresAtInput(e) { this.setData({ 'form.expiresAt': e.detail.value }); },
  onTogglePublic() { this.setData({ 'form.isPublic': !this.data.form.isPublic }); },
  onToggleNewbie() { this.setData({ 'form.isNewbie': !this.data.form.isNewbie }); },

  onSaveCoupon() {
    const { form } = this.data;
    if (!form.title.trim()) { wx.showToast({ title: '请输入优惠券名称', icon: 'none' }); return; }
    if (!form.discount) { wx.showToast({ title: '请输入优惠力度', icon: 'none' }); return; }
    if (!form.expiresAt) { wx.showToast({ title: '请输入有效期', icon: 'none' }); return; }

    this.setData({ isSaving: true });
    setTimeout(() => {
      const coupons = wx.getStorageSync('merchantCoupons') || [];
      const newCoupon = {
        id: 'cpn_' + Date.now(),
        title: form.title.trim(),
        type: form.type,
        discount: Number(form.discount),
        minAmount: Number(form.minAmount) || 0,
        totalCount: Number(form.totalCount) || 100,
        usedCount: 0,
        claimedCount: 0,
        expiresAt: form.expiresAt,
        status: 'active',
        isPublic: form.isPublic,
        isNewbie: form.isNewbie,
        tag: form.type === 'fixed' ? '满减' : '折扣',
      };
      coupons.unshift(newCoupon);
      wx.setStorageSync('merchantCoupons', coupons);
      this._syncPublicPool(coupons);

      this.setData({ isSaving: false, showForm: false });
      this.loadCoupons();
      wx.showToast({ title: '创建成功', icon: 'success' });
    }, 500);
  },

  onDisable(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '停用优惠券',
      content: '停用后用户将无法领取和使用此券，确认？',
      confirmText: '停用',
      confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        const coupons = (wx.getStorageSync('merchantCoupons') || []).map(c =>
          c.id === id ? { ...c, status: 'disabled' } : c
        );
        wx.setStorageSync('merchantCoupons', coupons);
        this._syncPublicPool(coupons);
        this.loadCoupons();
        wx.showToast({ title: '已停用', icon: 'none' });
      },
    });
  },
});
