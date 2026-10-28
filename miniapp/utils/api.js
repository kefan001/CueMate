const { SUBSCRIBE_TEMPLATES, resolveVenueCoords } = require('../shared/cuemate-core');

const API_CONFIG = {
  baseUrl: 'http://127.0.0.1:4000',
  mode: 'local-server', // 'local-server' | 'wx-cloud'
  cloudEnv: '',
};

function request(path, method = 'GET', data = undefined) {
  if (API_CONFIG.mode === 'wx-cloud' && typeof wx !== 'undefined' && wx.cloud) {
    return wx.cloud
      .callFunction({
        name: 'cuemate-api',
        data: { action: path, payload: data },
      })
      .then(res => res.result || { ok: true })
      .catch(err => ({ ok: false, error: err }));
  }

  return new Promise(resolve => {
    if (typeof wx === 'undefined' || !wx.request) {
      resolve({ ok: false, offline: true });
      return;
    }
    wx.request({
      url: `${API_CONFIG.baseUrl}${path}`,
      method,
      data,
      timeout: 3500,
      header: {
        'Content-Type': 'application/json',
        'X-Client-Mode': API_CONFIG.mode,
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          resolve(res.data);
        } else {
          resolve(res.data || { ok: false, statusCode: res.statusCode });
        }
      },
      fail() {
        resolve({ ok: false, offline: true });
      },
    });
  });
}

function uploadMedia(filePath) {
  if (!filePath) return Promise.resolve({ ok: false, url: '' });

  if (API_CONFIG.mode === 'wx-cloud' && typeof wx !== 'undefined' && wx.cloud) {
    const ext = filePath.slice(filePath.lastIndexOf('.')) || '.jpg';
    const cloudPath = `cuemate/${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    return wx.cloud
      .uploadFile({ cloudPath, filePath })
      .then(res => ({ ok: true, url: res.fileID }))
      .catch(() => ({ ok: true, url: filePath, fallback: true }));
  }

  return new Promise(resolve => {
    if (typeof wx === 'undefined' || !wx.uploadFile) {
      resolve({ ok: true, url: filePath, fallback: true });
      return;
    }
    wx.uploadFile({
      url: `${API_CONFIG.baseUrl}/api/upload`,
      filePath,
      name: 'file',
      timeout: 5000,
      success(res) {
        try {
          const parsed = JSON.parse(res.data || '{}');
          if (parsed && parsed.ok && parsed.url) {
            resolve({ ok: true, url: parsed.url });
            return;
          }
        } catch (e) {
          // ignore parse error
        }
        resolve({ ok: true, url: filePath, fallback: true });
      },
      fail() {
        resolve({ ok: true, url: filePath, fallback: true });
      },
    });
  });
}

function requestSubscribe(scene = 'order') {
  const tmplIds = [
    SUBSCRIBE_TEMPLATES.ORDER_PAID,
    SUBSCRIBE_TEMPLATES.SERVICE_STARTED,
    SUBSCRIBE_TEMPLATES.NEW_MESSAGE,
  ];
  return new Promise(resolve => {
    if (typeof wx !== 'undefined' && wx.requestSubscribeMessage) {
      wx.requestSubscribeMessage({
        tmplIds,
        complete() {
          request('/api/subscribe/record', 'POST', { templates: tmplIds, scene });
          resolve({ ok: true });
        },
      });
    } else {
      request('/api/subscribe/record', 'POST', { templates: tmplIds, scene });
      resolve({ ok: true });
    }
  });
}

function openVenueLocation(venueName, venueAddress) {
  const coords = resolveVenueCoords(venueName, venueAddress);
  if (typeof wx !== 'undefined' && wx.openLocation) {
    wx.openLocation({
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      name: coords.name,
      address: coords.address,
      scale: 16,
    });
  }
}

module.exports = {
  API_CONFIG,
  request,
  uploadMedia,
  requestSubscribe,
  openVenueLocation,
};
