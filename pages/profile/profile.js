const app = getApp();
const auth = require('../../utils/auth');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    isMerchant: false,
    orderCounts: { all: 0, paid: 0, shipped: 0, completed: 0 },
    unreadReplyCount: 0,
    claimableCount: 0,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4, cartCount: app.globalData.cartCount });
    }
    const { userInfo, isLoggedIn, isMerchant } = app.globalData;
    this.setData({ userInfo, isLoggedIn, isMerchant });
    if (isLoggedIn) {
      this.loadOrderCounts();
      this.loadUnreadReplies();
    }
    this.loadClaimableCount();
  },

  loadClaimableCount() {
    const publicPool = wx.getStorageSync('publicCoupons') || [];
    const userCoupons = wx.getStorageSync('userCoupons') || [];
    const now = new Date();
    const claimedIds = userCoupons.map(c => c.sourceId || c.id);
    const count = publicPool.filter(c =>
      c.status === 'active' &&
      new Date(c.expiresAt) >= now &&
      !claimedIds.includes(c.id) &&
      (c.claimedCount || 0) < c.totalCount
    ).length;
    this.setData({ claimableCount: count });
  },

  loadUnreadReplies() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) { this.setData({ unreadReplyCount: 0 }); return; }
    const all = wx.getStorageSync('customRequests') || [];
    const myIds = all
      .filter(r => r.userId === userInfo.id || r.userId === 'guest')
      .map(r => r.id);
    const unread = wx.getStorageSync('unreadCustomReplies') || [];
    const count = unread.filter(id => myIds.includes(id)).length;
    this.setData({ unreadReplyCount: count });
  },

  loadOrderCounts() {
    const orders = app.getOrders();
    const uid = app.globalData.userInfo ? app.globalData.userInfo.id : null;
    const mine = orders.filter(o => o.userId === uid || o.userId === 'guest');
    this.setData({
      orderCounts: {
        all: mine.length,
        paid: mine.filter(o => o.status === 'paid').length,
        shipped: mine.filter(o => o.status === 'shipped').length,
        completed: mine.filter(o => o.status === 'completed').length,
      },
    });
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '退出',
      confirmColor: '#3A332D',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          this.setData({ userInfo: null, isLoggedIn: false, isMerchant: false });
        }
      },
    });
  },

  onEditProfile() {
    if (!this.data.isLoggedIn) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/user-profile/user-profile' });
  },

  onOrders(e) {
    const { status } = e.currentTarget.dataset;
    const url = status ? '/pages/orders/orders?status=' + status : '/pages/orders/orders';
    wx.navigateTo({ url });
  },

  onMyCustom() {
    if (!app.globalData.isLoggedIn) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/my-custom/my-custom' });
  },

  onFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  onAddress() {
    if (!app.globalData.isLoggedIn) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/address/address' });
  },

  onCoupons() {
    if (!app.globalData.isLoggedIn) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },

  onContactService() {
    wx.navigateTo({ url: '/pages/service/service' });
  },

  onMerchantEntry() {
    wx.navigateTo({ url: '/pages/merchant/index/index' });
  },

  onAbout() {
    wx.showModal({
      title: 'Petit Aura',
      content: '3D打印定制 · 拼豆 · 创意生活小物\n\n我们用创意点亮生活，为热爱手作与个性定制的你提供最有趣的创意好物。\n\nVersion 1.0.0',
      showCancel: false,
      confirmText: '知道了',
    });
  },
});
