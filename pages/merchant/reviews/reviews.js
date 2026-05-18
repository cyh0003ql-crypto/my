const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    productList: [],
    selectedProduct: '',
    selectedProductName: '',
    selectedProductSkuOptions: [],
    reviews: [],
    showAddModal: false,
    newRating: 5,
    newSkuSelected: {},
  },

  _newUsername: '',
  _newContent: '',

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
  },

  onShow() {
    this.loadProducts();
  },

  loadProducts() {
    const allReviews = db.getAllReviews();
    const regular = db.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      reviewCount: (allReviews[p.id] || []).length,
      isNewbie: false,
    }));
    const newbie = db.getAllNewbieProducts().map(p => ({
      id: p.id,
      name: p.name + ' 🎁',
      reviewCount: (allReviews[p.id] || []).length,
      isNewbie: true,
    }));
    const productList = [...regular, ...newbie];
    this.setData({ productList });
    if (this.data.selectedProduct) {
      this.loadReviews(this.data.selectedProduct);
    }
  },

  onSelectProduct(e) {
    const id = e.currentTarget.dataset.id;
    let prod = db.getProductById(id);
    if (!prod) {
      const newbieList = db.getAllNewbieProducts();
      prod = newbieList.find(p => p.id === id);
    }
    const selectedProductSkuOptions = (prod && prod.skuOptions) || [];
    const selectedProductName = prod ? prod.name : '';
    this.setData({ selectedProduct: id, selectedProductName, selectedProductSkuOptions, newSkuSelected: {} });
    this.loadReviews(id);
  },

  onBackToList() {
    this.setData({ selectedProduct: '', selectedProductName: '' });
  },

  loadReviews(productId) {
    const reviews = db.getProductReviews(productId);
    this.setData({ reviews });
  },

  onToggleHighlight(e) {
    const { index } = e.currentTarget.dataset;
    const reviews = this.data.reviews.map((r, i) =>
      i === index ? { ...r, isHighlight: !r.isHighlight } : r
    );
    db.updateProductReviews(this.data.selectedProduct, reviews);
    this.setData({ reviews });
    wx.showToast({ title: reviews[index].isHighlight ? '已设为精选' : '已取消精选', icon: 'none' });
  },

  onDelete(e) {
    const { index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除', content: '删除后不可恢复',
      confirmText: '删除', confirmColor: '#C87941',
      success: (res) => {
        if (res.confirm) {
          const reviews = this.data.reviews.filter((_, i) => i !== index);
          db.updateProductReviews(this.data.selectedProduct, reviews);
          this.setData({ reviews });
          this.loadProducts();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  },

  onAddReview() {
    this._newUsername = '';
    this._newContent = '';
    this.setData({ showAddModal: true, newRating: 5, newSkuSelected: {} });
  },

  onCloseModal() {
    this.setData({ showAddModal: false, newSkuSelected: {} });
  },

  onNewUsernameInput(e) { this._newUsername = e.detail.value; },
  onNewContentInput(e) { this._newContent = e.detail.value; },
  onNewStarTap(e) { this.setData({ newRating: e.currentTarget.dataset.val }); },

  onNewSkuSelect(e) {
    const { group, val } = e.currentTarget.dataset;
    const newSkuSelected = { ...this.data.newSkuSelected };
    if (newSkuSelected[group] === val) {
      delete newSkuSelected[group];
    } else {
      newSkuSelected[group] = val;
    }
    this.setData({ newSkuSelected });
  },

  onSaveReview() {
    const content = (this._newContent || '').trim();
    if (!content) { wx.showToast({ title: '请填写评价内容', icon: 'none' }); return; }

    const skuEntries = Object.entries(this.data.newSkuSelected);
    const sku = skuEntries.length > 0
      ? skuEntries.map(([k, v]) => `${k}:${v}`).join(' ')
      : '';

    const review = {
      username: (this._newUsername || '').trim() || '优质买家',
      avatar: '🌟',
      rating: this.data.newRating,
      content,
      sku,
      isMerchantAdded: true,
    };
    db.addMerchantReview(this.data.selectedProduct, review);
    this.setData({ showAddModal: false, newSkuSelected: {} });
    this.loadReviews(this.data.selectedProduct);
    this.loadProducts();
    wx.showToast({ title: '添加成功', icon: 'success' });
  },
});
