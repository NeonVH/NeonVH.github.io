// File: api/auth.js (BACKEND XỬ LÝ AUTH BẰNG TOKEN)
const crypto = require('crypto');

// Băm pass ra mã Hex để không ai đọc được Pass thật
const hashPassword = (str) => crypto.createHash('sha256').update(str).digest('hex');
// Tạo Token giả lập bảo mật
const generateToken = (user, role) => Buffer.from(`${user}:${role}:${Date.now()}`).toString('base64');

const ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // Băm của Admin+Admin123

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://neonvh.github.io');
    
    // Rào chắn LỖI TRUNG & NHẸ: Ép kiểu dữ liệu (Validate Input)
    if (req.method !== 'POST') return res.status(405).json({ error: "Only POST allowed" });
    
    const { u, p, action } = req.body;
    if (!u || !p || u.length > 50 || p.length > 50) return res.status(400).json({ error: "Dữ liệu không hợp lệ" });

    // Xử lý Admin (KHÔNG BAO GIỜ TRẢ CHỮ 'admin' TRẦN TRỤI)
    const secureHash = hashPassword(u + p);
    if (secureHash === ADMIN_HASH) {
        const token = generateToken("Admin", "admin_supreme");
        return res.status(200).json({ success: true, token: token, roleHash: "adm_x99" });
    }

    // Nếu là User thường -> Trả về pass đã mã hóa để Frontend lưu lên Firebase (Pass ko bị trần)
    if (action === 'register') {
        return res.status(200).json({ success: true, hashedPass: hashPassword(p) });
    } else if (action === 'login') {
        const token = generateToken(u, "user");
        return res.status(200).json({ success: true, token: token, hashedPass: hashPassword(p) });
    }
}
