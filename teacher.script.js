// Firebase SDK のインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase設定
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

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

function generateDefaultClasses() {
    const classes = [];
    const grades = ['1', '2', '3'];
    const sampleNames = ["佐藤 翔太", "田中 葵", "鈴木 太陽", "高橋 健斗", "伊藤 結衣", "渡辺 拓海", "中村 海斗", "小林 さくら"];
    
    grades.forEach(grade => {
        for (let num = 1; num <= 5; num++) {
            classes.push({
                id: `${grade}-${num}`,
                grade: grade,
                name: `${grade}年${num}組`,
                students: [...sampleNames].sort(() => Math.random() - 0.5).slice(0, 5)
            });
        }
    });
    return classes;
}

const defaultData = {
    profile: {
        name: "田中 先生",
        school: "第一中学校",
        subject: "数学"
    },
    classes: generateDefaultClasses(),
    timetable: [
        { id: 101, day: '月', period: 1, target: '1年1組', subject: '数学', room: '101教室' },
        { id: 102, day: '月', period: 3, target: '2年3組', subject: '数学', room: '203教室' },
        { id: 103, day: '火', period: 2, target: '1年2組', subject: '数学', room: '102教室' },
        { id: 104, day: '火', period: 4, target: '3年5組', subject: '数学', room: '305教室' },
        { id: 105, day: '水', period: 1, target: '1年3組', subject: '数学', room: '103教室' },
        { id: 106, day: '水', period: 5, target: '2年1組', subject: '数学', room: '201教室' },
        { id: 107, day: '木', period: 1, target: '1年1組', subject: '数学', room: '101教室' },
        { id: 108, day: '木', period: 2, target: '2年2組', subject: '数学', room: '202教室' },
        { id: 109, day: '木', period: 4, target: '3年2組', subject: '数学', room: '302教室' },
        { id: 110, day: '金', period: 3, target: '1年5組', subject: '数学', room: '105教室' },
        { id: 111, day: '金', period: 6, target: '3年1組', subject: '数学', room: '301教室' }
    ]
};

let appData = JSON.parse(JSON.stringify(defaultData));
let currentEditClassId = null;
let selectedClassIndex = null;
let selectedStudentIndex = null;
let selectedDay = '木';

// 認証状態の監視
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const bottomNav = document.getElementById('bottom-nav');

    if (user) {
        currentUser = user;
        if (authScreen) authScreen.classList.add('hidden');
        if (bottomNav) bottomNav.style.display = 'flex';
        await loadUserData();
        renderAll();
    } else {
        currentUser = null;
        if (authScreen) authScreen.classList.remove('hidden');
        if (bottomNav) bottomNav.style.display = 'none';
    }
});

