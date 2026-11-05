// Firebase SDK のインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase設定（最新の正確な設定）
const firebaseConfig = {
    apiKey: "AIzaSyBthuDcJkxPQNzYTxh6TWiO45fKV-WNiHE",
    authDomain: "my-timetable-app-cd3b3.firebaseapp.com",
    projectId: "my-timetable-app-cd3b3",
    storageBucket: "my-timetable-app-cd3b3.firebasestorage.app",
    messagingSenderId: "1021970249631",
    appId: "1:1021970249631:web:1196770af0f8e55180afaa"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isSignUpMode = false;
let activeTab = 'home';
let selectedDay = '月';

const days = ['月', '火', '水', '木', '金'];
const dayFullName = { '月': '月曜日', '火': '火曜日', '水': '水曜日', '木': '木曜日', '金': '金曜日' };

// 初期データ構造
const defaultData = {
    timetable: {
        '月': [
            { period: 1, subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue' },
            { period: 2, subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green' },
            { period: 3, subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange' },
            { period: 4, subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple' },
        ],
        '火': [], '水': [], '木': [], '金': []
    },
    items: [
        { id: 1, text: '国語の教科書・ノート', checked: false },
        { id: 2, text: '体操服（体育用）', checked: false }
    ],
    tasks: [
        { id: 1, title: '数学ワーク P.20-25', date: '2026-10-25', done: false }
    ]
};

let appData = JSON.parse(JSON.stringify(defaultData));

// 認証状態の監視
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const bottomNav = document.getElementById('bottom-nav');

    if (user) {
        currentUser = user;
        if (authScreen) authScreen.classList.add('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
        await loadUserData();
        renderApp();
    } else {
        currentUser = null;
        if (authScreen) authScreen.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');
    }
});

// ログイン／新規登録の切り替え
window.toggleAuthMode = function() {
    isSignUpMode = !isSignUpMode;
    const desc = document.getElementById('auth-mode-desc');
    const btn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.classList.add('hidden');

    if (isSignUpMode) {
        if (desc) desc.textContent = '新規アカウントを作成して始めよう';
        if (btn) btn.textContent = '新規登録';
        if (toggleBtn) toggleBtn.textContent = 'すでにアカウントをお持ちの方はこちら（ログイン）';
    } else {
        if (desc) desc.textContent = 'ログインしてデータをクラウドに同期しよう';
        if (btn) btn.textContent = 'ログイン';
        if (toggleBtn) toggleBtn.textContent = 'アカウントをお持ちでない方は新規登録';
    }
};

// ログイン・登録処理
window.handleAuth = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.classList.add('hidden');

    if (!email || !password) {
        if (errorEl) {
            errorEl.textContent = 'メールアドレスとパスワードを入力してください';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    try {
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            await saveData();
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        if (errorEl) {
            errorEl.textContent = 'エラー: ' + error.message;
            errorEl.classList.remove('hidden');
        }
    }
};

window.handleLogout = async function() {
    await signOut(auth);
};

// Firestoreからのデータ読み込み
async function loadUserData() {
    if (!currentUser) return;
    try {
        const docRef = doc(db, "student_users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            appData = docSnap.data();
        } else {
            await saveData();
        }
    } catch (e) {
        console.warn("データ読み込みスキップ:", e);
    }
}

// Firestoreへのデータ保存
async function saveData() {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, "student_users", currentUser.uid), appData);
    } catch (e) {
        console.error("データ保存失敗:", e);
    }
}

// タブ切り替え
window.switchTab = function(tabName) {
    activeTab = tabName;
    ['home', 'timetable', 'tasks', 'settings'].forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.className = 'flex flex-col items-center text-blue-500 transition-all';
            } else {
                btn.className = 'flex flex-col items-center text-slate-400 transition-all';
            }
        }
    });
    renderApp();
};

// 全体レンダリング
window.renderApp = function() {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (activeTab === 'home') {
        renderHome(main);
    } else if (activeTab === 'timetable') {
        renderTimetable(main);
    } else if (activeTab === 'tasks') {
        renderTasks(main);
    } else if (activeTab === 'settings') {
        renderSettings(main);
    }
};

