const app = getApp();

Page({
  data: {
    requests: [],
    replyingId: null,
    replyText: '',
  },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    this.loadRequests();
  },

  onShow() { this.loadRequests(); },

  loadRequests() {
    const list = wx.getStorageSync('customRequests') || [];
    const requests = list.map(r => ({
      ...r,
      createdAtFmt: this.fmtTime(r.createdAt),
      images: r.images || [],
      selectedCaseNames: r.selectedCaseNames || [],
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

  onCall(e) {
    const { phone } = e.currentTarget.dataset;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  onProcess(e) {
    const { id } = e.currentTarget.dataset;
    this.updateStatus(id, 'processing');
  },

  onDone(e) {
    const { id } = e.currentTarget.dataset;
    this.updateStatus(id, 'completed');
  },

  updateStatus(id, status) {
    const list = wx.getStorageSync('customRequests') || [];
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) { list[idx].status = status; wx.setStorageSync('customRequests', list); }
    this.loadRequests();
    wx.showToast({ title: '状态已更新', icon: 'success' });
  },

  // 回复功能
  onStartReply(e) {
    const { id, existing } = e.currentTarget.dataset;
    // If already open for this card, close it
    if (this.data.replyingId === id) {
      this.setData({ replyingId: null, replyText: '' });
      return;
    }
    this.setData({ replyingId: id, replyText: existing || '' });
  },

  onReplyInput(e) {
    this.setData({ replyText: e.detail.value });
  },

  onCancelReply() {
    this.setData({ replyingId: null, replyText: '' });
  },

  onSendReply(e) {
    const { id } = e.currentTarget.dataset;
    const { replyText } = this.data;
    if (!replyText.trim()) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' }); return;
    }
    const list = wx.getStorageSync('customRequests') || [];
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx].merchantReply = replyText.trim();
      list[idx].replyAt = new Date().toISOString();
      list[idx].replyRead = false;
      if (list[idx].status === 'pending') list[idx].status = 'processing';
      wx.setStorageSync('customRequests', list);
      // Mark as unread for the customer
      const unread = wx.getStorageSync('unreadCustomReplies') || [];
      if (!unread.includes(id)) unread.push(id);
      wx.setStorageSync('unreadCustomReplies', unread);
    }
    this.setData({ replyingId: null, replyText: '' });
    this.loadRequests();
    wx.showToast({ title: '回复已发送', icon: 'success' });
  },
});
