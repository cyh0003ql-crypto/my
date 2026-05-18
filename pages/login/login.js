const auth = require('../../utils/auth');

Page({
  data: {
    phone: '',
    password: '',
    isLoading: false,
    showPassword: false,
  },

  onLoad() {},

  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  onTogglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onSubmit() {
    const { phone, password } = this.data;
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return;
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' }); return;
    }
    this.setData({ isLoading: true });

    setTimeout(() => {
      const userId = 'user_' + phone;
      const isNewUser = !wx.getStorageSync('registered_' + userId);
      const userInfo = {
        id: userId,
        name: '用户' + phone.slice(-4),
        phone,
        avatar: '',
        isMerchant: false,
      };
      auth.login(userInfo);
      if (isNewUser) {
        wx.setStorageSync('registered_' + userId, true);
      }
      this.setData({ isLoading: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) wx.navigateBack();
        else wx.switchTab({ url: '/pages/profile/profile' });
        if (isNewUser) {
          setTimeout(() => this._showNewbieCouponPopup(), 600);
        }
      }, 1000);
    }, 800);
  },

  onWxLogin() {
    wx.showLoading({ title: '登录中...' });
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const wxInfo = res.userInfo;
        const userInfo = {
          id: 'wx_' + Date.now(),
          name: wxInfo.nickName || '微信用户',
          avatar: wxInfo.avatarUrl || '',
          phone: '',
          isMerchant: false,
        };
        const isNewUser = !wx.getStorageSync('registered_' + userInfo.id);
        auth.login(userInfo);
        if (isNewUser) {
          wx.setStorageSync('registered_' + userInfo.id, true);
        }
        wx.hideLoading();
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) wx.navigateBack();
          else wx.switchTab({ url: '/pages/profile/profile' });
          if (isNewUser) {
            setTimeout(() => this._showNewbieCouponPopup(), 600);
          }
        }, 1000);
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '取消登录', icon: 'none' });
      },
    });
  },

  _showNewbieCouponPopup() {
    const publicPool = wx.getStorageSync('publicCoupons') || [];
    const now = new Date();
    const newbieCoupons = publicPool.filter(c =>
      c.isNewbie && c.status === 'active' && new Date(c.expiresAt) >= now &&
      (c.claimedCount || 0) < c.totalCount
    );
    if (newbieCoupons.length === 0) return;

    const userCoupons = wx.getStorageSync('userCoupons') || [];
    const claimedIds = userCoupons.map(c => c.sourceId || c.id);
    const unclaimed = newbieCoupons.filter(c => !claimedIds.includes(c.id));
    if (unclaimed.length === 0) return;

    const names = unclaimed.map(c => {
      return c.type === 'fixed'
        ? '「' + c.title + '」满' + c.minAmount + '减¥' + c.discount
        : '「' + c.title + '」' + c.discount + '折优惠';
    }).join('\n');

    wx.showModal({
      title: '🎁 新人专属礼包',
      content: '恭喜您成为新会员！以下优惠券已为您准备好：\n\n' + names + '\n\n点击「立即领取」可一键收入囊中',
      confirmText: '立即领取',
      cancelText: '稍后再说',
      confirmColor: '#C87941',
      success: (res) => {
        if (!res.confirm) return;
        const latestUserCoupons = wx.getStorageSync('userCoupons') || [];
        const latestClaimedIds = latestUserCoupons.map(c => c.sourceId || c.id);
        const latestPool = wx.getStorageSync('publicCoupons') || [];
        let claimedAny = false;

        unclaimed.forEach(c => {
          if (latestClaimedIds.includes(c.id)) return;
          latestUserCoupons.unshift({
            id: 'ucpn_' + Date.now() + '_' + c.id,
            sourceId: c.id,
            title: c.title,
            type: c.type,
            discount: c.discount,
            minAmount: c.minAmount,
            expiresAt: c.expiresAt,
            status: 'unused',
            tag: c.tag || (c.type === 'fixed' ? '满减' : '折扣'),
          });
          claimedAny = true;
        });

        if (claimedAny) {
          wx.setStorageSync('userCoupons', latestUserCoupons);
          const updatedPool = latestPool.map(c => {
            const found = unclaimed.find(u => u.id === c.id);
            return found ? { ...c, claimedCount: (c.claimedCount || 0) + 1 } : c;
          });
          wx.setStorageSync('publicCoupons', updatedPool);
          const merchantCoupons = (wx.getStorageSync('merchantCoupons') || []).map(c => {
            const found = unclaimed.find(u => u.id === c.id);
            return found ? { ...c, claimedCount: (c.claimedCount || 0) + 1 } : c;
          });
          wx.setStorageSync('merchantCoupons', merchantCoupons);
          wx.showToast({ title: '优惠券已放入钱包！', icon: 'success' });
        }
      },
    });
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },
});
