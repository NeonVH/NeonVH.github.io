/**
 * ADVANCED LOGGER - TRACE EVERY HACKER
 */
const crypto = require('./crypto');

async function logIncident(type, ip, details = {}) {
    const timestamp = new Date().toISOString();
    const traceId = crypto.generateShortId();
    
    // Ghi log ra console của Vercel (Hệ thống giám sát trung tâm)
    console.warn(`[SECURITY_INCIDENT][${traceId}] TYPE: ${type} | IP: ${ip} | TIME: ${timestamp}`);
    console.dir(details);
    
    // Nếu đại ca có Database log riêng, có thể gửi data vào đây
    return traceId;
}

module.exports = { logIncident };
