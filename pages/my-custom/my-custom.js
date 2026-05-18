const app = getApp();

Page({
  data: {
    requests: [],
  },

  onLoad() {
    this.loadRequests();
  },

  onShow() {
    this.loadRequests();
    this.clearUnread();
  },

  clearUnread() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) return;
    const all = wx.getStorageSync('customRequests') || [];
    const myIds = all
      .filter(r => r.userId === userInfo.id || r.userId === 'guest')
      .map(r => r.id);
    const unread = wx.getStorageSync('unreadCustomReplies') || [];
    const remaining = unread.filter(id => !myIds.includes(id));
    wx.setStorageSync('unreadCustomReplies', remaining);
  },

  loadRequests() {
    const userInfo = app.globalData.userInfo;
    const uid = userInfo ? userInfo.id : null;
    const all = wx.getStorageSync('customRequests') || [];
    const mine = uid
      ? all.filter(r => r.userId === uid || r.userId === 'guest')
      : all.filter(r => r.userId === 'guest');

    const requests = mine.map(r => ({
      ...r,
      images: r.images || [],
      selectedCaseNames: r.selectedCaseNames || [],
      createdAtFmt: this.fmtTime(r.createdAt),
      replyAt: r.replyAt ? this.fmtTime(r.replyAt) : '',
    }));
    this.setData({ requests });
  },

  fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  onPreview(e) {
    const { src, list } = e.currentTarget.dataset;
    wx.previewImage({ current: src, urls: list });
  },

  onGoCustom() {
    wx.switchTab({ url: '/pages/custom/custom' });
  },
});
