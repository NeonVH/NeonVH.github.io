// ==========================================
// KHÓA CHUỘT PHẢI & CHỐNG SOI CODE (F12) 
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123) { return false; } // Khóa F12
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; } // Khóa Ctrl+Shift+I
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; }
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; }
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } // Khóa Ctrl+U
}

// BẪY DEBUGGER LÀM ĐỨNG MÁY NẾU CỐ MỞ F12
setInterval(function() {
    var before = new Date().getTime();
    debugger;
    var after = new Date().getTime();
    if (after - before > 100) { document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%; font-family:sans-serif;'>HÀNH VI ĐÁNG NGỜ! MẠNG LƯỚI ĐÃ KHÓA IP CỦA BẠN.</h1>"; }
}, 1000);

// ==========================================
// CẤU HÌNH HỆ THỐNG CƠ BẢN
// ==========================================
const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' font-weight='bold' fill='%23bc13fe' text-anchor='middle' dominant-baseline='middle'%3EL%E1%BB%97i Link %E1%BA%A2nh%3C/text%3E%3C/svg%3E";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// 👉 CHÚ Ý CHỖ NÀY: NHỚ ĐỔI ĐÚNG TÊN MIỀN VERCEL CỦA BRO
const VERCEL_API = "https://neon-vh-github-io.vercel.app/api";

let gamesDB = []; let isLoginMode = true; 
let db = null; let isOnline = false;

let lastActionTime = 0; 
const COOLDOWN_MS = 3000; // Anti-spam 3 giây

// Lấy IP người dùng để log lại
async function getClientIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch(e) { return "Không xác định"; }
}

// ==========================================
// KHỞI TẠO WEB VÀ LẤY CHÌA KHÓA TỪ VERCEL BACKEND
// ==========================================
async function initApp() {
    document.getElementById('networkStatus').innerText = "Đang kết nối Backend...";
    document.getElementById('networkStatus').className = "text-[10px] font-bold text-yellow-400 ml-2 border border-yellow-400 px-2 py-0.5 rounded-full animate-pulse";
    
    try { 
        // GỌI SANG VERCEL ĐỂ LẤY CONFIG FIREBASE AN TOÀN
        const response = await fetch(`${VERCEL_API}?type=get_gate`);
        const secureConfig = await response.json();
        
        if(secureConfig && secureConfig.apiKey) {
            firebase.initializeApp(secureConfig); 
            db = firebase.firestore(); 
            db.settings({ experimentalForceLongPolling: true, merge: true });
            isOnline = true; 
        }
    } catch(e) { 
        console.error("Không thể kết nối đến Backend Vercel:", e); 
    }

    document.getElementById('networkStatus').innerText = isOnline ? "☁️ Secured Cloud" : "⚠️ Offline Mode";
    document.getElementById('networkStatus').className = isOnline ? "text-[10px] font-bold text-green-400 ml-2 border border-green-400 px-2 py-0.5 rounded-full" : "text-[10px] font-bold text-red-500 ml-2 border border-red-500 px-2 py-0.5 rounded-full";
    
    await loadGamesFromStorage();
    renderGameGrid(); checkAuthState(); initParticles();
    const savedView = localStorage.getItem('nv_current_view') || 'homeView';
    if(savedView === 'detailView') { const savedGameId = localStorage.getItem('nv_current_game'); if(savedGameId) openGameDetail(savedGameId); else switchView('homeView'); } else { switchView(savedView); }
}

async function loadGamesFromStorage() {
    if(isOnline) {
        try { const snapshot = await db.collection('games').orderBy('createdAt', 'desc').get(); gamesDB = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() })); } 
        catch(e) { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
    } else { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
}

