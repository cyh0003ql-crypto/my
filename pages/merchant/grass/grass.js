const db = require('../../../utils/db');
const app = getApp();

Page({
  data: { posts: [] },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
  },

  onShow() {
    this.loadPosts();
  },

  loadPosts() {
    this.setData({ posts: db.getAllGrassPosts() });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/merchant/grass-form/grass-form' });
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/merchant/grass-form/grass-form?id=' + id });
  },

  onToggleActive(e) {
    const { id, active } = e.currentTarget.dataset;
    db.updateGrassPost(id, { isActive: !active });
    this.loadPosts();
    wx.showToast({ title: active ? '已下线' : '已上线', icon: 'none' });
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除', content: '删除后不可恢复',
      confirmText: '删除', confirmColor: '#C87941',
      success: (res) => {
        if (res.confirm) {
          db.deleteGrassPost(id);
          this.loadPosts();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  },
});
