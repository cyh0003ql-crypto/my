const db = require('../../../utils/db');
const auth = require('../../../utils/auth');
const app = getApp();

Page({
  data: {
    isMerchant: false,
    username: '',
    password: '',
    isLoading: false,
    stats: { products: 0, orders: 0, pendingOrders: 0, revenue: 0 },
  },

  onShow() {
    const { isMerchant } = app.globalData;
    this.setData({ isMerchant });
    if (isMerchant) this.loadStats();
  },

  loadStats() {
    const products = db.getProducts();
    const orders = db.getAllOrders();
    const pending = orders.filter(o => o.status === 'paid').length;
    const revenueRaw = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
    const revenue = parseFloat(revenueRaw.toFixed(2));
    const customRequests = wx.getStorageSync('customRequests') || [];
    const pendingCustom = customRequests.filter(r => r.status === 'pending').length;
    this.setData({
      stats: { products: products.length, orders: orders.length, pendingOrders: pending, revenue, pendingCustom },
    });
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  onLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' }); return;
    }
    this.setData({ isLoading: true });
    setTimeout(() => {
      const merchant = db.verifyMerchant(username, password);
      if (!merchant) {
        wx.showToast({ title: '账号或密码错误', icon: 'none' });
        this.setData({ isLoading: false }); return;
      }
      const userInfo = {
        id: 'merchant_' + username,
        name: merchant.name,
        phone: '',
        avatar: '',
        isMerchant: true,
      };
      auth.login(userInfo);
      this.setData({ isMerchant: true, isLoading: false });
      this.loadStats();
      wx.showToast({ title: '商家登录成功', icon: 'success' });
    }, 600);
  },

  onLogout() {
    wx.showModal({
      title: '退出商家后台', content: '确认退出？', confirmText: '退出', confirmColor: '#3A332D',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          this.setData({ isMerchant: false, username: '', password: '' });
        }
      },
    });
  },

  onBack() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onManageProducts() {
    wx.navigateTo({ url: '/pages/merchant/products/products' });
  },

  onManageOrders() {
    wx.navigateTo({ url: '/pages/merchant/orders/orders' });
  },

  onAddProduct() {
    wx.navigateTo({ url: '/pages/merchant/add-product/add-product' });
  },

  onManageBanners() {
    wx.navigateTo({ url: '/pages/merchant/banner/banner' });
  },

  onManageCoupons() {
    wx.navigateTo({ url: '/pages/merchant/coupon/coupon' });
  },

  onManageService() {
    wx.navigateTo({ url: '/pages/merchant/service/service' });
  },

  onManageCustomRequests() {
    wx.navigateTo({ url: '/pages/merchant/custom/custom' });
  },

  onManageCases() {
    wx.navigateTo({ url: '/pages/merchant/cases/cases' });
  },

  onManageShipping() {
    wx.navigateTo({ url: '/pages/merchant/shipping/shipping' });
  },

  onManageNewbie() {
    wx.navigateTo({ url: '/pages/merchant/newbie/newbie' });
  },

  onManageGrass() {
    wx.navigateTo({ url: '/pages/merchant/grass/grass' });
  },

  onManageReviews() {
    wx.navigateTo({ url: '/pages/merchant/reviews/reviews' });
  },
});