window.toggleAuthMode = function() {
    isSignUpMode = !isSignUpMode;
    const desc = document.getElementById('auth-mode-desc');
    const btn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.style.display = 'none';

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

window.handleAuth = async function() {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const errorEl = document.getElementById('auth-error');
    
    if (!emailInput || !passInput) return;
    const email = emailInput.value.trim();
    const password = passInput.value;
    
    if (errorEl) errorEl.style.display = 'none';

    if (!email || !password) {
        if (errorEl) {
            errorEl.textContent = 'メールアドレスとパスワードを入力してください';
            errorEl.style.display = 'block';
        }
        return;
    }

    try {
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            // 新規登録時は初期データをFirestoreに保存する
            await saveData();
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        if (errorEl) {
            errorEl.textContent = 'エラー: ' + error.message;
            errorEl.style.display = 'block';
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
        const docRef = doc(db, "teacher_users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            appData = docSnap.data();
        } else {
            // データがまだなければ初期データを保存
            await saveData();
        }
    } catch (e) {
        console.warn("クラウドからのデータ読み込みをスキップしました（オフライン等）:", e);
    }
}

// Firestoreへのデータ保存
async function saveData() {
    renderAll();
    if (!currentUser) return;
    try {
        await setDoc(doc(db, "teacher_users", currentUser.uid), appData);
    } catch (e) {
        console.error("データ保存失敗:", e);
    }
}

// タブ切り替え（安全対策版）
window.switchTab = function(tabName, btnEl) {
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (!targetTab) return;

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    targetTab.classList.add('active');

    if (btnEl) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        btnEl.classList.add('active');
    }
}

function renderDatesHeader() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayOfWeek = dayNames[today.getDay()];
    
    const dateDisplay = document.getElementById('today-date-display');
    if (dateDisplay) dateDisplay.innerText = `${month}月${date}日 (${dayOfWeek})`;

    const nextDaysContainer = document.getElementById('next-days-container');
    if (!nextDaysContainer) return;
    nextDaysContainer.innerHTML = '';

    for (let i = 1; i <= 4; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);

        const nMonth = nextDate.getMonth() + 1;
        const nDate = nextDate.getDate();
        const nDayOfWeek = dayNames[nextDate.getDay()];

        const item = document.createElement('div');
        item.className = 'next-day-item';
        item.innerHTML = `
            <div class="next-day-label">${nDayOfWeek}曜</div>
            <div class="next-day-date">${nMonth}/${nDate}</div>
        `;
        nextDaysContainer.appendChild(item);
    }

    if (dayOfWeek !== '土' && dayOfWeek !== '日') {
        selectedDay = dayOfWeek;
    }
}

function renderAll() {
    renderDatesHeader();

    const bannerTeacher = document.getElementById('banner-teacher');
    if (bannerTeacher) bannerTeacher.innerText = appData.profile.name;
    const bannerSchool = document.getElementById('banner-school');
    if (bannerSchool) bannerSchool.innerText = appData.profile.school;
    const bannerSubject = document.getElementById('banner-subject');
    if (bannerSubject) bannerSubject.innerText = appData.profile.subject;
    
    const settingName = document.getElementById('setting-name');
    if (settingName) settingName.value = appData.profile.name;
    const settingSchool = document.getElementById('setting-school');
    if (settingSchool) settingSchool.value = appData.profile.school;
    const settingSubject = document.getElementById('setting-subject');
    if (settingSubject) settingSubject.value = appData.profile.subject;

    renderWeeklyTable();
    renderDayClassList(selectedDay);
    renderClassGrid();
    updateTargetDropdowns();

    if (window.lucide) {
        lucide.createIcons();
    }
}

