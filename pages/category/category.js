const db = require('../../utils/db');
const app = getApp();

function normalizeProduct(p) {
  if (!p) return p;
  const cover = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  return { ...p, image: cover };
}

Page({
  data: {
    categories: [],
    products: [],
    activeCategory: 'all',
    keyword: '',
    isSearching: false,
  },

  onLoad(options) {
    const categories = db.getCategories();
    this.setData({ categories });
    if (options.keyword) {
      this.setData({ keyword: options.keyword, isSearching: true });
      this.doSearch(options.keyword);
    } else {
      this.loadProducts('all');
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1, cartCount: app.globalData.cartCount });
    }
    const pendingSearch = wx.getStorageSync('searchKeyword');
    if (pendingSearch) {
      wx.removeStorageSync('searchKeyword');
      this.setData({ keyword: pendingSearch, isSearching: true });
      this.doSearch(pendingSearch);
      return;
    }
    const pending = wx.getStorageSync('pendingCategory');
    if (pending) {
      wx.removeStorageSync('pendingCategory');
      this.setData({ activeCategory: pending, isSearching: false, keyword: '' });
      this.loadProducts(pending);
    } else {
      this.loadProducts(this.data.activeCategory);
    }
  },

  loadProducts(categoryId) {
    const products = db.getProducts(categoryId).map(normalizeProduct);
    this.setData({ products, activeCategory: categoryId });
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ isSearching: false, keyword: '' });
    this.loadProducts(id);
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onAddToCart(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    app.addToCart(product, 1);
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1500 });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    if (!keyword.trim()) {
      this.setData({ isSearching: false });
      this.loadProducts(this.data.activeCategory);
    }
  },

  onSearch() {
    const kw = this.data.keyword.trim();
    if (!kw) return;
    this.setData({ isSearching: true });
    this.doSearch(kw);
  },

  doSearch(kw) {
    const results = db.searchProducts(kw).map(normalizeProduct);
    this.setData({ products: results });
  },

  onClearSearch() {
    this.setData({ keyword: '', isSearching: false });
    this.loadProducts(this.data.activeCategory);
  },
});
