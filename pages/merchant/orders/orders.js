const db = require('../../../utils/db');
const app = getApp();

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
    showTrackingModal: false,
    shippingOrderId: null,
  },

  onLoad() {
    if (!app.globalData.isMerchant) { wx.navigateBack(); return; }
    this.loadOrders();
  },

  onShow() { this.loadOrders(); },

  loadOrders() {
    const allOrders = db.getAllOrders();
    const { filterStatus } = this.data;
    const filtered = filterStatus ? allOrders.filter(o => o.status === filterStatus) : allOrders;
    const pad = n => String(n).padStart(2, '0');
    const orders = filtered.map(order => {
      let timeStr = '';
      const raw = order.createdAt || order.paidAt || '';
      if (raw) {
        try {
          const d = new Date(raw);
          timeStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch(e) { timeStr = raw.substring(0, 16); }
      }
      return { ...order, timeStr };
    });
    this.setData({ orders });
  },

  onTabTap(e) {
    const { index } = e.currentTarget.dataset;
    const tab = this.data.tabs[index];
    this.setData({ activeTab: index, filterStatus: tab.status });
    this.loadOrders();
  },

  onShip(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/merchant/ship-form/ship-form?id=' + id });
  },

  onComplete(e) {
    const { id } = e.currentTarget.dataset;
    db.updateOrderStatus(id, 'completed');
    this.loadOrders();
    wx.showToast({ title: '订单已完成', icon: 'success' });
  },

  onCancel(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消订单', content: '确认取消此订单？', confirmText: '取消订单', confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        db.updateOrderStatus(id, 'cancelled');
        this.loadOrders();
      },
    });
  },
});
