/**
 * ==============================================================================
 * NEONVH MAXIMUM SECURITY CORE - SHIELD MODULE v3.0
 * ------------------------------------------------------------------------------
 * Chuyên trách: Cryptography, Deep Sanitization, Rate Limiting, Bot Defense.
 * CẢNH BÁO: Không chỉnh sửa nếu không hiểu logic mã hóa dòng chảy.
 * ==============================================================================
 */

const CryptoJS = require('crypto-js');

/**
 * 1. CRYPTOGRAPHY ENGINE (Hệ thống xay thịt dữ liệu)
 * Sử dụng AES-256-CBC kèm muối (Salt) và Vector khởi tạo (IV) ngẫu nhiên.
 */
class CryptoEngine {
    constructor() {
        this.key = CryptoJS.enc.Utf8.parse(process.env.CRYPTO_KEY || 'NEON_DEFAULT_KEY_32_CHARS_LONG_!');
        this.salt = process.env.SYSTEM_SALT || 'NEON_SALT_SECRET';
    }

    // Mã hóa cực sâu kèm IV để mỗi gói tin trả về là DUY NHẤT
    encrypt(plainText) {
        try {
            if (!plainText) return null;
            const iv = CryptoJS.lib.WordArray.random(16);
            const encrypted = CryptoJS.AES.encrypt(plainText, this.key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            // Format: iv_hex:cipher_text
            return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
        } catch (e) {
            console.error("[CRYPTO_ERROR] Encryption failed:", e.message);
            return null;
        }
    }

    // Băm mật khẩu SHA-512 siêu nặng kèm Salt
    hash(text) {
        return CryptoJS.SHA512(text + this.salt).toString(CryptoJS.enc.Hex);
    }

    // Tạo ID giao dịch ngẫu nhiên
    generateTraceId() {
        return 'NVH-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    }
}

/**
 * 2. DEEP SANITIZER (Máy lọc chất độc 3 lớp)
 * Tự động phát hiện và triệt hạ XSS, SQL Injection, Remote Code Execution.
 */
class DeepSanitizer {
    constructor() {
        this.blackList = [
            /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
            /eval\(.*\)/gi,
            /javascript:/gi,
            /onload=/gi,
            /onerror=/gi,
            /union\s+select/gi,
            /--/g,
            /drop\s+table/gi
        ];
    }

    clean(input) {
        if (typeof input !== 'string') return input;
        let sanitized = input;
        
        // Lớp 1: Quét danh sách đen
        this.blackList.forEach(pattern => {
            if (pattern.test(sanitized)) {
                console.warn("[SECURITY_ALERT] Malicious pattern detected and neutralized.");
                sanitized = sanitized.replace(pattern, "[DATA_EXPUNGED]");
            }
        });

        // Lớp 2: Loại bỏ ký tự điều khiển (Null bytes, etc.)
        sanitized = sanitized.replace(/[^\x20-\x7E\u00C0-\u1EF9]/g, '');

        // Lớp 3: Trim và chuẩn hóa
        return sanitized.trim();
    }

    cleanObject(obj) {
        if (Array.isArray(obj)) return obj.map(item => this.cleanObject(item));
        if (obj !== null && typeof obj === 'object') {
            const cleaned = {};
            for (let key in obj) {
                cleaned[this.clean(key)] = this.cleanObject(obj[key]);
            }
            return cleaned;
        }
        return this.clean(obj);
    }
}

/**
 * 3. ADVANCED FIREWALL (Tường lửa hành vi)
 * Kiểm tra IP, User-Agent, Chống Spam và Bot.
 */
const requestHistory = new Map();

class AdvancedFirewall {
    // Chống Spam: Giới hạn 30 req/phút mỗi IP
    isSpamming(ip) {
        const now = Date.now();
        const timeframe = 60000; 
        if (!requestHistory.has(ip)) {
            requestHistory.set(ip, []);
        }
        const userLogs = requestHistory.get(ip).filter(t => now - t < timeframe);
        userLogs.push(now);
        requestHistory.set(ip, userLogs);
        return userLogs.length > 30;
    }

    // Kiểm tra tính chính danh (Fingerprinting)
    validateIdentity(headers) {
        const ua = headers['user-agent'] || '';
        const origin = headers['origin'] || '';
        const secret = headers['x-neon-secret'];

        // Chặn các công cụ quét tự động phổ biến
        const isBot = /python|curl|postman|insomnia|axios|go-http|java/i.test(ua);
        if (isBot) return { ok: false, msg: "BOT_DETECTED" };

        // Kiểm tra CORS cứng
        if (origin !== "https://neonvh.github.io" && process.env.NODE_ENV === 'production') {
            return { ok: false, msg: "CORS_VIOLATION" };
        }

        // Kiểm tra mật mã hệ thống ngầm
        if (secret !== process.env.SYSTEM_SECRET) {
            return { ok: false, msg: "INVALID_SYSTEM_SECRET" };
        }

        return { ok: true };
    }

    // Tiêm các Header bảo mật thép
    setSecureHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        res.setHeader('Access-Control-Allow-Origin', 'https://neonvh.github.io');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
}

// Khởi tạo các module
const engine = new CryptoEngine();
const sanitizer = new DeepSanitizer();
const firewall = new AdvancedFirewall();

module.exports = { engine, sanitizer, firewall };
