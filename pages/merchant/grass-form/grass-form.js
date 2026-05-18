const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    isEdit: false,
    editId: '',
    imgPreview: '',
    initUsername: '',
    initTitle: '',
    initContent: '',
    initTags: '',
    initProductId: '',
    initLikeCount: '',
    linkedProductName: '',
    showProductPicker: false,
    allProducts: [],
  },

  _username: '',
  _title: '',
  _content: '',
  _tags: '',
  _productId: '',
  _image: '',
  _likeCount: 0,

  onLoad(options) {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    const allProducts = db.getAllProductsForPicker();
    this.setData({ allProducts });
    if (options.id) {
      const posts = db.getAllGrassPosts();
      const post = posts.find(p => p.id === options.id);
      if (post) {
        this._username = post.username || '';
        this._title = post.title || '';
        this._content = post.content || '';
        this._tags = (post.tags || []).join(',');
        this._productId = post.linkedProductId || '';
        this._image = post.image || '';
        let linkedProductName = '';
        if (post.linkedProductId) {
          const prod = allProducts.find(p => p.id === post.linkedProductId);
          linkedProductName = prod ? prod.name : post.linkedProductId;
        }
        const currentLikeCount = db.getGrassLikeCount(options.id);
        this._likeCount = currentLikeCount;
        this.setData({
          isEdit: true,
          editId: options.id,
          imgPreview: post.image || '',
          initUsername: post.username || '',
          initTitle: post.title || '',
          initContent: post.content || '',
          initTags: (post.tags || []).join(','),
          initProductId: post.linkedProductId || '',
          initLikeCount: String(currentLikeCount),
          linkedProductName,
        });
      }
    }
  },

  onUsernameInput(e) { this._username = e.detail.value; },
  onTitleInput(e) { this._title = e.detail.value; },
  onContentInput(e) { this._content = e.detail.value; },
  onTagsInput(e) { this._tags = e.detail.value; },
  onLikeCountInput(e) { this._likeCount = parseInt(e.detail.value) || 0; },

  onOpenProductPicker() {
    this.setData({ showProductPicker: true });
  },

  onCloseProductPicker() {
    this.setData({ showProductPicker: false });
  },

  onSelectProduct(e) {
    const { id, name } = e.currentTarget.dataset;
    this._productId = id;
    this.setData({
      initProductId: id,
      linkedProductName: name,
      showProductPicker: false,
    });
  },

  onClearProduct() {
    this._productId = '';
    this.setData({ initProductId: '', linkedProductName: '' });
  },

  preventBubble() {},

  onPickImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => {
        const f = res.tempFiles[0];
        this._image = f.tempFilePath;
        this.setData({ imgPreview: f.tempFilePath });
      },
    });
  },

  onSave() {
    const username = (this._username || this.data.initUsername || '').trim();
    const title = (this._title || this.data.initTitle || '').trim();
    const content = (this._content || this.data.initContent || '').trim();
    if (!title || !content) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' }); return;
    }
    const image = this._image || this.data.imgPreview || '/images/products/p001.png';
    const tagsRaw = this._tags || this.data.initTags || '';
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const linkedProductId = (this._productId || this.data.initProductId || '').trim();
    const uname = username ? (username.startsWith('@') ? username : '@' + username) : '@匿名用户';

    const post = { username: uname, title, content, image, tags, linkedProductId, avatar: '📸', isActive: true };

    const likeCount = parseInt(this._likeCount) || 0;
    if (this.data.isEdit) {
      db.updateGrassPost(this.data.editId, post);
      db.setGrassLikeCount(this.data.editId, likeCount);
      wx.showToast({ title: '更新成功', icon: 'success' });
    } else {
      const newPost = db.addGrassPost(post);
      if (likeCount > 0) db.setGrassLikeCount(newPost.id, likeCount);
      wx.showToast({ title: '发布成功', icon: 'success' });
    }
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
