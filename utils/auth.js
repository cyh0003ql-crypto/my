const app = getApp();

function requireLogin(callback) {
  if (app.globalData.isLoggedIn) {
    callback && callback();
    return;
  }
  wx.navigateTo({ url: '/pages/login/login' });
}

function requireMerchant(callback) {
  if (app.globalData.isMerchant) {
    callback && callback();
    return;
  }
  wx.showToast({ title: '需要商家权限', icon: 'none' });
  setTimeout(() => {
    wx.navigateTo({ url: '/pages/merchant/index/index' });
  }, 500);
}

function logout() {
  app.globalData.userInfo = null;
  app.globalData.isLoggedIn = false;
  app.globalData.isMerchant = false;
  wx.removeStorageSync('userInfo');
}

function login(userInfo) {
  app.globalData.userInfo = userInfo;
  app.globalData.isLoggedIn = true;
  app.globalData.isMerchant = userInfo.isMerchant || false;
  wx.setStorageSync('userInfo', userInfo);
}

module.exports = { requireLogin, requireMerchant, logout, login };
