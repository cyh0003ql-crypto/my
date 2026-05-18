const app = getApp();

function normalizeProduct(p) {
  if (!p) return p;
  const cover = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
  return { ...p, image: cover };
}

Page({
  data: {
    orders: [],
    filterStatus: '',
    tabs: [
      { label: '全部', status: '' },
      { label: '待发货', status: 'paid' },
      { label: '已发货', status: 'shipped' },
      { label: '已完成', status: 'completed' },
    ],
    activeTab: 0,
  },

  onLoad(options) {
    if (options.status) {
      const idx = this.data.tabs.findIndex(t => t.status === options.status);
      if (idx >= 0) this.setData({ activeTab: idx, filterStatus: options.status });
    }
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  loadOrders() {
    const allOrders = app.getOrders();
    const userInfo = app.globalData.userInfo;
    const uid = userInfo ? userInfo.id : null;
    const mine = allOrders.filter(o => o.userId === uid || o.userId === 'guest');
    const { filterStatus } = this.data;
    const filtered = filterStatus ? mine.filter(o => o.status === filterStatus) : mine;
    const orders = filtered.map(order => {
      let timeStr = '';
      const raw = order.createdAt || order.paidAt || '';
      if (raw) {
        try {
          const d = new Date(raw);
          const pad = n => String(n).padStart(2, '0');
          timeStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch(e) { timeStr = raw.substring(0, 16).replace('T', ' '); }
      }
      return {
        ...order,
        products: (order.products || []).map(normalizeProduct),
        timeStr,
      };
    });
    this.setData({ orders });
  },

  onTabTap(e) {
    const { index } = e.currentTarget.dataset;
    const tab = this.data.tabs[index];
    this.setData({ activeTab: index, filterStatus: tab.status });
    this.loadOrders();
  },

  onConfirmReceive(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品？',
      confirmText: '确认收货',
      confirmColor: '#3A332D',
      success: (res) => {
        if (!res.confirm) return;
        const db = require('../../utils/db');
        db.updateOrderStatus(id, 'completed');
        this.loadOrders();
        wx.showToast({ title: '已确认收货', icon: 'success' });
      },
    });
  },

  onWriteReview(e) {
    const { id, products } = e.currentTarget.dataset;
    const reviewable = (products || [])
      .filter(p => p.id && p.name)
      .map(p => ({ id: p.id, name: p.name, image: p.image || '' }));
    if (!reviewable.length) return;
    wx.navigateTo({
      url: '/pages/review/review?orderId=' + id + '&products=' + encodeURIComponent(JSON.stringify(reviewable)),
    });
  },

  onViewTracking(e) {
    const { tracking } = e.currentTarget.dataset;
    if (!tracking) return;
    wx.showModal({
      title: '物流信息',
      content: `快递公司：${tracking.carrier || '快递'}\n物流单号：${tracking.number}\n发货时间：${tracking.shippedAt ? tracking.shippedAt.substring(0,10) : ''}`,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#3A332D',
    });
  },
});
