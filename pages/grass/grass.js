const db = require('../../utils/db');

Page({
  data: { post: null, linkedProduct: null, soldCount: 0, likeCount: 0, isLiked: false, statusBarHeight: 20 },

  onLoad(options) {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = info.statusBarHeight || 20;

    const id = options.id;
    const posts = db.getAllGrassPosts();
    const post = posts.find(p => p.id === id) || null;
    if (!post) { this.setData({ post: null, statusBarHeight }); return; }

    let linkedProduct = null;
    let soldCount = 0;
    if (post.linkedProductId) {
      const raw = db.getProductById(post.linkedProductId);
      if (raw) {
        const cover = (raw.images && raw.images.length > 0) ? raw.images[0] : (raw.image || '');
        linkedProduct = { ...raw, image: cover };
        soldCount = db.getSoldCount(post.linkedProductId);
      }
    }
    const likeCount = db.getGrassLikeCount(id);
    const isLiked = db.isGrassLiked(id);
    this.setData({ post, linkedProduct, soldCount, likeCount, isLiked, statusBarHeight });
  },

  onToggleLike() {
    const { post } = this.data;
    if (!post) return;
    const nowLiked = db.toggleGrassLike(post.id);
    const likeCount = db.getGrassLikeCount(post.id);
    this.setData({ isLiked: nowLiked, likeCount });
  },

  onBack() { wx.navigateBack(); },

  onGoProduct() {
    const { linkedProduct } = this.data;
    if (linkedProduct) {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + linkedProduct.id });
    }
  },
});
