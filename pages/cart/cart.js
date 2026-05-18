const app = getApp();

Page({
  data: {
    cartItems: [],
    totalPrice: 0,
    selectedIds: [],
    selectedMap: {},
    allSelected: true,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3, cartCount: app.globalData.cartCount });
    }
    this.loadCart();
  },

  loadCart() {
    const cart = app.getCart();
    // 兼容旧字段 image / 新字段 images[]
    const items = cart.map(p => {
      const images = (p.images && p.images.length > 0)
        ? p.images
        : (p.image ? [p.image] : []);
      return { ...p, images };
    });
    const selectedIds = items.map(i => i.id);
    const selectedMap = {};
    selectedIds.forEach(id => { selectedMap[id] = true; });
    this.setData({ cartItems: items, selectedIds, selectedMap });
    this.calcTotal(items, selectedIds);
  },

  calcTotal(items, selectedIds) {
    const raw = items
      .filter(i => selectedIds.indexOf(i.id) >= 0)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = parseFloat(raw.toFixed(2));
    const allSelected = items.length > 0 && items.every(i => selectedIds.indexOf(i.id) >= 0);
    this.setData({ totalPrice: total, allSelected });
  },

  onToggleSelect(e) {
    const { id } = e.currentTarget.dataset;
    let { selectedIds } = this.data;
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) {
      selectedIds = selectedIds.filter(s => s !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
    const selectedMap = {};
    selectedIds.forEach(sid => { selectedMap[sid] = true; });
    this.setData({ selectedIds, selectedMap });
    this.calcTotal(this.data.cartItems, selectedIds);
  },

  onToggleAll() {
    const { cartItems, allSelected } = this.data;
    const selectedIds = allSelected ? [] : cartItems.map(i => i.id);
    const selectedMap = {};
    selectedIds.forEach(id => { selectedMap[id] = true; });
    this.setData({ selectedIds, selectedMap });
    this.calcTotal(cartItems, selectedIds);
  },

  onMinus(e) {
    const { id } = e.currentTarget.dataset;
    const cart = app.getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx < 0) return;
    if (cart[idx].quantity <= 1) {
      this.removeItem(id);
      return;
    }
    cart[idx].quantity -= 1;
    app.saveCart(cart);
    this.loadCart();
  },

  onPlus(e) {
    const { id } = e.currentTarget.dataset;
    const cart = app.getCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx < 0) return;
    cart[idx].quantity += 1;
    app.saveCart(cart);
    this.loadCart();
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '是否将该商品从购物车中移除？',
      confirmText: '移除',
      confirmColor: '#3A332D',
      success: (res) => {
        if (!res.confirm) return;
        this.removeItem(id);
      },
    });
  },

  removeItem(id) {
    const cart = app.getCart().filter(i => i.id !== id);
    app.saveCart(cart);
    this.loadCart();
  },

  onGoShop() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onCheckout() {
    const { cartItems, selectedIds } = this.data;
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const selectedItems = cartItems.filter(i => selectedIds.indexOf(i.id) >= 0);
    wx.setStorageSync('checkoutItems', selectedItems);
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  },
});