// --- ホーム画面 ---
function renderHome(main) {
    const todayLessons = appData.timetable[selectedDay] || [];
    
    let html = `
        <div class="p-5 space-y-5">
            <!-- ヘッダー -->
            <div class="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h2 class="text-xs font-bold text-slate-400">今日のおすすめ</h2>
                    <h1 class="text-lg font-extrabold text-slate-700">時間割 ＆ 持ち物チェック</h1>
                </div>
                <div class="bg-blue-50 text-blue-600 font-extrabold px-3 py-1.5 rounded-2xl text-xs">
                    ${selectedDay}曜日
                </div>
            </div>

            <!-- 持ち物チェック -->
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-extrabold text-slate-700 flex items-center gap-2 text-sm">
                        <i class="fa-solid fa-list-check text-blue-500"></i> 今日の持ち物
                    </h3>
                    <button onclick="openItemsModal()" class="text-xs text-blue-500 font-bold hover:underline">編集</button>
                </div>
                <div class="space-y-2">
    `;

    if (appData.items.length === 0) {
        html += `<p class="text-xs text-slate-400 text-center py-2">持ち物は登録されていません</p>`;
    } else {
        appData.items.forEach(item => {
            html += `
                <div onclick="toggleItem(${item.id})" class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 cursor-pointer">
                    <i class="fa-${item.checked ? 'solid fa-circle-check text-blue-500' : 'regular fa-circle text-slate-300'} text-lg"></i>
                    <span class="text-xs font-bold ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}">${item.text}</span>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>

            <!-- 今日の授業 -->
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h3 class="font-extrabold text-slate-700 flex items-center gap-2 text-sm mb-3">
                    <i class="fa-solid fa-clock text-blue-500"></i> 今日の授業一覧
                </h3>
                <div class="space-y-2.5">
    `;

    if (todayLessons.length === 0) {
        html += `<p class="text-xs text-slate-400 text-center py-4">授業は登録されていません</p>`;
    } else {
        todayLessons.sort((a,b) => a.period - b.period).forEach(l => {
            html += `
                <div class="p-3.5 rounded-2xl border theme-${l.color || 'blue'} flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <span class="w-7 h-7 rounded-xl bg-white/80 font-black text-xs text-slate-600 flex items-center justify-center">${l.period}</span>
                        <div>
                            <div class="font-extrabold text-slate-800 text-sm">${l.subject}</div>
                            <div class="text-[11px] font-bold text-slate-400">${l.teacher || '未設定'} / ${l.room || '未設定'}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `
                </div>
            </div>
        </div>
    `;

    main.innerHTML = html;
}

// --- 時間割画面 ---
function renderTimetable(main) {
    let html = `
        <div class="p-5 space-y-4">
            <h2 class="text-lg font-extrabold text-slate-700">週間時間割</h2>
            <!-- 曜日タブ -->
            <div class="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
    `;

    days.forEach(d => {
        const isSel = (d === selectedDay);
        html += `
            <button onclick="changeDay('${d}')" class="flex-1 py-2 rounded-xl text-xs font-black transition-all ${isSel ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400'}">${d}</button>
        `;
    });

    html += `
            </div>

            <div class="space-y-3">
    `;

    for (let p = 1; p <= 6; p++) {
        const lesson = (appData.timetable[selectedDay] || []).find(l => l.period === p);
        if (lesson) {
            html += `
                <div onclick="openLessonModal('${selectedDay}', ${p})" class="p-4 rounded-2xl border theme-${lesson.color || 'blue'} flex justify-between items-center cursor-pointer shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-xl bg-white/80 font-black text-sm text-slate-700 flex items-center justify-center">${p}</span>
                        <div>
                            <div class="font-black text-slate-800 text-sm">${lesson.subject}</div>
                            <div class="text-xs text-slate-400 font-bold">${lesson.teacher || ''} ${lesson.room ? '('+lesson.room+')' : ''}</div>
                        </div>
                    </div>
                    <i class="fa-solid fa-angle-right text-slate-300"></i>
                </div>
            `;
        } else {
            html += `
                <div onclick="openLessonModal('${selectedDay}', ${p})" class="p-4 rounded-2xl border border-dashed border-slate-200 bg-white/50 flex justify-between items-center cursor-pointer">
                    <div class="flex items-center gap-3 text-slate-300">
                        <span class="w-8 h-8 rounded-xl bg-slate-100 font-black text-sm text-slate-400 flex items-center justify-center">${p}</span>
                        <span class="text-xs font-bold">空きコマ (タップして追加)</span>
                    </div>
                    <i class="fa-solid fa-plus text-slate-300"></i>
                </div>
            `;
        }
    }

    html += `</div></div>`;
    main.innerHTML = html;
}

window.changeDay = function(d) {
    selectedDay = d;
    renderApp();
};

// --- 課題画面 ---
function renderTasks(main) {
    let html = `
        <div class="p-5 space-y-4">
            <h2 class="text-lg font-extrabold text-slate-700">課題・宿題</h2>
            
            <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-2">
                <input type="text" id="new-task-title" placeholder="課題名・提出物..." class="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold border-none outline-none">
                <button onclick="addTask()" class="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md">追加</button>
            </div>

            <div class="space-y-2">
    `;

    if (appData.tasks.length === 0) {
        html += `<p class="text-xs text-slate-400 text-center py-6">課題はありません 🎉</p>`;
    } else {
        appData.tasks.forEach(t => {
            html += `
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div onclick="toggleTask(${t.id})" class="flex items-center gap-3 cursor-pointer flex-1">
                        <i class="fa-${t.done ? 'solid fa-circle-check text-blue-500' : 'regular fa-circle text-slate-300'} text-lg"></i>
                        <span class="text-xs font-bold ${t.done ? 'line-through text-slate-300' : 'text-slate-700'}">${t.title}</span>
                    </div>
                    <button onclick="deleteTask(${t.id})" class="text-slate-300 hover:text-red-400 p-1"><i class="fa-solid fa-trash-can text-sm"></i></button>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    main.innerHTML = html;
}

window.addTask = function() {
    const input = document.getElementById('new-task-title');
    if (!input || !input.value.trim()) return;
    appData.tasks.push({ id: Date.now(), title: input.value.trim(), done: false });
    input.value = '';
    saveData();
    renderApp();
};

window.toggleTask = function(id) {
    const t = appData.tasks.find(x => x.id === id);
    if (t) {
        t.done = !t.done;
        saveData();
        renderApp();
    }
};

window.deleteTask = function(id) {
    appData.tasks = appData.tasks.filter(x => x.id !== id);
    saveData();
    renderApp();
};

// --- その他/設定画面 ---
function renderSettings(main) {
    main.innerHTML = `
        <div class="p-5 space-y-4">
            <h2 class="text-lg font-extrabold text-slate-700">その他</h2>
            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div class="text-xs font-bold text-slate-500">アカウント情報</div>
                <div class="text-sm font-extrabold text-slate-700">${currentUser ? currentUser.email : ''}</div>
                <button onclick="handleLogout()" class="w-full bg-red-50 text-red-500 font-extrabold py-3 rounded-2xl text-xs mt-2">ログアウト</button>
            </div>
        </div>
    `;
}

// モーダル操作
window.openLessonModal = function(day, period) {
    document.getElementById('modal-day').value = day;
    document.getElementById('modal-period').value = period;
    
    const lesson = (appData.timetable[day] || []).find(l => l.period === period);
    document.getElementById('modal-subject').value = lesson ? lesson.subject : '';
    document.getElementById('modal-teacher').value = lesson ? lesson.teacher : '';
    document.getElementById('modal-room').value = lesson ? lesson.room : '';
    document.getElementById('modal-color').value = lesson ? lesson.color : 'blue';

    document.getElementById('lesson-modal').classList.remove('hidden');
};

window.saveLesson = function() {
    const day = document.getElementById('modal-day').value;
    const period = parseInt(document.getElementById('modal-period').value);
    const subject = document.getElementById('modal-subject').value.trim();
    const teacher = document.getElementById('modal-teacher').value.trim();
    const room = document.getElementById('modal-room').value.trim();
    const color = document.getElementById('modal-color').value;

    if (!appData.timetable[day]) appData.timetable[day] = [];
    appData.timetable[day] = appData.timetable[day].filter(l => l.period !== period);

    if (subject) {
        appData.timetable[day].push({ period, subject, teacher, room, color });
    }

    saveData();
    closeModal('lesson-modal');
    renderApp();
};

window.openItemsModal = function() {
    renderModalItems();
    document.getElementById('items-modal').classList.remove('hidden');
};

function renderModalItems() {
    const list = document.getElementById('modal-items-list');
    if (!list) return;
    list.innerHTML = '';
    appData.items.forEach(item => {
        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span class="text-xs font-bold text-slate-700">${item.text}</span>
                <button onclick="deleteItem(${item.id})" class="text-red-400 font-bold text-xs"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });
}

window.addQuickItem = function() {
    const input = document.getElementById('new-item-input');
    if (!input || !input.value.trim()) return;
    appData.items.push({ id: Date.now(), text: input.value.trim(), checked: false });
    input.value = '';
    saveData();
    renderModalItems();
};

window.deleteItem = function(id) {
    appData.items = appData.items.filter(i => i.id !== id);
    saveData();
    renderModalItems();
};

window.toggleItem = function(id) {
    const item = appData.items.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        saveData();
        renderApp();
    }
};

window.closeModal = function(id) {
    document.getElementById(id).classList.add('hidden');
};