function renderWeeklyTable() {
    const days = ['月', '火', '水', '木', '金'];
    const tbody = document.getElementById('weekly-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    days.forEach(d => {
        const th = document.getElementById(`th-${d}`);
        if (th) {
            if (d === selectedDay) th.classList.add('today-col');
            else th.classList.remove('today-col');
        }
    });

    for (let p = 1; p <= 6; p++) {
        const tr = document.createElement('tr');
        const tdP = document.createElement('td');
        tdP.className = 'period-num';
        tdP.innerText = `${p}`;
        tr.appendChild(tdP);

        days.forEach(d => {
            const td = document.createElement('td');
            const item = appData.timetable.find(t => t.day === d && t.period === p);

            const cell = document.createElement('div');
            if (item) {
                cell.className = 'weekly-cell has-item';
                cell.onclick = () => openClassModal(item.id);
                cell.innerHTML = `
                    <div class="weekly-cell-target">${item.target}</div>
                    <div class="weekly-cell-subject">${item.subject}</div>
                `;
            } else {
                cell.className = 'weekly-cell';
                cell.onclick = () => openClassModalForSlot(d, p);
                cell.innerHTML = `<i data-lucide="plus" class="icon-line-sm" style="color:#cbd5e1;"></i>`;
            }
            td.appendChild(cell);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
}

function renderDayClassList(day) {
    selectedDay = day;
    const listTitle = document.getElementById('day-list-title');
    if (listTitle) {
        listTitle.innerHTML = `<i data-lucide="list-checks" class="icon-line" style="color:#2563eb;"></i> ${day}曜日の授業一覧`;
    }

    const listContainer = document.getElementById('day-classes-list');
    if (!listContainer) return;

    const dayClasses = appData.timetable.filter(t => t.day === day).sort((a,b) => a.period - b.period);

    let html = '';
    dayClasses.forEach(item => {
        const pClass = `p-${item.period}`;
        html += `
            <div class="class-card" onclick="openClassModal(${item.id})">
                <div class="period-tag ${pClass}">${item.period}限</div>
                <div class="class-details">
                    <div>
                        <span class="class-target">${item.target}</span>
                        <span class="class-subject">${item.subject}</span>
                    </div>
                    <div class="class-time">${item.room}</div>
                </div>
                <span class="edit-badge"><i data-lucide="pencil" class="icon-line-sm"></i> 編集</span>
            </div>
        `;
    });
    listContainer.innerHTML = html || `<p style="text-align:center; color:#94a3b8; padding:16px; background:white; border-radius:12px;">${day}曜日に登録された授業はありません</p>`;
    if (window.lucide) lucide.createIcons();
}

window.openClassModalForSlot = function(day, period) {
    openClassModal(null, day, period);
}

window.openClassModal = function(id = null, defaultDay = '月', defaultPeriod = 1) {
    currentEditClassId = id;
    if (id) {
        const item = appData.timetable.find(t => t.id === id);
        document.getElementById('modal-class-title').innerText = "授業の編集";
        document.getElementById('edit-day').value = item.day;
        document.getElementById('edit-period').value = item.period;
        document.getElementById('edit-target').value = item.target;
        document.getElementById('edit-subject').value = item.subject;
        document.getElementById('edit-room').value = item.room;
        document.getElementById('btn-delete-class').style.display = "block";
    } else {
        document.getElementById('modal-class-title').innerText = "授業の登録";
        document.getElementById('edit-day').value = defaultDay;
        document.getElementById('edit-period').value = defaultPeriod;
        document.getElementById('edit-target').value = appData.classes[0]?.name || "1年1組";
        document.getElementById('edit-subject').value = appData.profile.subject;
        document.getElementById('edit-room').value = "101教室";
        document.getElementById('btn-delete-class').style.display = "none";
    }
    document.getElementById('modal-class').style.display = "flex";
    if (window.lucide) lucide.createIcons();
}

window.saveClass = function() {
    const day = document.getElementById('edit-day').value;
    const period = parseInt(document.getElementById('edit-period').value);
    const target = document.getElementById('edit-target').value;
    const subject = document.getElementById('edit-subject').value || "教科";
    const room = document.getElementById('edit-room').value || "教室";

    if (currentEditClassId) {
        const idx = appData.timetable.findIndex(t => t.id === currentEditClassId);
        appData.timetable[idx] = { id: currentEditClassId, day, period, target, subject, room };
    } else {
        appData.timetable.push({ id: Date.now(), day, period, target, subject, room });
    }

    selectedDay = day;
    saveData();
    closeModal('modal-class');
}

window.deleteClass = function() {
    if (confirm('この授業を削除しますか？')) {
        appData.timetable = appData.timetable.filter(t => t.id !== currentEditClassId);
        saveData();
        closeModal('modal-class');
    }
}

window.filterGrade = function(grade, btn) {
    btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderClassGrid(grade);
}

function renderClassGrid(gradeFilter = 'all') {
    const container = document.getElementById('class-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const list = gradeFilter === 'all' ? appData.classes : appData.classes.filter(c => c.grade === gradeFilter);
    list.forEach((c) => {
        const originalIndex = appData.classes.findIndex(cls => cls.id === c.id);
        const box = document.createElement('div');
        box.className = 'class-box';
        box.onclick = () => openStudentList(originalIndex);
        box.innerHTML = `
            <div class="class-box-name">${c.name}</div>
            <div class="class-box-count">生徒数: ${c.students.length}人</div>
        `;
        container.appendChild(box);
    });
}

window.openAddClassModal = function() {
    document.getElementById('new-class-name').value = '';
    document.getElementById('modal-add-class').style.display = 'flex';
}

window.saveNewClass = function() {
    const grade = document.getElementById('new-class-grade').value;
    const name = document.getElementById('new-class-name').value || `${grade}年新規組`;
    appData.classes.push({ id: Date.now().toString(), grade, name, students: [] });
    saveData();
    closeModal('modal-add-class');
}

function updateTargetDropdowns() {
    const selectClass = document.getElementById('edit-target');
    const selectNotice = document.getElementById('notice-target-select');
    if (!selectClass || !selectNotice) return;
    
    selectClass.innerHTML = '';
    selectNotice.innerHTML = '<option value="学年全体">学年全体</option>';

    appData.classes.forEach(c => {
        selectClass.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        selectNotice.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
}

window.openStudentList = function(classIdx) {
    selectedClassIndex = classIdx;
    const targetClass = appData.classes[classIdx];
    document.getElementById('student-class-title').innerText = `${targetClass.name} 名簿`;

    const container = document.getElementById('student-list-container');
    container.innerHTML = '';

    targetClass.students.forEach((sName, sIdx) => {
        const item = document.createElement('div');
        item.className = 'student-item';
        item.onclick = () => openStudentModal(sIdx);
        item.innerHTML = `
            <span class="student-num">${sIdx + 1}</span>
            <span class="student-name">${sName}</span>
            <span class="edit-badge"><i data-lucide="pencil" class="icon-line-sm"></i> 編集</span>
        `;
        container.appendChild(item);
    });

    if (targetClass.students.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">生徒が登録されていません</p>';
    }

    switchTab('students');
    if (window.lucide) lucide.createIcons();
}

window.openAddStudentModal = function() {
    openStudentModal(null);
}

window.openStudentModal = function(sIdx = null) {
    selectedStudentIndex = sIdx;
    if (sIdx !== null) {
        document.getElementById('modal-student-title').innerText = "生徒名の編集";
        document.getElementById('student-name-input').value = appData.classes[selectedClassIndex].students[sIdx];
        document.getElementById('btn-delete-student').style.display = "block";
    } else {
        document.getElementById('modal-student-title').innerText = "生徒の追加";
        document.getElementById('student-name-input').value = "";
        document.getElementById('btn-delete-student').style.display = "none";
    }
    document.getElementById('modal-student').style.display = "flex";
}

window.saveStudent = function() {
    const name = document.getElementById('student-name-input').value;
    if (!name) return;

    if (selectedStudentIndex !== null) {
        appData.classes[selectedClassIndex].students[selectedStudentIndex] = name;
    } else {
        appData.classes[selectedClassIndex].students.push(name);
    }

    saveData();
    openStudentList(selectedClassIndex);
    closeModal('modal-student');
}

window.deleteStudent = function() {
    if (confirm('この生徒を削除しますか？')) {
        appData.classes[selectedClassIndex].students.splice(selectedStudentIndex, 1);
        saveData();
        openStudentList(selectedClassIndex);
        closeModal('modal-student');
    }
}

window.saveSettings = function() {
    appData.profile.name = document.getElementById('setting-name').value;
    appData.profile.school = document.getElementById('setting-school').value;
    appData.profile.subject = document.getElementById('setting-subject').value;
    saveData();
    alert('プロフィールを保存しました！');
    switchTab('home');
}

window.resetAllData = function() {
    if (confirm('初期データに戻しますか？')) {
        appData = JSON.parse(JSON.stringify(defaultData));
        saveData();
        alert('初期化完了しました！');
    }
}

window.sendNotice = function() {
    const title = document.getElementById('notice-title').value;
    if (!title) {
        alert('件名を入力してください');
        return;
    }
    alert('連絡を送信しました！');
    document.getElementById('notice-title').value = '';
    document.getElementById('notice-body').value = '';
    switchTab('home');
}

window.closeModal = function(id) {
    document.getElementById(id).style.display = "none";
}