function renderGameGrid(data = gamesDB) {
    const container = document.getElementById('gameGridContainer'); if(!container) return;
    if(data.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-10 italic">Không tìm thấy game nào phù hợp.</p>'; return; }
    container.innerHTML = data.map(game => `
        <div onclick="openGameDetail('${game.id}')" class="card-3d glass-panel rounded-xl md:rounded-2xl overflow-hidden flex flex-row items-stretch h-[150px] md:h-[180px]">
            <div class="w-32 md:w-44 flex-shrink-0 relative">${game.is18 ? `<div class="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded shadow-lg z-10 animate-pulse">18+</div>` : ''}<img src="${game.cover}" onerror="this.onerror=null; this.src=fallbackImg;" class="w-full h-full object-cover cursor-pointer" onclick="event.stopPropagation(); openLightbox(this.src)"></div>
            <div class="flex-1 p-3 md:p-5 bg-[#0a0a0a] relative flex flex-col min-w-0">
                <div class="flex items-start justify-between mb-1 gap-2 border-b border-white/5 pb-1"><h3 class="logo-font font-bold text-white text-base md:text-xl truncate text-neon">${game.title}</h3></div>
                <div class="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 truncate mb-1"><span>By: <span class="text-white font-bold">${game.author || 'Unknown'}</span></span><span>|</span><span>v: <span class="text-[#bc13fe] font-bold">${game.version || 'v1.0'}</span></span></div>
                <div class="text-[#00f0ff] text-[10px] md:text-xs font-black uppercase tracking-widest truncate w-full mb-1">${game.genre}</div>
                <div class="flex items-center justify-between text-[10px] md:text-xs font-bold mb-auto mt-1"><span class="text-gray-300 truncate pr-2"><i class="fa-solid fa-desktop text-[#00f0ff] mr-1"></i>${game.platform || 'Android/PC'}</span><span class="text-[#ff00ff] flex-shrink-0"><i class="fa-solid fa-language mr-1"></i>${game.transType || 'Dev+AI'}</span></div>
                <div class="flex items-center justify-between text-[10px] md:text-sm text-gray-400 mt-auto pt-2 border-t border-white/5"><span class="truncate pr-2"><i class="fa-solid fa-users text-[#bc13fe] mr-1"></i>${game.team}</span><span class="flex-shrink-0 font-bold text-yellow-400 whitespace-nowrap"><i class="fa-solid fa-spinner mr-1"></i>${game.progress || 'Đang cập nhật'}</span></div>
            </div>
        </div>
    `).join('');
}

function handleSearch(query) { const q = query.toLowerCase().trim(); if(!q) { renderGameGrid(gamesDB); return; } const filteredData = gamesDB.filter(game => game.title.toLowerCase().includes(q) || game.genre.toLowerCase().includes(q)); renderGameGrid(filteredData); if(localStorage.getItem('nv_current_view') !== 'homeView') switchView('homeView'); }

function renderAdminManageList() {
    const container = document.getElementById('adminGameManageListContainer'); if(!container) return;
    if(gamesDB.length === 0) { container.innerHTML = '<p class="text-gray-500 italic text-sm p-4 text-center">Chưa có bài đăng VN+ nào của Admin.</p>'; } else {
        container.innerHTML = gamesDB.map(game => `<div class="card-3d glass-panel p-3 rounded-xl flex items-center h-[120px]"><div class="w-24 flex-shrink-0 relative rounded-lg overflow-hidden h-full"><img src="${game.cover}" onerror="this.onerror=null; this.src=fallbackImg;" class="w-full h-full object-cover"></div><div class="flex-1 p-3 flex flex-col min-w-0 h-full justify-between"><h3 class="font-bold text-white truncate text-base">${game.title}</h3><p class="text-xs text-gray-500 truncate">${game.author || 'Unknown'} | ${game.genre}</p><div class="flex gap-2 mt-auto"><button onclick="startEditGame('${game.id}')" class="flex-1 py-1.5 bg-yellow-400 text-black rounded-lg text-xs font-bold transition">Sửa</button><button onclick="deleteGame('${game.id}')" class="flex-1 py-1.5 border border-red-500 text-red-500 rounded-lg text-xs font-bold transition hover:bg-red-500 hover:text-white">Xóa</button></div></div></div>`).join('');
    } 
    renderAdminUserList();
}

// QUẢN LÝ TÀI KHOẢN VÀ AUTO XÓA 30 NGÀY
async function renderAdminUserList() {
    let users = [];
    const now = Date.now();
    let deletedCount = 0;

    if(isOnline) { 
        const snap = await db.collection('users').get(); 
        
        for(let doc of snap.docs) {
            let uData = doc.data();
            let dbId = doc.id;
            
            if (uData.lastLogin && (now - uData.lastLogin > THIRTY_DAYS_MS)) {
                await db.collection('users').doc(dbId).delete();
                deletedCount++;
                continue;
            }
            users.push({ dbId: dbId, ...uData });
        }
        
        if (deletedCount > 0) showToast(`Đã tự động xóa ${deletedCount} acc không online quá 30 ngày!`);

    } else { 
        let localUsers = JSON.parse(localStorage.getItem('nv_users')) || []; 
        users = localUsers.filter(u => {
            if (u.lastLogin && (now - u.lastLogin > THIRTY_DAYS_MS)) { deletedCount++; return false; }
            return true;
        });
        if(deletedCount > 0) {
            localStorage.setItem('nv_users', JSON.stringify(users));
            showToast(`Đã tự động xóa ${deletedCount} acc quá 30 ngày (Local)!`);
        }
    }

    const container = document.getElementById('adminUserManageListContainer'); if(!container) return;
    if(users.length === 0) { container.innerHTML = '<p class="text-gray-500 italic text-sm p-4 text-center">Chưa có người chơi nào đăng ký.</p>'; return; }
    
    container.innerHTML = users.map(u => {
        let dateStr = "Chưa rõ";
        if(u.lastLogin) {
            let d = new Date(u.lastLogin);
            dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
        }

        return `
        <div class="card-3d glass-panel p-3 md:p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-l-2 ${u.vipLevel === 'vvip' ? 'border-yellow-400' : u.vipLevel === 'vip' ? 'border-[#bc13fe]' : 'border-gray-500'}">
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#bc13fe] to-[#00f0ff] flex items-center justify-center text-black font-bold overflow-hidden flex-shrink-0">
                    ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : u.u[0].toUpperCase()}
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-white text-sm md:text-base">${u.u}</h4>
                    <p class="text-[10px] ${u.vipLevel === 'vvip' ? 'text-yellow-400 font-bold' : u.vipLevel === 'vip' ? 'text-[#ff00ff] font-bold' : 'text-gray-400'}">
                        ${u.vipLevel === 'vvip' ? '💎 VVIP PREMIUM' : u.vipLevel === 'vip' ? '✨ VIP' : 'Thành viên'}
                    </p>
                    <div class="text-[10px] text-gray-400 mt-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <span><i class="fa-solid fa-key mr-1"></i> Pass: <span class="text-white">${u.p}</span></span>
                        <span><i class="fa-solid fa-network-wired mr-1"></i> IP: <span class="text-[#00f0ff]">${u.ip || 'Chưa có'}</span></span>
                        <span class="col-span-full mt-0.5"><i class="fa-regular fa-clock mr-1"></i> Online: ${dateStr}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                <select onchange="changeUserVip('${u.u}', this.value)" class="flex-1 md:flex-none bg-black/60 border border-white/20 text-xs text-white p-1.5 rounded focus:border-yellow-400 outline-none">
                    <option value="none" ${(!u.vipLevel || u.vipLevel === 'none') ? 'selected' : ''}>Thường</option>
                    <option value="vip" ${u.vipLevel === 'vip' ? 'selected' : ''}>VIP</option>
                    <option value="vvip" ${u.vipLevel === 'vvip' ? 'selected' : ''}>VVIP PREMIUM</option>
                </select>
                <button onclick="deleteUserAccount('${u.u}')" class="px-3 py-1.5 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-bold transition flex-shrink-0"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `}).join('');
}

async function changeUserVip(username, newVip) {
    if(isOnline) { 
        const snap = await db.collection('users').where('u', '==', username).get(); 
        snap.forEach(doc => doc.ref.update({ vipLevel: newVip })); 
    } else { 
        let users = JSON.parse(localStorage.getItem('nv_users')) || []; 
        const index = users.findIndex(u => u.u === username); 
        if(index > -1) { users[index].vipLevel = newVip; localStorage.setItem('nv_users', JSON.stringify(users)); } 
    }
    showToast(`Đã đổi quyền ${newVip.toUpperCase()} cho ${username}!`); 
    renderAdminUserList();
}

async function deleteUserAccount(username) {
    if(!confirm(`XÓA vĩnh viễn tài khoản: ${username}?`)) return;
    if(isOnline) { 
        const snap = await db.collection('users').where('u', '==', username).get(); 
        snap.forEach(doc => doc.ref.delete()); 
    } else { 
        let users = JSON.parse(localStorage.getItem('nv_users')) || []; 
        localStorage.setItem('nv_users', JSON.stringify(users.filter(u => u.u !== username))); 
    }
    showToast(`Đã xóa ${username}!`); 
    renderAdminUserList(); 
    if(localStorage.getItem('nv_current_view') === 'profileView') updateProfileView();
}

function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error); reader.readAsDataURL(file); }); }
function applyColorToMsg() { const textarea = document.getElementById('adMsg'); const color = document.getElementById('adColorPicker').value; const start = textarea.selectionStart; const end = textarea.selectionEnd; const selectedText = textarea.value.substring(start, end); if (!selectedText) return showToast("Bôi đen chữ cần tô màu trước!", "error"); textarea.value = textarea.value.substring(0, start) + `<span style="color: ${color}">${selectedText}</span>` + textarea.value.substring(end); textarea.focus(); }

