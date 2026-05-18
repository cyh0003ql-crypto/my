const app = getApp();

Page({
  data: {
    coupons: [],
    activeTab: 0,
    tabs: ['可领取', '可使用', '已使用', '已过期'],
    claimableCount: 0,
  },

  onShow() {
    this.loadCoupons();
  },

  loadCoupons() {
    const tab = this.data.activeTab;
    const userCoupons = wx.getStorageSync('userCoupons') || this._initDefaultUserCoupons();
    const now = new Date();

    const claimable = this._getClaimable(userCoupons);
    const claimableCount = claimable.length;

    let list;
    if (tab === 0) {
      list = claimable;
    } else if (tab === 1) {
      list = userCoupons.filter(c => c.status === 'unused' && new Date(c.expiresAt) >= now);
    } else if (tab === 2) {
      list = userCoupons.filter(c => c.status === 'used');
    } else {
      list = userCoupons.filter(c => c.status === 'unused' && new Date(c.expiresAt) < now);
    }
    this.setData({ coupons: list, claimableCount });
  },

  _getClaimable(userCoupons) {
    const publicPool = wx.getStorageSync('publicCoupons') || [];
    const now = new Date();
    const claimedIds = userCoupons.map(c => c.sourceId || c.id);
    return publicPool.filter(c =>
      c.status === 'active' &&
      new Date(c.expiresAt) >= now &&
      !claimedIds.includes(c.id) &&
      (c.claimedCount || 0) < c.totalCount
    );
  },

  _initDefaultUserCoupons() {
    const defaults = [
      { id: 'ucpn_welcome', sourceId: 'cpn_welcome', title: '新用户专享礼', discount: 100, minAmount: 500, expiresAt: '2026-12-31', status: 'unused', type: 'fixed', tag: '满减' },
      { id: 'ucpn_summer', sourceId: 'cpn_summer', title: '夏日艺术季', discount: 50, minAmount: 300, expiresAt: '2026-08-31', status: 'unused', type: 'fixed', tag: '满减' },
    ];
    wx.setStorageSync('userCoupons', defaults);
    return defaults;
  },

  onTabTap(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ activeTab: index }, () => this.loadCoupons());
  },

  onClaimCoupon(e) {
    const { id } = e.currentTarget.dataset;
    const publicPool = wx.getStorageSync('publicCoupons') || [];
    const source = publicPool.find(c => c.id === id);
    if (!source) { wx.showToast({ title: '优惠券不存在', icon: 'none' }); return; }
    if ((source.claimedCount || 0) >= source.totalCount) {
      wx.showToast({ title: '此券已被领完', icon: 'none' }); return;
    }

    const userCoupons = wx.getStorageSync('userCoupons') || [];
    const alreadyClaimed = userCoupons.find(c => c.sourceId === id || c.id === id);
    if (alreadyClaimed) { wx.showToast({ title: '您已领取过此券', icon: 'none' }); return; }

    const newCoupon = {
      id: 'ucpn_' + Date.now(),
      sourceId: id,
      title: source.title,
      type: source.type,
      discount: source.discount,
      minAmount: source.minAmount,
      expiresAt: source.expiresAt,
      status: 'unused',
      tag: source.tag || (source.type === 'fixed' ? '满减' : '折扣'),
    };
    userCoupons.unshift(newCoupon);
    wx.setStorageSync('userCoupons', userCoupons);

    const updatedPool = publicPool.map(c =>
      c.id === id ? { ...c, claimedCount: (c.claimedCount || 0) + 1 } : c
    );
    wx.setStorageSync('publicCoupons', updatedPool);
    const merchantCoupons = (wx.getStorageSync('merchantCoupons') || []).map(c =>
      c.id === id ? { ...c, claimedCount: (c.claimedCount || 0) + 1 } : c
    );
    wx.setStorageSync('merchantCoupons', merchantCoupons);

    wx.showToast({ title: '领取成功！', icon: 'success' });
    setTimeout(() => {
      this.setData({ activeTab: 1 }, () => this.loadCoupons());
    }, 1000);
  },

  onUseCoupon(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '使用优惠券',
      content: '去购物车结算时可自动抵扣，是否立即去购物？',
      confirmText: '去购物',
      confirmColor: '#3A332D',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('selectedCouponId', id);
          wx.switchTab({ url: '/pages/cart/cart' });
        }
      },
    });
  },
});
