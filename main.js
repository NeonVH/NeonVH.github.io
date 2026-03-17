// ==========================================
// FILE: main.js - TRÁI TIM CỦA HỆ THỐNG V30
// ==========================================

document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
}

setInterval(function() {
    var before = new Date().getTime();
    debugger;
    var after = new Date().getTime();
    if (after - before > 100) { document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%;'>HÀNH VI ĐÁNG NGỜ! VUI LÒNG TẮT F12 ĐỂ TIẾP TỤC.</h1>"; }
}, 1000);

const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect width='100%25' height='100%25' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' fill='%23bc13fe' text-anchor='middle'%3ELỗi Ảnh%3C/text%3E%3C/svg%3E";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const VERCEL_API = "https://neon-vh-github-io.vercel.app/api";

let gamesDB = []; let isLoginMode = true; 
let db = null; let isOnline = false;
let lastActionTime = 0; 
const COOLDOWN_MS = 3000;

async function getClientIP() {
    try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); return data.ip; } 
    catch(e) { return "Unknown"; }
}

async function initApp() {
    const statusEl = document.getElementById('networkStatus');
    if(statusEl) {
        statusEl.innerText = "Đang kết nối Backend...";
        statusEl.className = "text-[10px] font-bold text-yellow-400 ml-2 animate-pulse";
    }
    
    try { 
        const response = await fetch(`${VERCEL_API}?type=get_gate`);
        const secureConfig = await response.json();
        if(secureConfig && secureConfig.apiKey) {
            firebase.initializeApp(secureConfig); 
            db = firebase.firestore(); 
            db.settings({ experimentalForceLongPolling: true });
            isOnline = true; 
        }
    } catch(e) { console.error("Backend Error:", e); }

    if(statusEl) {
        statusEl.innerText = isOnline ? "☁️ Secured Cloud" : "⚠️ Offline Mode";
        statusEl.className = isOnline ? "text-[10px] font-bold text-green-400 ml-2" : "text-[10px] font-bold text-red-500 ml-2";
    }
    
    await loadGamesFromStorage();
    renderGameGrid(); checkAuthState(); initParticles();
}

async function loadGamesFromStorage() {
    if(isOnline) {
        try { const snapshot = await db.collection('games').orderBy('createdAt', 'desc').get(); gamesDB = snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() })); } 
        catch(e) { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
    } else { gamesDB = JSON.parse(localStorage.getItem('nv_custom_games')) || []; }
}

