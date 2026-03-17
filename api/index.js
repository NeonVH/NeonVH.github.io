/**
 * CORE SECURITY INDEX - NEONVH ECOSYSTEM
 * Version: 2.0.4 - Max Security Mode
 * Developer: NeonVH Core Team
 */

const security = require('./security');
const config = require('./config');
const auth = require('./auth');
const logger = require('./logger'); // File log mới
const crypto = require('./crypto');

export default async function handler(req, res) {
    const startTime = Date.now();
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. THIẾT LẬP HEADER BẢO MẬT TUYỆT ĐỐI
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    try {
        // 2. LỚP BẢO VỆ SỐ 1: CHỐNG DDOS & RATE LIMIT
        const rateCheck = await security.isRateLimited(clientIP);
        if (rateCheck) {
            await logger.logIncident('DDOS_ATTEMPT', clientIP, req.headers);
            return res.status(429).json({ 
                code: "ERR_TOO_MANY_REQUESTS",
                msg: "Hệ thống phát hiện hành vi spam. IP của bạn đã bị đưa vào danh sách theo dõi." 
            });
        }

        // 3. LỚP BẢO VỆ SỐ 2: KIỂM TRA TÍNH TOÀN VẸN CỦA HEADER (ANTI-BOT)
        const headerIntegrity = security.verifyHeaders(req.headers);
        if (!headerIntegrity.valid) {
            await logger.logIncident('INVALID_HEADERS', clientIP, headerIntegrity.reason);
            return res.status(403).json({ error: "Access Denied: Protocol Violation." });
        }

        // 4. LỚP BẢO VỆ SỐ 3: KIỂM TRA MẬT MÃ HỆ THỐNG (SYSTEM SECRET)
        const systemSecret = req.headers['x-neon-secret'];
        if (!systemSecret || systemSecret !== process.env.SYSTEM_SECRET) {
            await logger.logIncident('SECRET_MISMATCH', clientIP);
            return res.status(401).json({ error: "Unauthorized: Invalid System Key." });
        }

        // 5. PHÂN LUỒNG XỬ LÝ
        const { type } = req.query;

        switch (type) {
            case 'get_gate':
                // Trả về Config Firebase đã được mã hóa AES-256 + IV
                return await config.fetchSecureConfig(req, res);

            case 'admin_verify':
                // Xác thực quyền Boss thông qua băm SHA-512
                return await auth.processAdminAuth(req, res);

            case 'heartbeat':
                // Kiểm tra trạng thái máy chủ
                return res.status(200).json({ status: "Online", latency: `${Date.now() - startTime}ms` });

            default:
                await logger.logIncident('UNKNOWN_ENDPOINT', clientIP, { type });
                return res.status(404).json({ error: "Endpoint not found." });
        }

    } catch (fatalError) {
        // LOG LỖI TOÀN CỤC - KHÔNG ĐƯỢC HIỆN CHI TIẾT LỖI RA NGOÀI (TRÁNH EXPLOIT)
        await logger.logError(fatalError, clientIP);
        return res.status(500).json({ 
            error: "Internal Server Error", 
            traceId: crypto.generateShortId() 
        });
    }
}
