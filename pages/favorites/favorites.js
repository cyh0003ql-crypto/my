const app = getApp();
const db = require('../../utils/db');

function normalizeProduct(p) {
  if (!p) return p;
  const cover = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  return { ...p, image: cover };
}

Page({
  data: { favorites: [] },

  onShow() {
    const favs = app.getFavorites().map(normalizeProduct);
    this.setData({ favorites: favs });
  },

  onProductTap(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  onRemove(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (product) app.toggleFavorite(product);
    const favs = app.getFavorites().map(normalizeProduct);
    this.setData({ favorites: favs });
    wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 });
  },

  onAddToCart(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    app.addToCart(product, 1);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
  },

  onGoShop() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