function renderGameGrid(data = gamesDB) {
    const container = document.getElementById('gameGridContainer'); 
    if(!container) return;
    if(data.length === 0) { container.innerHTML = '<p class="text-gray-400 text-center py-10 italic">Không tìm thấy game nào.</p>'; return; }
    
    // ĐÃ SỬA: innerHTML thay vì innerText
    container.innerHTML = data.map(game => `
        <div onclick="openGameDetail('${game.id}')" class="card-3d glass-panel rounded-xl md:rounded-2xl overflow-hidden flex flex-row items-stretch h-[150px] md:h-[180px]">
            <div class="w-32 md:w-44 flex-shrink-0 relative">
                ${game.is18 ? `<div class="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded z-10">18+</div>` : ''}
                <img src="${game.cover}" onerror="this.src=fallbackImg" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 p-3 md:p-5 bg-[#0a0a0a] flex flex-col min-w-0">
                <h3 class="logo-font font-bold text-white text-base md:text-xl truncate">${game.title}</h3>
                <div class="text-[#00f0ff] text-[10px] font-black uppercase mb-1">${game.genre}</div>
                <div class="text-gray-400 text-[10px] mt-auto border-t border-white/5 pt-2 flex justify-between">
                    <span><i class="fa-solid fa-users mr-1"></i>${game.team}</span>
                    <span class="text-yellow-400 font-bold">${game.progress || 'v1.0'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleAuth(e) { 
    e.preventDefault(); 
    if (Date.now() - lastActionTime < COOLDOWN_MS) return showToast("Vui lòng đợi 3s!", "error");
    lastActionTime = Date.now();

    const u = document.getElementById('authUsername').value.trim(); 
    const p = document.getElementById('authPassword').value;
    const btn = document.getElementById('authSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = "ĐANG XÁC THỰC...";

    const actionType = isLoginMode ? 'login' : 'register';

    try {
        const authReq = await fetch(`${VERCEL_API}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u, p, action: actionType })
        });
        const authRes = await authReq.json();

        if (!authReq.ok) throw new Error(authRes.error || "Lỗi server");

        if (authRes.roleHash === "adm_x99") {
            localStorage.setItem('nv_current_user', 'Admin'); 
            localStorage.setItem('nv_role', 'admin'); 
            localStorage.setItem('nv_token', authRes.token);
            showToast("Admin đã đăng nhập!");
            closeAuthModal(); checkAuthState(); switchView('adminView');
        } else {
            const securePass = authRes.hashedPass;
            if(isLoginMode) {
                const snap = await db.collection('users').where('u', '==', u).where('p', '==', securePass).get();
                if(snap.empty) throw new Error("Sai tài khoản hoặc mật khẩu!");
                localStorage.setItem('nv_current_user', u);
                localStorage.setItem('nv_role', 'user');
                showToast("Chào mừng bạn quay lại!");
                closeAuthModal(); checkAuthState();
            } else {
                await db.collection('users').add({u, p: securePass, ip: await getClientIP(), lastLogin: Date.now()});
                showToast("Đăng ký thành công!"); toggleAuthMode();
            }
        }
    } catch (err) { showToast(err.message, "error"); }
    btn.disabled = false;
    btn.innerHTML = isLoginMode ? "VÀO HỆ THỐNG" : "TẠO TÀI KHOẢN";
}

function handleSearch(q) { 
    const query = q.toLowerCase().trim(); 
    const filtered = gamesDB.filter(g => g.title.toLowerCase().includes(query) || g.genre.toLowerCase().includes(query));
    renderGameGrid(filtered); 
}

function switchView(viewId) {
    localStorage.setItem('nv_current_view', viewId);
    ['homeView', 'detailView', 'adminView', 'profileView'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.toggle('view-active', id === viewId), el.classList.toggle('view-hidden', id !== viewId);
    });
}

function openGameDetail(id) {
    const g = gamesDB.find(x => x.id === id); if(!g) return;
    document.getElementById('detailTitle').innerText = g.title;
    document.getElementById('detailDesc').innerText = g.desc; // ĐÃ SỬA: innerText chống XSS
    document.getElementById('detailCover').src = g.cover;
    switchView('detailView');
}

function checkAuthState() {
    const user = localStorage.getItem('nv_current_user');
    document.getElementById('authContainer').style.display = user ? 'none' : 'flex';
    document.getElementById('userContainer').style.display = user ? 'flex' : 'none';
    if(user) document.getElementById('userNameDisplay').innerText = user;
}

function showToast(msg, type="success") {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `glass-panel px-4 py-2 rounded-xl border ${type==='error'?'border-red-500':'border-cyan-400'} text-white font-bold text-sm mb-2`;
    t.innerText = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function initParticles() {
    const c = document.getElementById("particleCanvas"); if(!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    let p = []; for(let i=0; i<20; i++) p.push({x:Math.random()*c.width, y:Math.random()*c.height, dx:Math.random()-0.5, dy:Math.random()-0.5});
    function animate() {
        ctx.clearRect(0,0,c.width,c.height);
        ctx.fillStyle = "rgba(188, 19, 254, 0.3)";
        p.forEach(i => {
            ctx.beginPath(); ctx.arc(i.x, i.y, 2, 0, Math.PI*2); ctx.fill();
            i.x += i.dx; i.y += i.dy;
            if(i.x<0 || i.x>c.width) i.dx*=-1; if(i.y<0 || i.y>c.height) i.dy*=-1;
        });
        requestAnimationFrame(animate);
    }
    animate();
}

window.onload = initApp;