async function handleAvatarChange(e) {
    const file = e.target.files[0]; if(!file) return;
    try {
        showToast("Đang xử lý Avatar..."); 
        const base64 = await readFileAsBase64(file); 
        if(base64.length > 500000) throw new Error("Ảnh quá nặng (Khuyên dùng < 300KB)!"); 
        
        const user = localStorage.getItem('nv_current_user');
        if(user === "Admin") { localStorage.setItem('nv_admin_avatar', base64); } 
        else {
            if(isOnline) { const snap = await db.collection('users').where('u', '==', user).get(); snap.forEach(doc => doc.ref.update({ avatar: base64 })); } 
            else { let users = JSON.parse(localStorage.getItem('nv_users')) || []; const index = users.findIndex(x => x.u === user); if(index > -1) { users[index].avatar = base64; localStorage.setItem('nv_users', JSON.stringify(users)); } }
        }
        updateAvatarUI(); showToast("Đổi Avatar thành công!");
    } catch(err) { showToast(err.message || "Lỗi cập nhật ảnh!", "error"); }
}

async function updateAvatarUI() {
    const user = localStorage.getItem('nv_current_user'); if(!user) return; let avatarData = null;
    if(user === "Admin") { avatarData = localStorage.getItem('nv_admin_avatar'); } else {
        if(isOnline) { const snap = await db.collection('users').where('u', '==', user).get(); if(!snap.empty) avatarData = snap.docs[0].data().avatar; } 
        else { const users = JSON.parse(localStorage.getItem('nv_users')) || []; const uObj = users.find(x => x.u === user); if(uObj && uObj.avatar) avatarData = uObj.avatar; }
    }
    const navAv = document.getElementById('userAvatar');
    if(avatarData) { navAv.innerHTML = `<img src="${avatarData}" class="w-full h-full rounded-full object-cover">`; navAv.classList.remove('bg-gradient-to-r', 'from-[#bc13fe]', 'to-[#00f0ff]'); } 
    else { navAv.innerHTML = user[0].toUpperCase(); navAv.classList.add('bg-gradient-to-r', 'from-[#bc13fe]', 'to-[#00f0ff]'); }
    const profImg = document.getElementById('profileAvatarImg'); const profText = document.getElementById('profileAvatarText');
    if(profImg && profText) { if(avatarData) { profImg.src = avatarData; profImg.classList.remove('hidden'); profText.classList.add('hidden'); } else { profImg.classList.add('hidden'); profText.classList.remove('hidden'); profText.innerText = user[0].toUpperCase(); } }
}

