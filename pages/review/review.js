const db = require('../../utils/db');
const app = getApp();

Page({
  data: {
    orderId: '',
    products: [],
    reviews: [],
    ratingLabels: ['非常差', '较差', '一般', '满意', '非常满意'],
  },

  onLoad(options) {
    const orderId = options.orderId || '';
    let products = [];
    try {
      products = JSON.parse(decodeURIComponent(options.products || '[]'));
    } catch (e) {
      const productId = options.productId || '';
      const productName = decodeURIComponent(options.productName || '商品');
      products = [{ id: productId, name: productName, image: '' }];
    }
    const reviews = products.map(() => ({ rating: 0, content: '', images: [] }));
    this.setData({ orderId, products, reviews });
  },

  onStarTap(e) {
    const { idx, val } = e.currentTarget.dataset;
    const key = 'reviews[' + idx + '].rating';
    this.setData({ [key]: val });
  },

  onContentInput(e) {
    const { idx } = e.currentTarget.dataset;
    const key = 'reviews[' + idx + '].content';
    this.setData({ [key]: e.detail.value });
  },

  onChooseReviewImages(e) {
    const { idx } = e.currentTarget.dataset;
    const current = this.data.reviews[idx].images.length;
    const remaining = 4 - current;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传4张图片', icon: 'none' }); return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath);
        const key = 'reviews[' + idx + '].images';
        const images = [...this.data.reviews[idx].images, ...newPaths];
        this.setData({ [key]: images });
      },
    });
  },

  onDeleteReviewImage(e) {
    const { pidx, iidx } = e.currentTarget.dataset;
    const images = [...this.data.reviews[pidx].images];
    images.splice(iidx, 1);
    const key = 'reviews[' + pidx + '].images';
    this.setData({ [key]: images });
  },

  onPreviewReviewImage(e) {
    const { pidx, iidx } = e.currentTarget.dataset;
    const urls = this.data.reviews[pidx].images;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: urls[iidx], urls });
  },

  onSubmit() {
    const { orderId, products, reviews } = this.data;
    for (let i = 0; i < products.length; i++) {
      if (!reviews[i].rating) {
        wx.showToast({ title: '请为「' + products[i].name + '」选择评分', icon: 'none' }); return;
      }
      if (!(reviews[i].content || '').trim()) {
        wx.showToast({ title: '请为「' + products[i].name + '」填写评价', icon: 'none' }); return;
      }
    }
    const userInfo = app.globalData.userInfo;
    products.forEach((prod, i) => {
      const review = {
        username: (userInfo && userInfo.name) ? userInfo.name : '买家',
        avatar: '🙂',
        rating: reviews[i].rating,
        content: reviews[i].content.trim(),
        images: reviews[i].images || [],
        isHighlight: false,
        createdAt: new Date().toISOString(),
      };
      db.addReview(prod.id, review);
    });

    const orders = app.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].reviewed = true;
      app.saveOrders(orders);
    }

    wx.showToast({ title: '评价成功，感谢您的反馈！', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1500);
  },
});
