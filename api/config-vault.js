const crypto = require('./crypto');

async function getVault(res, isAuthorized) {
    if (!isAuthorized) {
        return res.status(403).json({ error: "Access Denied to Vault" });
    }

    const config = {
        apiKey: process.env.FB_API_KEY,
        projectId: process.env.FB_PROJECT_ID,
        // ... các thông tin khác từ file .env
    };

    // Mã hóa 2 lớp: AES + Base64 Obfuscation
    const layer1 = crypto.encrypt(JSON.stringify(config));
    return res.status(200).json({ payload: layer1 });
}

module.exports = { getVault };