async function handleAdminFormSubmit(e) {
    e.preventDefault(); 
    
    // CHỐNG SPAM CLICK KHI ĐĂNG BÀI
    if (Date.now() - lastActionTime < COOLDOWN_MS) {
        return showToast("Hệ thống đang xử lý, vui lòng đợi 3 giây!", "error");
    }
    lastActionTime = Date.now();

    const btn = document.getElementById('adminSubmitBtn');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG ĐẨY LÊN MÂY...`;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.disabled = true;

    try {
        const gameId = document.getElementById('adGameId').value; const title = document.getElementById('adTitle').value; const author = document.getElementById('adAuthor').value; const version = document.getElementById('adVersion').value; const progress = document.getElementById('adProgress').value; const platform = document.getElementById('adPlatform').value; const transType = document.getElementById('adTransType').value; const size = document.getElementById('adSize').value; const genre = document.getElementById('adGenre').value; const team = document.getElementById('adTeam').value; const desc = document.getElementById('adDesc').value; const adminMsg = document.getElementById('adMsg').value; const is18 = document.getElementById('ad18').checked;
        const links = { android: { terabox: document.getElementById('adLinkAndTerabox').value.trim(), mediafire: document.getElementById('adLinkAndMediafire').value.trim(), drive: document.getElementById('adLinkAndDrive').value.trim() }, pc: { terabox: document.getElementById('adLinkPcTerabox').value.trim(), mediafire: document.getElementById('adLinkPcMediafire').value.trim(), drive: document.getElementById('adLinkPcDrive').value.trim() } };

        const coverFileInput = document.getElementById('adCoverFile'); const coverUrlInput = document.getElementById('adCoverUrl'); let coverData = coverUrlInput.value.trim(); 
        if(coverData) { const match = coverData.match(/(https?:\/\/[^"'\s>]+)/); if(match) coverData = match[1]; }
        if (coverFileInput.files.length > 0) { coverData = await readFileAsBase64(coverFileInput.files[0]); }

        const screenshotsInput = document.getElementById('adScreenshotsFile'); const screenshotsUrlInput = document.getElementById('adScreenshotsUrl').value.trim(); let screenshotsArray = [];
        if(screenshotsUrlInput) { const urls = screenshotsUrlInput.split('\n').map(u => u.trim()).filter(u => u !== ''); urls.forEach(u => { let cleanUrl = u; const match = u.match(/(https?:\/\/[^"'\s>]+)/); if (match) cleanUrl = match[1]; if(screenshotsArray.length < 5 && cleanUrl) screenshotsArray.push(cleanUrl); }); }
        if (screenshotsInput.files.length > 0) { const remainingSlots = 5 - screenshotsArray.length; if (remainingSlots > 0) { const filesToProcess = Math.min(screenshotsInput.files.length, remainingSlots); for(let i = 0; i < filesToProcess; i++) { const base64Img = await readFileAsBase64(screenshotsInput.files[i]); screenshotsArray.push(base64Img); } } }

        let estimatedSize = 0;
        if(coverData && coverData.startsWith('data:image')) estimatedSize += coverData.length;
        screenshotsArray.forEach(img => { if(img.startsWith('data:image')) estimatedSize += img.length; });
        if(estimatedSize > 700000) { throw new Error("LỖI: Tổng dung lượng ảnh quá nặng! BẮT BUỘC dùng Link URL (ImgBB) để đăng."); }

        const gameData = { title, author, version, progress, platform, transType, size, genre, team, cover: coverData, desc, adminMsg, is18, screenshots: screenshotsArray, links, createdAt: Date.now() };

        if(isOnline) {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("LỖI KẾT NỐI: Backend chưa phản hồi!")), 25000));
            
            if(gameId) { 
                const dbId = gamesDB.find(g => g.id === gameId).dbId; 
                await Promise.race([ db.collection('games').doc(dbId).update(gameData), timeout ]);
                showToast("Cập nhật bài viết lên Cloud thành công!"); 
            } else { 
                gameData.id = 'cloud_' + Date.now(); 
                await Promise.race([ db.collection('games').add(gameData), timeout ]);
                showToast("Đã lưu bài viết lên Cloud!"); 
            }
        } else {
            if(gameId) { const index = gamesDB.findIndex(g => g.id === gameId); gamesDB[index] = { ...gamesDB[index], ...gameData }; showToast("Đã cập nhật (Local)!"); } 
            else { gameData.id = 'local_' + Date.now(); gamesDB.unshift(gameData); showToast("Đã đăng bài (Local)!"); }
            localStorage.setItem('nv_custom_games', JSON.stringify(gamesDB));
        }
        
        resetAdminForm(); await loadGamesFromStorage(); renderGameGrid(); renderAdminManageList(); switchView('homeView');
    } catch (error) { 
        showToast(error.message, "error"); 
        console.error(error);
    } finally {
        btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-2"></i> LƯU LÊN DATABASE`;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.disabled = false;
    }
}

