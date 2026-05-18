const app = getApp();

Page({
  data: {
    addresses: [],
    showForm: false,
    editingId: null,
    form: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false },
  },

  onShow() {
    this.setData({ addresses: app.getAddresses() });
  },

  onAdd() {
    this.setData({
      showForm: true, editingId: null,
      form: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false },
    });
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    const addr = this.data.addresses.find(a => a.id === id);
    if (!addr) return;
    this.setData({ showForm: true, editingId: id, form: { ...addr } });
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除地址', content: '确认删除该地址？', confirmText: '删除', confirmColor: '#3A332D',
      success: (res) => {
        if (!res.confirm) return;
        const addrs = app.getAddresses().filter(a => a.id !== id);
        app.saveAddresses(addrs);
        this.setData({ addresses: addrs });
      },
    });
  },

  onSetDefault(e) {
    const { id } = e.currentTarget.dataset;
    const addrs = app.getAddresses().map(a => ({ ...a, isDefault: a.id === id }));
    app.saveAddresses(addrs);
    wx.setStorageSync('defaultAddress', addrs.find(a => a.id === id));
    this.setData({ addresses: addrs });
    wx.showToast({ title: '已设为默认', icon: 'success' });
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onToggleDefault() {
    this.setData({ 'form.isDefault': !this.data.form.isDefault });
  },

  onSave() {
    const { form, editingId } = this.data;
    if (!form.name || !form.phone || !form.province || !form.city || !form.detail) {
      wx.showToast({ title: '请填写完整地址', icon: 'none' }); return;
    }
    let addrs = app.getAddresses();
    if (editingId) {
      addrs = addrs.map(a => a.id === editingId ? { ...form, id: editingId } : a);
    } else {
      addrs.push({ ...form, id: 'addr_' + Date.now() });
    }
    if (form.isDefault) {
      addrs = addrs.map(a => ({ ...a, isDefault: a.id === (editingId || addrs[addrs.length - 1].id) }));
      wx.setStorageSync('defaultAddress', addrs.find(a => a.isDefault));
    }
    app.saveAddresses(addrs);
    this.setData({ addresses: addrs, showForm: false });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  onCancel() {
    this.setData({ showForm: false });
  },
});
