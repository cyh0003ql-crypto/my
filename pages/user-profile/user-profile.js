const app = getApp();
const auth = require('../../utils/auth');

Page({
  data: {
    name: '',
    phone: '',
    bio: '',
    avatar: '',
    isSaving: false,
  },

  onLoad() {
    const { userInfo } = app.globalData;
    if (userInfo) {
      this.setData({
        name: userInfo.name || '',
        phone: userInfo.phone || '',
        bio: userInfo.bio || '',
        avatar: userInfo.avatar || '',
      });
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onBioInput(e) { this.setData({ bio: e.detail.value }); },

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatar = res.tempFiles[0].tempFilePath;
        this.setData({ avatar });
        wx.showToast({ title: '头像已选择', icon: 'success' });
      },
    });
  },

  onSave() {
    const { name, phone, bio, avatar } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' }); return;
    }
    this.setData({ isSaving: true });
    setTimeout(() => {
      const userInfo = {
        ...app.globalData.userInfo,
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar,
      };
      auth.login(userInfo);
      this.setData({ isSaving: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1200);
    }, 500);
  },
});
