const FONT_SOURCES = [
  {
    family: "Caveat Brush",
    source: 'url("https://fonts.gstatic.com/s/caveatbrush/v12/EYq0maZfwr9S9-ETZc3fKXtMWw.ttf")',
  },
];

App({
  globalData: {},

  onLaunch() {
    this.loadCustomFonts();
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
