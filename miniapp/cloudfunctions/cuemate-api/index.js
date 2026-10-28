// 微信云开发（CloudBase）云函数入口：cuemate-api
// 后续在微信开发者工具中点击「云开发」开通环境并右键上传此目录即可免服务器/免备案上线
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { action, payload = {} } = event || {};
  const wxContext = cloud.getWXContext();

  if (action === 'wxLogin') {
    return {
      ok: true,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }

  if (action === 'msgSecCheck') {
    try {
      const res = await cloud.openapi.security.msgSecCheck({
        content: String(payload.text || ''),
      });
      return { ok: res.errCode === 0, detail: res };
    } catch (err) {
      return { ok: false, message: '内容未通过微信安全检测', error: String(err) };
    }
  }

  return {
    ok: true,
    action,
    openid: wxContext.OPENID,
  };
};
