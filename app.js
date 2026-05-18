App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    isMerchant: false,
    cartCount: 0,
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.isMerchant = userInfo.isMerchant || false;
    }
    this.updateCartCount();
  },

  updateCartCount() {
    const cart = wx.getStorageSync('cart') || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    this.globalData.cartCount = count;
    if (typeof this.cartCountCallback === 'function') {
      this.cartCountCallback(count);
    }
    // 同步更新自定义 tabBar 角标
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (typeof currentPage.getTabBar === 'function') {
          const tabBar = currentPage.getTabBar();
          if (tabBar) tabBar.setData({ cartCount: count });
        }
      }
    } catch (e) {}
  },

  getCart() {
    return wx.getStorageSync('cart') || [];
  },

  saveCart(cart) {
    wx.setStorageSync('cart', cart);
    this.updateCartCount();
  },

  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const idx = cart.findIndex(item => item.id === product.id);
    if (idx >= 0) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    this.saveCart(cart);
  },

  getOrders() {
    return wx.getStorageSync('orders') || [];
  },

  saveOrders(orders) {
    wx.setStorageSync('orders', orders);
  },

  getFavorites() {
    return wx.getStorageSync('favorites') || [];
  },

  saveFavorites(favs) {
    wx.setStorageSync('favorites', favs);
  },

  toggleFavorite(product) {
    const favs = this.getFavorites();
    const idx = favs.findIndex(f => f.id === product.id);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(product);
    }
    this.saveFavorites(favs);
    return idx < 0;
  },

  isFavorite(productId) {
    const favs = this.getFavorites();
    return favs.some(f => f.id === productId);
  },

  getAddresses() {
    return wx.getStorageSync('addresses') || [];
  },

  saveAddresses(addresses) {
    wx.setStorageSync('addresses', addresses);
  },
});
