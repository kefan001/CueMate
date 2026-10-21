function readJson(key, fallback) {
  try {
    const raw = wx.getStorageSync(key);
    if (!raw) return fallback;
    if (typeof raw === 'string') {
      return JSON.parse(raw);
    }
    return raw;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    wx.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    // ignore storage errors
  }
}

module.exports = {
  readJson,
  writeJson,
};
