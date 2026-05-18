const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    isEdit: false,
    productId: null,
    categories: [],
    categoryNames: [],
    showNewCatPanel: false,
    form: {
      name: '', price: '', originalPrice: '', stock: '',
      soldCount: '',
      category: 'sculpture', categoryName: '艺术雕塑',
      images: [],
      descImages: [],
      skuGroups: [],
      skuValueImages: {},
      description: '', designer: '',
      material: '', size: '', weight: '',
      isNew: true, isFeatured: false,
    },
  },

  _newCatName: '',

  onLoad(options) {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    const baseCats = db.getAllCategories().filter(c => c.id !== 'all');
    const categoryNames = [...baseCats.map(c => c.name), '＋ 新增品类'];
    this.setData({ categories: baseCats, categoryNames });
    if (options.id) {
      const product = db.getProductById(options.id);
      if (product) {
        const images = (product.images && product.images.length > 0)
          ? product.images
          : (product.image ? [product.image] : []);
        const currentSoldCount = db.getSoldCount(options.id);
        const skuGroups = (product.skuOptions || []).map(o => ({
          name: o.name,
          valuesStr: (o.values || []).join(','),
          valsList: o.values || [],
        }));
        const skuValueImages = product.skuValueImages || {};
        this.setData({
          isEdit: true,
          productId: options.id,
          form: {
            name: product.name,
            price: String(product.price),
            originalPrice: String(product.originalPrice || product.price),
            stock: String(product.stock),
            soldCount: String(currentSoldCount),
            category: product.category,
            categoryName: product.categoryName,
            images,
            descImages: product.descImages || [],
            skuGroups,
            skuValueImages,
            description: product.description,
            designer: product.designer,
            material: product.material,
            size: product.size,
            weight: product.weight,
            isNew: product.isNew,
            isFeatured: product.isFeatured,
          },
        });
      }
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCategoryChange(e) {
    const idx = parseInt(e.detail.value);
    const cats = db.getAllCategories().filter(c => c.id !== 'all');
    if (idx === cats.length) {
      this.setData({ showNewCatPanel: true });
      return;
    }
    const cat = cats[idx];
    this.setData({ 'form.category': cat.id, 'form.categoryName': cat.name });
  },

  onNewCatInput(e) { this._newCatName = e.detail.value; },

  onConfirmNewCat() {
    const name = (this._newCatName || '').trim();
    if (!name) { wx.showToast({ title: '请输入品类名称', icon: 'none' }); return; }
    const id = 'cat_' + Date.now();
    db.addCustomCategory({ id, name, icon: '📦' });
    const cats = db.getAllCategories().filter(c => c.id !== 'all');
    const categoryNames = [...cats.map(c => c.name), '＋ 新增品类'];
    this.setData({
      categories: cats,
      categoryNames,
      'form.category': id,
      'form.categoryName': name,
      showNewCatPanel: false,
    });
    this._newCatName = '';
  },

  onCancelNewCat() {
    this.setData({ showNewCatPanel: false });
    this._newCatName = '';
  },

  onAddSkuGroup() {
    const groups = [...this.data.form.skuGroups, { name: '', valuesStr: '', valsList: [] }];
    this.setData({ 'form.skuGroups': groups });
  },

  onRemoveSkuGroup(e) {
    const idx = e.currentTarget.dataset.idx;
    const groups = this.data.form.skuGroups.filter((_, i) => i !== idx);
    this.setData({ 'form.skuGroups': groups });
  },

  onSkuNameInput(e) {
    const idx = e.currentTarget.dataset.idx;
    const groups = this.data.form.skuGroups.map((g, i) => i === idx ? { ...g, name: e.detail.value } : g);
    this.setData({ 'form.skuGroups': groups });
  },

  onSkuValsInput(e) {
    const idx = e.currentTarget.dataset.idx;
    const valuesStr = e.detail.value;
    const valsList = valuesStr.split(/[,，]/).map(v => v.trim()).filter(Boolean);
    const groups = this.data.form.skuGroups.map((g, i) => i === idx ? { ...g, valuesStr, valsList } : g);
    this.setData({ 'form.skuGroups': groups });
  },

  onSkuValueImageUpload(e) {
    const { group, val } = e.currentTarget.dataset;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        const key = group + ':' + val;
        const skuValueImages = Object.assign({}, this.data.form.skuValueImages);
        skuValueImages[key] = path;
        const images = this.data.form.images;
        if (!images.includes(path)) {
          this.setData({ 'form.images': [...images, path], 'form.skuValueImages': skuValueImages });
        } else {
          this.setData({ 'form.skuValueImages': skuValueImages });
        }
      },
    });
  },

  onRemoveSkuValueImage(e) {
    const { group, val } = e.currentTarget.dataset;
    const key = group + ':' + val;
    const skuValueImages = Object.assign({}, this.data.form.skuValueImages);
    delete skuValueImages[key];
    this.setData({ 'form.skuValueImages': skuValueImages });
  },

  onToggle(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: !this.data.form[field] });
  },

  // 多图选择（最多9张）
  onChooseImages() {
    const current = this.data.form.images.length;
    const remaining = 9 - current;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath);
        const images = [...this.data.form.images, ...newPaths];
        this.setData({ 'form.images': images });
      },
    });
  },

  // 删除单张图片
  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  // 预览图片
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    const urls = this.data.form.images;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: urls[index], urls });
  },

  // 描述图片选择
  onChooseDescImages() {
    const current = this.data.form.descImages.length;
    const remaining = 6 - current;
    if (remaining <= 0) { wx.showToast({ title: '最多上传6张', icon: 'none' }); return; }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath);
        const descImages = [...this.data.form.descImages, ...newPaths];
        this.setData({ 'form.descImages': descImages });
      },
    });
  },

  onDeleteDescImage(e) {
    const { index } = e.currentTarget.dataset;
    const descImages = [...this.data.form.descImages];
    descImages.splice(index, 1);
    this.setData({ 'form.descImages': descImages });
  },

  onPreviewDescImage(e) {
    const { index } = e.currentTarget.dataset;
    const urls = this.data.form.descImages;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: urls[index], urls });
  },

  onSave() {
    const { form, isEdit, productId } = this.data;
    if (!form.name || !form.price || !form.stock) {
      wx.showToast({ title: '请填写商品名称、价格和库存', icon: 'none' }); return;
    }
    if (form.images.length === 0) {
      wx.showToast({ title: '请至少上传一张商品图片', icon: 'none' }); return;
    }
    const skuOptions = (form.skuGroups || [])
      .filter(g => g.name && g.valuesStr)
      .map(g => ({
        name: g.name.trim(),
        values: g.valuesStr.split(/[,，]/).map(v => v.trim()).filter(Boolean),
      }));
    const product = {
      ...form,
      price: parseFloat(form.price) || 0,
      originalPrice: parseFloat(form.originalPrice) || parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      images: form.images,
      image: form.images[0] || '',
      descImages: form.descImages || [],
      skuOptions,
      skuValueImages: form.skuValueImages || {},
    };
    const soldCountVal = parseInt(form.soldCount) || 0;
    if (isEdit) {
      db.updateProduct(productId, product);
      db.setSoldCount(productId, soldCountVal);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      const newProduct = db.addProduct(product);
      if (soldCountVal > 0) db.setSoldCount(newProduct.id, soldCountVal);
      wx.showToast({ title: '已添加', icon: 'success' });
    }
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