function startEditGame(gameId) {
    const game = gamesDB.find(g => g.id === gameId); if(!game) return;
    document.getElementById('adGameId').value = game.id; document.getElementById('adTitle').value = game.title; document.getElementById('adAuthor').value = game.author || ""; document.getElementById('adVersion').value = game.version || ""; document.getElementById('adProgress').value = game.progress || ""; document.getElementById('adPlatform').value = game.platform || ""; document.getElementById('adTransType').value = game.transType || ""; document.getElementById('adSize').value = game.size || ""; document.getElementById('adGenre').value = game.genre; document.getElementById('adTeam').value = game.team; document.getElementById('adDesc').value = game.desc; document.getElementById('adMsg').value = game.adminMsg || ""; document.getElementById('ad18').checked = game.is18;
    const links = game.links || { android: {}, pc: {} }; document.getElementById('adLinkAndTerabox').value = links.android?.terabox || ""; document.getElementById('adLinkAndMediafire').value = links.android?.mediafire || ""; document.getElementById('adLinkAndDrive').value = links.android?.drive || ""; document.getElementById('adLinkPcTerabox').value = links.pc?.terabox || ""; document.getElementById('adLinkPcMediafire').value = links.pc?.mediafire || ""; document.getElementById('adLinkPcDrive').value = links.pc?.drive || "";
    document.getElementById('adCoverFile').value = ""; document.getElementById('adCoverUrl').value = ""; document.getElementById('adScreenshotsFile').value = "";
    const scUrls = (game.screenshots || []).filter(s => s.startsWith('http')); document.getElementById('adScreenshotsUrl').value = scUrls.join('\n');
    document.getElementById('adminSubmitBtn').innerHTML = `<i class="fa-solid fa-pen mr-2"></i> CẬP NHẬT TRÊN KHO`; showToast("Chế độ sửa bài đăng."); window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteGame(gameId) {
    if(!confirm("XÓA VĨNH VIỄN bài đăng này?")) return;
    if(isOnline) { const dbId = gamesDB.find(g => g.id === gameId).dbId; await db.collection('games').doc(dbId).delete(); } 
    else { gamesDB = gamesDB.filter(g => g.id !== gameId); localStorage.setItem('nv_custom_games', JSON.stringify(gamesDB)); }
    showToast("Đã xóa bài đăng."); await loadGamesFromStorage(); renderGameGrid(); renderAdminManageList(); switchView('homeView');
}

function resetAdminForm() { document.getElementById('adGameId').value = ""; document.getElementById('adminForm').reset(); document.getElementById('adminSubmitBtn').innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-2"></i> LƯU LÊN MÁY CHỦ`; }
function switchView(viewId) { localStorage.setItem('nv_current_view', viewId); const views = ['homeView', 'detailView', 'adminView', 'profileView']; views.forEach(id => { const el = document.getElementById(id); if(!el) return; if(id === viewId) { el.classList.remove('view-hidden'); el.classList.add('view-active'); } else { el.classList.remove('view-active'); el.classList.add('view-hidden'); } }); if(viewId === 'adminView') renderAdminManageList(); if(viewId === 'profileView') updateProfileView(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function renderLinkButton(url, name, bgClass, iconClass) { if(!url) return ''; return `<a href="${url}" target="_blank" class="w-full py-3 md:py-3.5 ${bgClass} text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-80 hover:shadow-lg transition transform hover:-translate-y-1 text-sm"><i class="${iconClass}"></i> Tải qua ${name}</a>`; }

function openGameDetail(gameId) {
    const game = gamesDB.find(g => g.id == gameId); if(!game) return; localStorage.setItem('nv_current_game', gameId);
    const coverImg = document.getElementById('detailCover'); coverImg.src = game.cover; coverImg.onerror = function() { this.src = fallbackImg; };
    document.getElementById('detailTitle').innerText = game.title; document.getElementById('detailAuthor').innerText = game.author || "Đang cập nhật"; document.getElementById('detailVersion').innerText = game.version || "v1.0"; document.getElementById('detailProgress').innerHTML = `<i class="fa-solid fa-spinner mr-1"></i> ${game.progress || "Đang cập nhật"}`; document.getElementById('detailPlatform').innerHTML = `<i class="fa-solid fa-desktop mr-1"></i> ${game.platform || "Android/PC"}`; document.getElementById('detailTransType').innerHTML = `<i class="fa-solid fa-language mr-1"></i> ${game.transType || "Dev+AI"}`; document.getElementById('detailSize').innerHTML = `<i class="fa-solid fa-database mr-1"></i> ${game.size || "Chưa rõ"}`; document.getElementById('detailGenre').innerText = game.genre; document.getElementById('detailTeam').innerText = game.team; document.getElementById('detailDesc').innerText = game.desc;
    const adminMsgBox = document.getElementById('detailAdminMsgBox'); if(game.adminMsg && game.adminMsg.trim() !== "") { adminMsgBox.classList.remove('hidden'); document.getElementById('detailAdminMsg').innerHTML = game.adminMsg; } else { adminMsgBox.classList.add('hidden'); }
    const scContainer = document.getElementById('detailScreenshots'); if(game.screenshots && game.screenshots.length > 0) { scContainer.innerHTML = game.screenshots.map(img => `<div class="rounded-xl overflow-hidden border border-white/10 aspect-video hover:border-[#bc13fe] transition shadow-lg cursor-pointer" onclick="openLightbox(this.querySelector('img').src)"><img src="${img}" onerror="this.onerror=null; this.src='${fallbackImg}';" class="w-full h-full object-cover"></div>`).join(''); } else { scContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Chưa có ảnh giới thiệu.</p>'; }
    const links = game.links || { android: {}, pc: {} }; let andHtml = renderLinkButton(links.android?.terabox, 'Terabox', 'bg-blue-600', 'fa-solid fa-cloud') + renderLinkButton(links.android?.mediafire, 'MediaFire', 'bg-red-500', 'fa-solid fa-fire') + renderLinkButton(links.android?.drive, 'Google Drive', 'bg-green-600', 'fa-brands fa-google-drive'); document.getElementById('detailAndroidLinks').innerHTML = andHtml || '<p class="text-sm text-gray-500 italic">Chưa có bản Android.</p>'; let pcHtml = renderLinkButton(links.pc?.terabox, 'Terabox', 'bg-blue-600', 'fa-solid fa-cloud') + renderLinkButton(links.pc?.mediafire, 'MediaFire', 'bg-red-500', 'fa-solid fa-fire') + renderLinkButton(links.pc?.drive, 'Google Drive', 'bg-green-600', 'fa-brands fa-google-drive'); document.getElementById('detailPcLinks').innerHTML = pcHtml || '<p class="text-sm text-gray-500 italic">Chưa có bản PC.</p>';
    switchView('detailView');
}

function toggleAuthMode() { isLoginMode = !isLoginMode; document.getElementById('authTitle').innerText = isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"; document.getElementById('authSubmitBtn').innerText = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN"; document.getElementById('authSwitchText').innerText = isLoginMode ? "Chưa có tài khoản?" : "Đã có tài khoản?"; document.getElementById('authSwitchBtn').innerText = isLoginMode ? "Đăng ký" : "Đăng nhập"; }
function toggleAuthModal(mode) { isLoginMode = (mode === 'login'); toggleAuthMode(); toggleAuthMode(); const modal = document.getElementById('authModal'); modal.classList.remove('hidden'); setTimeout(() => modal.classList.add('opacity-100'), 10); }
function closeAuthModal() { document.getElementById('authModal').classList.remove('opacity-100'); setTimeout(() => document.getElementById('authModal').classList.add('hidden'), 300); }

// =================================================================
// HÀM ĐĂNG NHẬP BẢO MẬT: XÁC THỰC QUA BACKEND VERCEL VÀ DÙNG TOKEN
// =================================================================
async function handleAuth(e) { 
    e.preventDefault(); 

    // CHỐNG SPAM BOT CLICK LIÊN TỤC
    if (Date.now() - lastActionTime < COOLDOWN_MS) {
        return showToast("Hệ thống đang chống Spam, vui lòng đợi 3 giây!", "error");
    }
    lastActionTime = Date.now();

    const u = document.getElementById('authUsername').value.trim(); 
    const p = document.getElementById('authPassword').value;
    const btn = document.getElementById('authSubmitBtn');
    
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XÁC THỰC...`; 
    btn.disabled = true;

    const userIP = await getClientIP(); 
    const actionType = isLoginMode ? 'login' : 'register';

    try {
        // GỌI ĐIỆN CHO MÁY CHỦ VERCEL ĐỂ BĂM PASS & CHECK ADMIN
        const authReq = await fetch(`${VERCEL_API}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u: u, p: p, action: actionType })
        });

        const authRes = await authReq.json();

        if (!authReq.ok) {
            showToast(authRes.error || "Lỗi xác thực Backend!", "error");
            btn.innerHTML = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN";
            btn.disabled = false;
            return;
        }

        // 1. NẾU LÀ ADMIN (Máy chủ đã duyệt và cấp thẻ Token)
        if (authRes.roleHash === "adm_x99" && authRes.token) {
            if (!isLoginMode) {
                showToast("Tên tài khoản này được bảo vệ bởi hệ thống!", "error"); 
            } else {
                localStorage.setItem('nv_current_user', 'Admin'); 
                localStorage.setItem('nv_role', 'admin'); 
                localStorage.setItem('nv_token', authRes.token); // Lưu thẻ phiên (Session)
                showToast("Đặc quyền Admin mở khóa!"); 
                closeAuthModal(); checkAuthState(); switchView('adminView');
            }
            document.getElementById('authForm').reset();
            btn.innerHTML = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN"; 
            btn.disabled = false;
            return;
        }

        // 2. NẾU LÀ NGƯỜI CHƠI THƯỜNG (Dùng Pass đã bị băm nát từ máy chủ)
        const securePass = authRes.hashedPass;

        if(!isLoginMode) {
            // ĐĂNG KÝ
            if(isOnline) {
                const snap = await db.collection('users').where('u', '==', u).get();
                if(!snap.empty) { showToast("Tài khoản đã tồn tại!", "error"); btn.innerHTML = "TẠO TÀI KHOẢN"; btn.disabled = false; return; }
                
                // LƯU PASS ĐÃ BĂM LÊN DATABASE (Bảo mật 100%)
                await db.collection('users').add({u, p: securePass, avatar: '', vipLevel: 'none', ip: userIP, lastLogin: Date.now()});
            } else {
                let users = JSON.parse(localStorage.getItem('nv_users')) || [];
                if(users.find(x => x.u.toLowerCase() === u.toLowerCase())) { showToast("Tài khoản đã tồn tại!", "error"); btn.innerHTML = "TẠO TÀI KHOẢN"; btn.disabled = false; return; }
                users.push({u, p: securePass, avatar: '', vipLevel: 'none', ip: userIP, lastLogin: Date.now()}); 
                localStorage.setItem('nv_users', JSON.stringify(users));
            }
            showToast("Đăng ký thành công! Hãy đăng nhập."); toggleAuthMode();

        } else {
            // ĐĂNG NHẬP
            let validUserDoc = null;
            let isLocal = false;
            
            if(isOnline) {
                // CHECK TÀI KHOẢN BẰNG PASS ĐÃ BĂM
                const snap = await db.collection('users').where('u', '==', u).where('p', '==', securePass).get();
                if(!snap.empty) validUserDoc = snap.docs[0];
            } else { 
                let users = JSON.parse(localStorage.getItem('nv_users')) || []; 
                const foundIndex = users.findIndex(x => x.u.toLowerCase() === u.toLowerCase() && x.p === securePass);
                if(foundIndex > -1) { validUserDoc = users[foundIndex]; isLocal = true; validUserDoc.localIndex = foundIndex; }
            }
            
            if(validUserDoc) { 
                if(isOnline) { await validUserDoc.ref.update({ ip: userIP, lastLogin: Date.now() }); }
                else { 
                    let users = JSON.parse(localStorage.getItem('nv_users')); 
                    users[validUserDoc.localIndex].ip = userIP; users[validUserDoc.localIndex].lastLogin = Date.now();
                    localStorage.setItem('nv_users', JSON.stringify(users));
                }

                localStorage.setItem('nv_current_user', u); 
                localStorage.setItem('nv_role', 'user'); 
                localStorage.setItem('nv_token', authRes.token); // Lưu token người dùng
                showToast(`Chào mừng ${u}!`); closeAuthModal(); checkAuthState(); switchView('profileView'); 
            } else { 
                showToast("Sai tài khoản hoặc mật khẩu!", "error"); 
            }
        }
    } catch (error) {
        console.error(error);
        showToast("Lỗi kết nối máy chủ xác thực!", "error");
    }

    document.getElementById('authForm').reset();
    btn.innerHTML = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN"; 
    btn.disabled = false;
}

