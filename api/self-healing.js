/**
 * SELF-HEALING & AUTO-BLOCKING SYSTEM
 * Tự động vá lỗ hổng hành vi
 */
const logger = require('./logger');

const violationMap = new Map(); // Lưu vết vi phạm

async function reportViolation(ip, severity = 1) {
    let currentScore = violationMap.get(ip) || 0;
    currentScore += severity;
    violationMap.set(ip, currentScore);

    if (currentScore >= 5) {
        await logger.logIncident('AUTO_IP_BAN', ip, { reason: "Vượt ngưỡng vi phạm an toàn" });
        return true; // Lệnh cấm IP được kích hoạt
    }
    return false;
}

module.exports = { reportViolation };
