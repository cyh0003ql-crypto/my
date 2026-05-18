const db = require('../../../utils/db');
const app = getApp();

function normalizeProduct(p) {
  if (!p) return p;
  const cover = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  return { ...p, image: cover };
}

Page({
  data: {
    activeTab: 0,
    products: [],
    newbieProducts: [],
  },

  onLoad(options) {
    if (!app.globalData.isMerchant) {
      wx.navigateBack(); return;
    }
    if (options.tab) {
      this.setData({ activeTab: parseInt(options.tab) || 0 });
    }
    this.loadProducts();
    this.loadNewbieProducts();
  },

  onShow() {
    this.loadProducts();
    this.loadNewbieProducts();
  },

  onTabSwitch(e) {
    this.setData({ activeTab: parseInt(e.currentTarget.dataset.tab) });
  },

  loadProducts() {
    const products = db.getProducts().map(normalizeProduct);
    this.setData({ products });
  },

  loadNewbieProducts() {
    const newbieProducts = db.getAllNewbieProducts().map(normalizeProduct);
    this.setData({ newbieProducts });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/merchant/add-product/add-product' });
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/merchant/add-product/add-product?id=' + id });
  },

  onDelete(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除商品',
      content: '确认删除「' + name + '」？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        db.deleteProduct(id);
        this.loadProducts();
        wx.showToast({ title: '已删除', icon: 'success' });
      },
    });
  },

  onToggleFeatured(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    db.updateProduct(id, { isFeatured: !product.isFeatured });
    this.loadProducts();
  },

  onUpdateStock(e) {
    const { id } = e.currentTarget.dataset;
    const product = db.getProductById(id);
    if (!product) return;
    wx.showModal({
      title: '修改库存',
      editable: true,
      placeholderText: '当前库存：' + product.stock,
      success: (res) => {
        if (!res.confirm || !res.content) return;
        const stock = parseInt(res.content);
        if (isNaN(stock) || stock < 0) { wx.showToast({ title: '请输入有效数量', icon: 'none' }); return; }
        db.updateProduct(id, { stock });
        this.loadProducts();
        wx.showToast({ title: '库存已更新', icon: 'success' });
      },
    });
  },

  onAddNewbie() {
    wx.navigateTo({ url: '/pages/merchant/newbie-form/newbie-form' });
  },

  onEditNewbie(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/merchant/newbie-form/newbie-form?id=' + id });
  },

  onToggleNewbieActive(e) {
    const { id } = e.currentTarget.dataset;
    const product = this.data.newbieProducts.find(p => p.id === id);
    if (!product) return;
    db.updateNewbieProduct(id, { isActive: !product.isActive });
    this.loadNewbieProducts();
    wx.showToast({ title: product.isActive ? '已下架' : '已上架', icon: 'none' });
  },

  onDeleteNewbie(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除新人商品',
      content: '确认删除「' + name + '」？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        db.deleteNewbieProduct(id);
        this.loadNewbieProducts();
        wx.showToast({ title: '已删除', icon: 'success' });
      },
    });
  },

  onUpdateNewbieStock(e) {
    const { id } = e.currentTarget.dataset;
    const product = this.data.newbieProducts.find(p => p.id === id);
    if (!product) return;
    wx.showModal({
      title: '修改库存',
      editable: true,
      placeholderText: '当前库存：' + product.stock,
      success: (res) => {
        if (!res.confirm || !res.content) return;
        const stock = parseInt(res.content);
        if (isNaN(stock) || stock < 0) { wx.showToast({ title: '请输入有效数量', icon: 'none' }); return; }
        db.updateNewbieProduct(id, { stock });
        this.loadNewbieProducts();
        wx.showToast({ title: '库存已更新', icon: 'success' });
      },
    });
  },
});