function logout() { localStorage.removeItem('nv_current_user'); localStorage.removeItem('nv_role'); checkAuthState(); showToast("Đã đăng xuất!"); switchView('homeView'); }
function checkAuthState() { const user = localStorage.getItem('nv_current_user'); const role = localStorage.getItem('nv_role'); const authC = document.getElementById('authContainer'); const userC = document.getElementById('userContainer'); const navAdmin = document.getElementById('navAdminBtn'); const navProfile = document.getElementById('navProfileBtn'); const mobAdmin = document.getElementById('mobileAdminBtn'); const mobProfile = document.getElementById('mobileProfileBtn'); if(user) { authC.classList.replace('md:flex', 'hidden'); userC.classList.replace('hidden', 'md:flex'); document.getElementById('userNameDisplay').innerText = user; document.getElementById('mobileAuthMenu').classList.add('hidden'); document.getElementById('mobileUserMenu').classList.remove('hidden'); document.getElementById('mobileUserMenu').classList.add('flex'); document.getElementById('mobileUserName').innerText = user; if(role === 'admin') { navAdmin.classList.remove('hidden'); mobAdmin.classList.remove('hidden'); navProfile.classList.remove('hidden'); mobProfile.classList.remove('hidden'); } else { navAdmin.classList.add('hidden'); mobAdmin.classList.add('hidden'); navProfile.classList.remove('hidden'); mobProfile.classList.remove('hidden'); } updateAvatarUI(); } else { authC.classList.replace('hidden', 'md:flex'); userC.classList.replace('md:flex', 'hidden'); document.getElementById('mobileAuthMenu').classList.remove('hidden'); document.getElementById('mobileUserMenu').classList.add('hidden'); document.getElementById('mobileUserMenu').classList.remove('flex'); navAdmin.classList.add('hidden'); mobAdmin.classList.add('hidden'); navProfile.classList.add('hidden'); mobProfile.classList.add('hidden'); } }

