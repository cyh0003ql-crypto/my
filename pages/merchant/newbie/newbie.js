const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    products: [],
  },

  onLoad() {
    if (!app.globalData.isMerchant) {
      wx.navigateBack(); return;
    }
    this.loadProducts();
  },

  onShow() {
    this.loadProducts();
  },

  loadProducts() {
    const products = db.getAllNewbieProducts();
    this.setData({ products });
  },

  onToggleActive(e) {
    const { id } = e.currentTarget.dataset;
    const product = this.data.products.find(p => p.id === id);
    if (!product) return;
    db.updateNewbieProduct(id, { isActive: !product.isActive });
    this.loadProducts();
    wx.showToast({ title: product.isActive ? '已下架' : '已上架', icon: 'none' });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/merchant/newbie-form/newbie-form' });
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/merchant/newbie-form/newbie-form?id=' + id });
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
        db.deleteNewbieProduct(id);
        this.loadProducts();
        wx.showToast({ title: '已删除', icon: 'success' });
      },
    });
  },
});
