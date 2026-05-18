const db = require('../../utils/db');
const app = getApp();

Page({
  data: {
    product: null,
    quantity: 1,
    currentImage: 0,
    isFavorite: false,
    showBuyModal: false,
    selectedSku: {},
    favScaling: false,
    statusBarHeight: 20,
    navHeight: 64,
    capsuleRight: 10,
    addGiftBag: false,
    totalAmount: 0,
    soldCount: 0,
    reviews: [],
    totalReviewCount: 0,
    giftProducts: [],
    giftItems: [],
    giftTotal: '0.00',
    shippingCfg: { baseFee: 15, freeThreshold: 200 },
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
    try {
      const menuBtn = wx.getMenuButtonBoundingClientRect();
      const windowWidth = wx.getWindowInfo ? wx.getWindowInfo().windowWidth : wx.getSystemInfoSync().windowWidth;
      const capsuleRight = windowWidth - menuBtn.left + 4;
      this.setData({ capsuleRight });
    } catch (e) {
      this.setData({ capsuleRight: 10 });
    }

    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const rawProduct = db.getProductById(id);
    if (!rawProduct) {
      wx.showToast({ title: '商品不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const product = this._normalizeProduct(rawProduct);
    const isFavorite = app.isFavorite(id);
    const totalAmount = product.price * 1;
    const soldCount = db.getSoldCount(id);
    const rawReviews = db.getProductReviews(id);
    const totalReviewCount = rawReviews.length;
    const reviews = rawReviews
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0))
      .slice(0, 3)
      .map(r => ({
        ...r,
        stars: [1, 2, 3, 4, 5].map(n => n <= r.rating),
        dateStr: r.createdAt ? r.createdAt.substring(0, 10) : '',
      }));
    const giftProducts = db.getGiftProducts();
    const shippingCfg = db.getShippingSettings();
    this.setData({ product, isFavorite, totalAmount, soldCount, reviews, totalReviewCount, giftProducts, shippingCfg });
  },

  _normalizeProduct(p) {
    if (!p) return p;
    const images = (p.images && p.images.length > 0)
      ? p.images
      : (p.image ? [p.image] : []);
    return { ...p, images };
  },

  onImageChange(e) {
    this.setData({ currentImage: e.detail.current });
  },

  onPreviewImage(e) {
    const { src } = e.currentTarget.dataset;
    const urls = this.data.product.images;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: src, urls });
  },

  _isSkuComplete() {
    const { product, selectedSku } = this.data;
    if (!product.skuOptions || product.skuOptions.length === 0) return true;
    return product.skuOptions.every(g => selectedSku[g.name]);
  },

  _getSkuStr() {
    const { product, selectedSku } = this.data;
    if (!product.skuOptions || !product.skuOptions.length) return '';
    return product.skuOptions.map(g => g.name + ':' + (selectedSku[g.name] || '')).join(' ');
  },

  onSelectSku(e) {
    const { group, val } = e.currentTarget.dataset;
    const selectedSku = { ...this.data.selectedSku };
    if (selectedSku[group] === val) {
      delete selectedSku[group];
    } else {
      selectedSku[group] = val;
    }
    let currentImage = this.data.currentImage;
    const product = this.data.product;
    if (product && selectedSku[group]) {
      const key = group + ':' + selectedSku[group];
      const skuValueImages = product.skuValueImages;
      const skuImageMap = product.skuImageMap;
      if (skuValueImages && skuValueImages[key]) {
        const imgPath = skuValueImages[key];
        const idx = (product.images || []).indexOf(imgPath);
        if (idx >= 0) currentImage = idx;
      } else if (skuImageMap && skuImageMap[key] !== undefined) {
        currentImage = skuImageMap[key];
      }
    }
    this.setData({ selectedSku, currentImage });
  },

  onAddToCart() {
    const { product, quantity } = this.data;
    if (!this.checkStock()) return;
    if (!this._isSkuComplete()) {
      wx.showToast({ title: '请选择规格', icon: 'none' }); return;
    }
    const spec = this._getSkuStr();
    app.addToCart(spec ? { ...product, spec } : product, quantity);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
  },

  onBuyNow() {
    if (!this.checkStock()) return;
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' }); return;
    }
    if (!this._isSkuComplete()) {
      wx.showToast({ title: '请先选择规格', icon: 'none' });
      this.setData({ showBuyModal: true, addGiftBag: false, giftItems: [], giftTotal: '0.00', totalAmount: this._calcTotal(this.data.quantity, []) });
      return;
    }
    const totalAmount = this._calcTotal(this.data.quantity, []);
    this.setData({ showBuyModal: true, addGiftBag: false, giftItems: [], giftTotal: '0.00', totalAmount });
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

  _calcGiftTotal(giftItems) {
    const total = (giftItems || []).reduce((s, g) => s + g.price * g.quantity, 0);
    return total.toFixed(2);
  },

  _calcTotal(qty, giftItems) {
    const { product } = this.data;
    if (!product) return 0;
    const giftSum = (giftItems || []).reduce((s, g) => s + g.price * g.quantity, 0);
    return parseFloat((product.price * qty + giftSum).toFixed(2));
  },

  onQuantityMinus() {
    if (this.data.quantity <= 1) return;
    const quantity = this.data.quantity - 1;
    this.setData({ quantity, totalAmount: this._calcTotal(quantity, this.data.giftItems) });
  },

  onQuantityPlus() {
    const { quantity, product, giftItems } = this.data;
    if (quantity >= product.stock) {
      wx.showToast({ title: '已达库存上限', icon: 'none' }); return;
    }
    const newQty = quantity + 1;
    this.setData({ quantity: newQty, totalAmount: this._calcTotal(newQty, giftItems) });
  },

  onToggleGiftBag() {
    const addGiftBag = !this.data.addGiftBag;
    const giftItems = addGiftBag ? this.data.giftItems : [];
    this.setData({ addGiftBag, giftItems, giftTotal: this._calcGiftTotal(giftItems), totalAmount: this._calcTotal(this.data.quantity, giftItems) });
  },

  onDetailGiftProductAdd(e) {
    const { id } = e.currentTarget.dataset;
    const prod = this.data.giftProducts.find(p => p.id === id);
    if (!prod) return;
    const giftItems = this.data.giftItems.map(g => ({ ...g }));
    const existing = giftItems.find(g => g.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      giftItems.push({ ...prod, quantity: 1 });
    }
    this.setData({ giftItems, giftTotal: this._calcGiftTotal(giftItems), totalAmount: this._calcTotal(this.data.quantity, giftItems) });
    wx.showToast({ title: '已添加', icon: 'success', duration: 800 });
  },

  onGiftItemPlus(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const giftItems = this.data.giftItems.map(g => ({ ...g }));
    giftItems[idx].quantity += 1;
    this.setData({ giftItems, giftTotal: this._calcGiftTotal(giftItems), totalAmount: this._calcTotal(this.data.quantity, giftItems) });
  },

  onGiftItemMinus(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const giftItems = this.data.giftItems.map(g => ({ ...g }));
    if (giftItems[idx].quantity <= 1) {
      giftItems.splice(idx, 1);
    } else {
      giftItems[idx].quantity -= 1;
    }
    this.setData({ giftItems, giftTotal: this._calcGiftTotal(giftItems), totalAmount: this._calcTotal(this.data.quantity, giftItems) });
  },

  onGiftItemRemove(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    const giftItems = this.data.giftItems.filter((_, i) => i !== idx);
    this.setData({ giftItems, giftTotal: this._calcGiftTotal(giftItems), totalAmount: this._calcTotal(this.data.quantity, giftItems) });
  },

  _dragStartY: 0,

  onModalDragStart(e) {
    this._dragStartY = e.touches[0].clientY;
  },

  onModalDragEnd(e) {
    const deltaY = e.changedTouches[0].clientY - this._dragStartY;
    if (deltaY > 60) {
      this.onCloseModal();
    }
  },

  onShare() {
    wx.showShareMenu({ withShareTicket: false });
  },

  onFavTouchStart() {
    this.setData({ favScaling: true });
  },

  onFavTouchEnd() {
    this.setData({ favScaling: false });
  },

  onToggleFavorite() {
    const { product } = this.data;
    const result = app.toggleFavorite(product);
    this.setData({ isFavorite: result });
    wx.showToast({ title: result ? '已收藏' : '已取消收藏', icon: 'none', duration: 1000 });
  },

  onCloseModal() {
    this.setData({ showBuyModal: false, quantity: 1, selectedSku: {} });
  },

  onDetailGiftProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onSimulatePay() {
    const { product, quantity, addGiftBag, totalAmount, giftItems, shippingCfg } = this.data;
    const userInfo = app.globalData.userInfo;
    const productTotal = parseFloat((product.price * quantity).toFixed(2));
    const allProducts = [{ ...product, quantity }, ...giftItems];
    const giftTotal = giftItems.reduce((s, g) => s + g.price * g.quantity, 0);
    const subtotal = productTotal + giftTotal;
    const shipping = subtotal >= shippingCfg.freeThreshold ? 0 : shippingCfg.baseFee;
    const order = {
      id: 'ORD' + Date.now(),
      userId: userInfo ? userInfo.id : 'guest',
      products: allProducts,
      productTotal: parseFloat(subtotal.toFixed(2)),
      shipping,
      giftBag: addGiftBag,
      giftFee: giftTotal,
      totalAmount: totalAmount || parseFloat((subtotal + shipping).toFixed(2)),
      status: 'paid',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      address: wx.getStorageSync('defaultAddress') || null,
    };
    const orders = app.getOrders();
    orders.unshift(order);
    app.saveOrders(orders);
    db.incSoldCount(product.id, quantity);
    this.setData({ showBuyModal: false });
    wx.showToast({ title: '支付成功', icon: 'success' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/orders/orders' });
    }, 1500);
  },

  onGoAllReviews() {
    const { product } = this.data;
    if (!product) return;
    wx.navigateTo({
      url: '/pages/all-reviews/all-reviews?id=' + product.id + '&name=' + encodeURIComponent(product.name),
    });
  },

  onPreviewDescImage(e) {
    const { src, index } = e.currentTarget.dataset;
    const urls = this.data.product.descImages || [];
    if (!urls.length) return;
    wx.previewImage({ current: src, urls });
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product ? product.name : 'Petit Aura',
      path: product ? '/pages/detail/detail?id=' + product.id : '/pages/index/index',
    };
  },
});
