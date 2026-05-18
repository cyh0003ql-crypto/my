const db = require('../../utils/db');
const app = getApp();

function normalizeProduct(p) {
  if (!p) return p;
  const cover = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  return { ...p, image: cover };
}

Page({
  data: {
    banners: [],
    featuredProducts: [],
    newProducts: [],
    newProductsPreview: [],
    newbieProducts: [],
    grassPosts: [],
    categories: [],
    currentBanner: 0,
    searchKeyword: '',
    cartCount: 0,
    showMoreNew: false,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0, cartCount: app.globalData.cartCount });
    }
    this.setData({ cartCount: app.globalData.cartCount });
    app.cartCountCallback = (count) => {
      this.setData({ cartCount: count });
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ cartCount: count });
      }
    };
    this.refreshFavStatus();
  },

  onUnload() {
    app.cartCountCallback = null;
  },

  loadData() {
    const banners = db.getBanners();
    const rawFeatured = db.getFeaturedProducts().map(normalizeProduct);
    const rawNew = db.getNewProducts().map(normalizeProduct);
    const allCats = db.getCategories();
    const categories = allCats.filter(c => c.id !== 'all').slice(0, 6);

    const featuredProducts = rawFeatured.map(p => ({
      ...p,
      isFav: app.isFavorite(p.id),
    }));
    const newProducts = rawNew.map(p => ({
      ...p,
      isFav: app.isFavorite(p.id),
    }));

    const newbieProducts = db.getNewbieProducts();
    const grassPosts = db.getGrassPosts();
    const newProductsPreview = newProducts.slice(0, 4);
    this.setData({ banners, featuredProducts, newProducts, newProductsPreview, newbieProducts, grassPosts, categories });
  },

  refreshFavStatus() {
    const featuredProducts = (this.data.featuredProducts || []).map(p => ({
      ...p,
      isFav: app.isFavorite(p.id),
    }));
    const newProducts = (this.data.newProducts || []).map(p => ({
      ...p,
      isFav: app.isFavorite(p.id),
    }));
    this.setData({ featuredProducts, newProducts });
  },

  onBannerChange(e) {
    this.setData({ currentBanner: e.detail.current });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    const kw = this.data.searchKeyword.trim();
    if (!kw) return;
    wx.setStorageSync('searchKeyword', kw);
    wx.switchTab({ url: '/pages/category/category' });
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.setStorageSync('pendingCategory', id);
    wx.switchTab({ url: '/pages/category/category' });
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onAddToCart(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    if (product.skuOptions && product.skuOptions.length > 0) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
      wx.showToast({ title: '请先选择规格', icon: 'none', duration: 1500 });
      return;
    }
    app.addToCart(product, 1);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
    this.setData({ cartCount: app.globalData.cartCount });
  },

  onQuickFav(e) {
    const { id, index, type } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    const result = app.toggleFavorite(product);
    if (type === 'featured') {
      const key = 'featuredProducts[' + index + '].isFav';
      this.setData({ [key]: result });
    } else {
      const key = 'newProducts[' + index + '].isFav';
      this.setData({ [key]: result });
    }
    wx.showToast({ title: result ? '已收藏' : '已取消收藏', icon: 'none', duration: 1200 });
  },

  onMoreNewbie() {
    wx.switchTab({ url: '/pages/category/category' });
  },

  onNewbieTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/newbie-detail/newbie-detail?id=' + id });
  },

  onAddNewbieToCart(e) {
    const { id } = e.currentTarget.dataset;
    const newbieList = db.getNewbieProducts();
    const product = newbieList.find(p => p.id === id);
    if (!product) return;
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      images: [product.image],
      description: product.desc,
      tags: ['新人专享'],
      stock: product.stock,
    };
    app.addToCart(cartItem, 1);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
    this.setData({ cartCount: app.globalData.cartCount });
  },

  onGrassTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/grass/grass?id=' + id });
  },

  onMoreGrass() {
    wx.showToast({ title: '更多内容即将上线', icon: 'none' });
  },

  onToggleMoreNew() {
    this.setData({ showMoreNew: !this.data.showMoreNew });
  },

  onMoreFeatured() {
    wx.switchTab({ url: '/pages/category/category' });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },
});
