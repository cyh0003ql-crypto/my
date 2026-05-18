const db = require('../../../utils/db');
const app = getApp();

Page({
  data: {
    isEdit: false,
    editId: null,
    form: {
      name: '',
      desc: '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '',
      soldCount: '',
      images: [],
      descImages: [],
      skuGroups: [],
      isActive: true,
    },
  },

  onLoad(options) {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }

    if (options.id) {
      const list = db.getAllNewbieProducts();
      const product = list.find(p => p.id === options.id);
      if (product) {
        const images = product.images && product.images.length > 0
          ? product.images
          : (product.image ? [product.image] : []);
        const currentSoldCount = db.getSoldCount ? db.getSoldCount(options.id) : 0;
        const skuGroups = (product.skuOptions || []).map(o => ({
          name: o.name,
          valuesStr: (o.values || []).join(','),
          valsList: o.values || [],
        }));
        this.setData({
          isEdit: true,
          editId: options.id,
          form: {
            name: product.name,
            desc: product.desc || '',
            description: product.description || '',
            price: String(product.price),
            originalPrice: String(product.originalPrice || product.price),
            stock: String(product.stock),
            soldCount: String(currentSoldCount),
            images,
            descImages: product.descImages || [],
            skuGroups,
            isActive: product.isActive !== false,
          },
        });
      }
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onToggleActive() {
    this.setData({ 'form.isActive': !this.data.form.isActive });
  },

  onAddSkuGroup() {
    const groups = [...this.data.form.skuGroups, { name: '', valuesStr: '', valsList: [] }];
    this.setData({ 'form.skuGroups': groups });
  },

  onRemoveSkuGroup(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const groups = this.data.form.skuGroups.filter((_, i) => i !== idx);
    this.setData({ 'form.skuGroups': groups });
  },

  onSkuNameInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const groups = this.data.form.skuGroups.map((g, i) => i === idx ? { ...g, name: e.detail.value } : g);
    this.setData({ 'form.skuGroups': groups });
  },

  onSkuValsInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const valuesStr = e.detail.value;
    const valsList = valuesStr.split(/[,，]/).map(v => v.trim()).filter(Boolean);
    const groups = this.data.form.skuGroups.map((g, i) => i === idx ? { ...g, valuesStr, valsList } : g);
    this.setData({ 'form.skuGroups': groups });
  },

  onChooseImages() {
    const current = this.data.form.images.length;
    const remaining = 3 - current;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' }); return;
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

  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    const urls = this.data.form.images;
    if (!urls || !urls.length) return;
    wx.previewImage({ current: urls[index], urls });
  },

  onChooseDescImages() {
    const current = this.data.form.descImages.length;
    const remaining = 6 - current;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传6张详情图片', icon: 'none' }); return;
    }
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
    const { form, isEdit, editId } = this.data;
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' }); return;
    }
    const price = parseFloat(form.price);
    const originalPrice = parseFloat(form.originalPrice) || price;
    const stock = parseInt(form.stock);
    if (isNaN(price) || price <= 0) {
      wx.showToast({ title: '请输入有效的新人价', icon: 'none' }); return;
    }
    if (isNaN(stock) || stock < 0) {
      wx.showToast({ title: '请输入有效的库存', icon: 'none' }); return;
    }
    if (form.images.length === 0) {
      wx.showToast({ title: '请至少选择一张商品图片', icon: 'none' }); return;
    }

    const skuOptions = (form.skuGroups || [])
      .filter(g => g.name && g.valuesStr)
      .map(g => ({
        name: g.name.trim(),
        values: g.valuesStr.split(/[,，]/).map(v => v.trim()).filter(Boolean),
      }));
    const soldCountVal = parseInt(form.soldCount) || 0;
    const data = {
      name: form.name.trim(),
      desc: form.desc.trim(),
      description: form.description.trim(),
      price,
      originalPrice,
      stock,
      images: form.images,
      image: form.images[0],
      descImages: form.descImages,
      skuOptions,
      isActive: form.isActive,
    };

    if (isEdit) {
      db.updateNewbieProduct(editId, data);
      if (db.setSoldCount) db.setSoldCount(editId, soldCountVal);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      const newProd = db.addNewbieProduct(data);
      if (soldCountVal > 0 && db.setSoldCount && newProd) db.setSoldCount(newProd.id, soldCountVal);
      wx.showToast({ title: '已发布', icon: 'success' });
    }
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
