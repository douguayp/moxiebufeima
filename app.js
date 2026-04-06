const FONT_SOURCES = [
  {
    family: "Caveat Brush",
    source: 'url("https://fonts.gstatic.com/s/caveatbrush/v12/EYq0maZfwr9S9-ETZc3fKXtMWw.ttf")',
  },
];

App({
  globalData: {},

  onLaunch() {
    this.initCloud();
    this.loadCustomFonts();
  },

  initCloud() {
    if (!wx.cloud) {
      console.warn("wx.cloud is unavailable in current environment");
      return;
    }

    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true,
    });
  },

  loadCustomFonts() {
    if (!wx.loadFontFace) {
      return;
    }

    FONT_SOURCES.forEach(({ family, source }) => {
      wx.loadFontFace({
        global: true,
        family,
        source,
        fail(error) {
          console.warn(`font load failed: ${family}`, error);
        },
      });
    });
  },
});
