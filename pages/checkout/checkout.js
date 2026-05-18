const app = getApp();
const db = require('../../utils/db');

Page({
  data: {
    items: [],
    address: null,
    availableCoupons: [],
    selectedCoupon: null,
    remark: '',
    giftBag: false,
    giftProducts: [],
    productTotal: 0,
    shipping: 0,
    couponDiscount: 0,
    actualTotal: 0,
    showCouponModal: false,
    showPayModal: false,
  },

  onLoad() {
    const items = wx.getStorageSync('checkoutItems') || [];
    const normalizedItems = items.map(p => {
      const images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
      return { ...p, images };
    });
    const giftProducts = db.getGiftProducts();
    this.setData({ items: normalizedItems, giftProducts });
    this.loadAddress();
    this.loadCoupons();
    this.calcAmount();
  },

  onShow() {
    this.loadAddress();
  },

  loadAddress() {
    const addrs = app.getAddresses();
    const def = addrs.find(a => a.isDefault) || addrs[0] || null;
    this.setData({ address: def });
  },

  loadCoupons() {
    const items = this.data.items;
    const productTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const allCoupons = wx.getStorageSync('userCoupons') || this._defaultCoupons();
    const now = new Date();
    const available = allCoupons.filter(c =>
      c.status === 'unused' && new Date(c.expiresAt) >= now && c.minAmount <= productTotal
    );
    const preSelected = wx.getStorageSync('selectedCouponId');
    let selectedCoupon = null;
    if (preSelected) {
      selectedCoupon = available.find(c => c.id === preSelected) || null;
      wx.removeStorageSync('selectedCouponId');
    }
    this.setData({ availableCoupons: available, selectedCoupon }, () => { this.calcAmount(); });
  },

  _defaultCoupons() {
    const defaults = [
      { id: 'cpn_welcome', title: '新用户专享礼', discount: 100, minAmount: 500, expiresAt: '2026-12-31', status: 'unused', type: 'fixed', tag: '满减' },
      { id: 'cpn_summer', title: '夏日艺术季', discount: 50, minAmount: 300, expiresAt: '2026-08-31', status: 'unused', type: 'fixed', tag: '满减' },
    ];
    wx.setStorageSync('userCoupons', defaults);
    return defaults;
  },

  calcAmount() {
    const { items, selectedCoupon } = this.data;
    const productTotal = parseFloat(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
    const shippingCfg = db.getShippingSettings();
    const shipping = productTotal >= shippingCfg.freeThreshold ? 0 : shippingCfg.baseFee;
    let couponDiscount = 0;
    if (selectedCoupon) {
      if (selectedCoupon.type === 'fixed') {
        couponDiscount = selectedCoupon.discount;
      } else if (selectedCoupon.type === 'percent') {
        couponDiscount = Math.round(productTotal * (10 - selectedCoupon.discount) / 10);
      }
    }
    const actualTotal = parseFloat(Math.max(0, productTotal + shipping - couponDiscount).toFixed(2));
    this.setData({ productTotal, shipping, couponDiscount, actualTotal });
  },

  onSelectAddress() { wx.navigateTo({ url: '/pages/address/address' }); },

  onSelectCoupon() {
    if (this.data.availableCoupons.length === 0 && !this.data.selectedCoupon) {
      wx.showToast({ title: '暂无可用优惠券', icon: 'none' }); return;
    }
    this.setData({ showCouponModal: true });
  },

  onCloseCouponModal() { this.setData({ showCouponModal: false }); },

  onUseCoupon(e) {
    const { id } = e.currentTarget.dataset;
    const coupon = this.data.availableCoupons.find(c => c.id === id);
    if (!coupon) return;
    this.setData({ selectedCoupon: coupon, showCouponModal: false }, () => { this.calcAmount(); });
  },

  onClearCoupon() {
    this.setData({ selectedCoupon: null, showCouponModal: false }, () => { this.calcAmount(); });
  },

  onToggleGiftBag() {
    this.setData({ giftBag: !this.data.giftBag }, () => { this.calcAmount(); });
  },

  onGiftProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onAddGiftToCart(e) {
    const { id } = e.currentTarget.dataset;
    const prod = this.data.giftProducts.find(p => p.id === id);
    if (!prod) return;
    const items = this.data.items.map(i => ({ ...i }));
    const existing = items.find(i => i.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ ...prod, quantity: 1 });
    }
    this.setData({ items }, () => { this.calcAmount(); });
    wx.showToast({ title: '已加入订单', icon: 'success', duration: 1000 });
  },

  onItemMinus(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const items = this.data.items.map(i => ({ ...i }));
    if (items[idx].quantity <= 1) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity -= 1;
    }
    this.setData({ items }, () => this.calcAmount());
  },

  onItemPlus(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const items = this.data.items.map(i => ({ ...i }));
    items[idx].quantity += 1;
    this.setData({ items }, () => this.calcAmount());
  },

  onItemDelete(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    wx.showModal({
      title: '移除商品',
      content: '确认将该商品从订单中移除？',
      confirmText: '移除', confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        const items = this.data.items.filter((_, i) => i !== idx);
        this.setData({ items }, () => this.calcAmount());
      },
    });
  },

  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

  onPay() {
    if (!this.data.address) { wx.showToast({ title: '请选择收货地址', icon: 'none' }); return; }
    if (this.data.items.length === 0) { wx.showToast({ title: '订单为空', icon: 'none' }); return; }
    this.setData({ showPayModal: true });
  },

  onClosePayModal() { this.setData({ showPayModal: false }); },

  onSimulatePay() {
    const { items, address, selectedCoupon, remark, actualTotal, productTotal, shipping, couponDiscount, giftBag } = this.data;
    const userInfo = app.globalData.userInfo;
    const order = {
      id: 'ORD' + Date.now(),
      userId: userInfo ? userInfo.id : 'guest',
      products: items,
      productTotal,
      shipping,
      couponDiscount,
      giftBag,
      giftBagFee: giftBag ? 8 : 0,
      totalAmount: actualTotal,
      coupon: selectedCoupon || null,
      remark: remark || '',
      status: 'paid',
      address: address || null,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (selectedCoupon) {
      const all = wx.getStorageSync('userCoupons') || [];
      const updated = all.map(c => c.id === selectedCoupon.id ? { ...c, status: 'used' } : c);
      wx.setStorageSync('userCoupons', updated);
    }

    const orders = app.getOrders();
    orders.unshift(order);
    app.saveOrders(orders);

    items.forEach(i => db.incSoldCount(i.id, i.quantity));

    const checkoutIds = items.map(i => i.id);
    const cart = app.getCart().filter(i => checkoutIds.indexOf(i.id) < 0);
    app.saveCart(cart);

    this.setData({ showPayModal: false });
    wx.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => { wx.redirectTo({ url: '/pages/orders/orders' }); }, 1500);
  },
});
