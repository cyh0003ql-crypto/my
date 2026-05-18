const app = getApp();

Component({
  data: {
    selected: 0,
    cartCount: 0,
    list: [
      {
        text: '首页',
        pagePath: '/pages/index/index',
        iconPath: '/images/tab-home.png',
        selectedIconPath: '/images/tab-home-active.png',
      },
      {
        text: '分类',
        pagePath: '/pages/category/category',
        iconPath: '/images/tab-category.png',
        selectedIconPath: '/images/tab-category-active.png',
      },
      {
        text: '定制',
        pagePath: '/pages/custom/custom',
        special: true,
      },
      {
        text: '购物车',
        pagePath: '/pages/cart/cart',
        iconPath: '/images/tab-cart.png',
        selectedIconPath: '/images/tab-cart-active.png',
      },
      {
        text: '我的',
        pagePath: '/pages/profile/profile',
        iconPath: '/images/tab-profile.png',
        selectedIconPath: '/images/tab-profile-active.png',
      },
    ],
  },

  attached() {
    const count = (app.globalData && app.globalData.cartCount) || 0;
    this.setData({ cartCount: count });
  },

  methods: {
    switchTab(e) {
      const { index } = e.currentTarget.dataset;
      const item = this.data.list[index];
      wx.switchTab({ url: item.pagePath });
    },
  },
});
