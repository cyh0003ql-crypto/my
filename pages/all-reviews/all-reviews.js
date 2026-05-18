const db = require('../../utils/db');

Page({
  data: {
    productName: '',
    reviews: [],
    filteredReviews: [],
    activeFilter: 'all',
    imageReviewCount: 0,
    avgRating: '0.0',
    fullStars: [],
    hasHalfStar: false,
    emptyStars: [],
  },

  onLoad(options) {
    const productId = options.id || '';
    const productName = decodeURIComponent(options.name || '商品评价');
    wx.setNavigationBarTitle({ title: '商品评价' });

    const rawReviews = db.getProductReviews(productId);
    const reviews = rawReviews
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0))
      .map(r => ({
        ...r,
        stars: [1, 2, 3, 4, 5].map(n => n <= r.rating),
        dateStr: r.createdAt ? r.createdAt.substring(0, 10) : '',
      }));

    const imageReviewCount = reviews.filter(r => r.images && r.images.length > 0).length;

    let avgRating = '0.0';
    let fullStars = [];
    let hasHalfStar = false;
    let emptyStars = [];

    if (reviews.length > 0) {
      const total = rawReviews.reduce((s, r) => s + (r.rating || 0), 0);
      const avg = total / reviews.length;
      avgRating = avg.toFixed(1);
      const full = Math.floor(avg);
      const half = avg - full >= 0.5;
      fullStars = Array(full).fill(1);
      hasHalfStar = half;
      emptyStars = Array(5 - full - (half ? 1 : 0)).fill(1);
    }

    this.setData({
      productName, reviews, filteredReviews: reviews,
      imageReviewCount, avgRating, fullStars, hasHalfStar, emptyStars,
    });
  },

  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    const filteredReviews = filter === 'image'
      ? this.data.reviews.filter(r => r.images && r.images.length > 0)
      : this.data.reviews;
    this.setData({ activeFilter: filter, filteredReviews });
  },

  onPreviewImg(e) {
    const { src, all } = e.currentTarget.dataset;
    wx.previewImage({ current: src, urls: all });
  },

  onBack() {
    wx.navigateBack();
  },
});
