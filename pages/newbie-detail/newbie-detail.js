const db = require('../../utils/db');
const app = getApp();

Page({
  data: {
    product: null,
    quantity: 1,
    isFavorite: false,
    showBuyModal: false,
    favScaling: false,
    statusBarHeight: 20,
    navHeight: 64,
    addGiftBag: false,
    totalAmount: 0,
    soldCount: 0,
    reviews: [],
    totalReviewCount: 0,
  },

  onLoad(options) {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const statusBarHeight = info.statusBarHeight || 20;
      const navHeight = statusBarHeight + 44;
      this.setData({ statusBarHeight, navHeight });
    } catch (e) {
      this.setData({ statusBarHeight: 20, navHeight: 64 });
    }

    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const rawList = db.getAllNewbieProducts();
    const raw = rawList.find(p => p.id === id);
    if (!raw) {
      wx.showToast({ title: '商品不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const product = this._normalize(raw);
    const isFavorite = app.isFavorite(id);
    const soldCount = db.getSoldCount ? db.getSoldCount(id) : 0;
    const rawReviews = db.getProductReviews ? db.getProductReviews(id) : [];
    const totalReviewCount = rawReviews.length;
    const reviews = rawReviews
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0))
      .slice(0, 3)
      .map(r => ({
        ...r,
        stars: [1, 2, 3, 4, 5].map(n => n <= r.rating),
        dateStr: r.createdAt ? r.createdAt.substring(0, 10) : '',
        images: r.images || [],
      }));
    this.setData({ product, isFavorite, totalAmount: product.price, soldCount, reviews, totalReviewCount });
  },

  _normalize(p) {
    const images = p.images && p.images.length > 0 ? p.images : [p.image];
    const savedAmount = (p.originalPrice - p.price).toFixed(1);
    return {
      ...p,
      images,
      description: p.description || p.desc || '',
      descImages: p.descImages || [],
      tags: p.tags || [],
      savedAmount,
    };
  },

  onPreviewImage(e) {
    const { src } = e.currentTarget.dataset;
    const urls = this.data.product.images;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: src, urls });
  },

  onPreviewDescImage(e) {
    const { src, urls } = e.currentTarget.dataset;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: src, urls });
  },

  onPreviewReviewImage(e) {
    const { src, urls } = e.currentTarget.dataset;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: src, urls });
  },

  onGoAllReviews() {
    const { product } = this.data;
    if (!product) return;
    wx.navigateTo({
      url: '/pages/all-reviews/all-reviews?id=' + product.id + '&name=' + encodeURIComponent(product.name),
    });
  },

  onAddToCart() {
    const { product, quantity } = this.data;
    if (!this.checkStock()) return;
    app.addToCart(product, quantity);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
  },

  onBuyNow() {
    if (!this.checkStock()) return;
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' }); return;
    }
    const totalAmount = this._calcTotal(this.data.quantity, this.data.addGiftBag);
    this.setData({ showBuyModal: true, addGiftBag: false, totalAmount });
  },

  checkStock() {
    const { product, quantity } = this.data;
    if (!product || product.stock <= 0) {
      wx.showToast({ title: '商品已售罄', icon: 'none' });
      return false;
    }
    if (quantity > product.stock) {
      wx.showToast({ title: '库存仅剩 ' + product.stock + ' 件', icon: 'none' });
      return false;
    }
    return true;
  },

  _calcTotal(qty, giftBag) {
    const { product } = this.data;
    if (!product) return 0;
    return parseFloat((product.price * qty + (giftBag ? 8 : 0)).toFixed(2));
  },

  onQuantityMinus() {
    if (this.data.quantity <= 1) return;
    const quantity = this.data.quantity - 1;
    this.setData({ quantity, totalAmount: this._calcTotal(quantity, this.data.addGiftBag) });
  },

  onQuantityPlus() {
    const { quantity, product, addGiftBag } = this.data;
    if (quantity >= product.stock) {
      wx.showToast({ title: '已达库存上限', icon: 'none' }); return;
    }
    const newQty = quantity + 1;
    this.setData({ quantity: newQty, totalAmount: this._calcTotal(newQty, addGiftBag) });
  },

  onToggleGiftBag() {
    const addGiftBag = !this.data.addGiftBag;
    this.setData({ addGiftBag, totalAmount: this._calcTotal(this.data.quantity, addGiftBag) });
  },

  onShare() {
    wx.showShareMenu({ withShareTicket: false });
  },

  onFavTouchStart() { this.setData({ favScaling: true }); },
  onFavTouchEnd() { this.setData({ favScaling: false }); },

  onToggleFavorite() {
    const { product } = this.data;
    const result = app.toggleFavorite(product);
    this.setData({ isFavorite: result });
    wx.showToast({ title: result ? '已收藏' : '已取消收藏', icon: 'none', duration: 1000 });
  },

  onCloseModal() {
    this.setData({ showBuyModal: false });
  },

  onSimulatePay() {
    const { product, quantity, addGiftBag, totalAmount } = this.data;
    const userInfo = app.globalData.userInfo;
    const productTotal = parseFloat((product.price * quantity).toFixed(2));
    const giftFee = addGiftBag ? 8 : 0;
    const order = {
      id: 'ORD' + Date.now(),
      userId: userInfo ? userInfo.id : 'guest',
      products: [{ ...product, quantity }],
      productTotal,
      giftBag: addGiftBag,
      giftFee,
      totalAmount: totalAmount || parseFloat((productTotal + giftFee).toFixed(2)),
      status: 'paid',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      address: wx.getStorageSync('defaultAddress') || null,
    };
    const orders = app.getOrders();
    orders.unshift(order);
    app.saveOrders(orders);
    this.setData({ showBuyModal: false });
    wx.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/orders/orders' });
    }, 1500);
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product ? product.name + ' — 新人专享' : 'Petit Aura',
      path: product ? '/pages/newbie-detail/newbie-detail?id=' + product.id : '/pages/index/index',
    };
  },
});
