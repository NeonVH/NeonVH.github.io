const CryptoJS = require("crypto-js");

module.exports = function(req, res) {
  // 1. KHÓA TỬ HUYỆT: CHỈ CHO PHÉP ĐÚNG LINK GITHUB CỦA ĐẠI CA TRUY CẬP
  res.setHeader('Access-Control-Allow-Origin', 'https://neonvh.github.io'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Xử lý cái trạm kiểm tra an ninh (Preflight) của trình duyệt Chrome
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Bốc chìa khóa Firebase từ Vercel (Nhớ điền Environment Variables)
  const firebaseConfig = {
    apiKey: process.env.FB_API_KEY,
    authDomain: process.env.FB_AUTH_DOMAIN,
    projectId: process.env.FB_PROJECT_ID,
    storageBucket: process.env.FB_STORAGE_BUCKET,
    messagingSenderId: process.env.FB_SENDER_ID,
    appId: process.env.FB_APP_ID
  };

  // 3. Mã hóa toàn bộ cấu hình bằng mật mã bí mật
  const SECRET_PASS = "NeonVH_TuyetMat_2026"; 
  const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(firebaseConfig), SECRET_PASS).toString();

  // 4. Quăng cục dữ liệu đã mã hóa về cho web
  res.status(200).json({ secureData: encryptedData });
};