async function updateProfileView() {
    const user = localStorage.getItem('nv_current_user'); const role = localStorage.getItem('nv_role'); if(!user) return switchView('homeView'); 
    document.getElementById('profileNameLarge').innerText = user;
    
    let vipLevel = 'none';
    if(role !== 'admin') {
        if(isOnline) { const snap = await db.collection('users').where('u', '==', user).get(); if(!snap.empty) vipLevel = snap.docs[0].data().vipLevel || 'none'; } 
        else { const users = JSON.parse(localStorage.getItem('nv_users')) || []; const uObj = users.find(x => x.u === user); if(uObj) vipLevel = uObj.vipLevel || 'none'; }
    }

    const badge = document.getElementById('profileRoleBadge');
    const card = document.getElementById('profileContainerCard');

    if(role === 'admin') {
        badge.innerText = 'BẤT TỬ (ADMIN)'; badge.className = 'px-4 py-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_10px_#facc15]';
        card.className = 'glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden border-t-4 border-yellow-400 mb-8';
        document.getElementById('stat1-value').innerText = gamesDB.length; document.getElementById('stat1-label').innerText = "Đã đăng"; document.getElementById('stat2-value').innerText = "99+"; document.getElementById('stat2-label').innerText = "Tương tác";
        if(isOnline) { const snap = await db.collection('users').get(); document.getElementById('stat3-value').innerText = snap.size; } else { const usersList = JSON.parse(localStorage.getItem('nv_users')) || []; document.getElementById('stat3-value').innerText = usersList.length; } document.getElementById('stat3-label').innerText = "Người chơi";
    } else {
        if(vipLevel === 'vvip') {
            badge.innerText = '💎 VVIP PREMIUM'; badge.className = 'px-4 py-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white border-0 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_#facc15] animate-pulse';
            card.className = 'glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden border-t-4 border-yellow-400 mb-8';
        } else if(vipLevel === 'vip') {
            badge.innerText = '✨ VIP MEMBER'; badge.className = 'px-4 py-1 bg-gradient-to-r from-[#bc13fe] to-[#ff00ff] text-white border-0 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_#bc13fe]';
            card.className = 'glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden border-t-4 border-[#bc13fe] mb-8';
        } else {
            badge.innerText = 'THÀNH VIÊN VÀNG'; badge.className = 'px-4 py-1 bg-[#00f0ff]/20 text-[#00f0
