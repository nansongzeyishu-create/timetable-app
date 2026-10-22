const defaultTimetable = {
    '月': [
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green'},
        {subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange'},
        {subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple'},
        {subject: '社会', teacher: '渡辺先生', room: '3年2組', color: 'pink'},
        {subject: '体育', teacher: '伊藤先生', room: '体育館', color: 'yellow'}
    ],
    '火': [
        {subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green'},
        {subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange'},
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '体育', teacher: '伊藤先生', room: '体育館', color: 'yellow'},
        {subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple'},
        {subject: '社会', teacher: '渡辺先生', room: '3年2組', color: 'pink'}
    ],
    '水': [
        {subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange'},
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '体育', teacher: '伊藤先生', room: '体育館', color: 'yellow'},
        {subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green'},
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple'}
    ],
    '木': [
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green'},
        {subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange'},
        {subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple'},
        {subject: '社会', teacher: '渡辺先生', room: '3年2組', color: 'pink'},
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'}
    ],
    '金': [
        {subject: '社会', teacher: '渡辺先生', room: '3年2組', color: 'pink'},
        {subject: '理科', teacher: '高橋先生', room: '理科室', color: 'purple'},
        {subject: '数学', teacher: '鈴木先生', room: '3年2組', color: 'green'},
        {subject: '国語', teacher: '佐藤先生', room: '3年2組', color: 'blue'},
        {subject: '体育', teacher: '伊藤先生', room: '体育館', color: 'yellow'},
        {subject: '英語', teacher: '田中先生', room: '3年2組', color: 'orange'}
    ]
};

const periodTimes = [
    { period: '1限', start: '09:05', end: '09:55' },
    { period: '2限', start: '10:05', end: '10:55' },
    { period: '3限', start: '11:05', end: '11:55' },
    { type: 'lunch', name: '昼休み', start: '11:55', end: '12:30' },
    { period: '4限', start: '12:30', end: '13:20' },
    { period: '5限', start: '13:30', end: '14:20' },
    { period: '6限', start: '14:30', end: '15:20' }
];

let currentTab = 'home';
let selectedDayForTimetable = '木';

let timetableData = JSON.parse(localStorage.getItem('timetable_data')) || defaultTimetable;
let quickItems = JSON.parse(localStorage.getItem('quick_items')) || [
    { text: '体育着', checked: false },
    { text: '筆記用具', checked: true },
    { text: '数学の教科書・ノート', checked: false }
];
let tasks = JSON.parse(localStorage.getItem('tasks_data')) || [
    { title: '数学 ワークP30〜32', limit: '明日まで', done: false },
    { title: '英語 単語プリント暗記', limit: '10月10日まで', done: true }
];
let userProfile = JSON.parse(localStorage.getItem('user_profile')) || {
    name: '山田 太郎',
    school: '〇〇中学校',
    grade: '3年2組'
};

function saveData() {
    localStorage.setItem('timetable_data', JSON.stringify(timetableData));
    localStorage.setItem('quick_items', JSON.stringify(quickItems));
    localStorage.setItem('tasks_data', JSON.stringify(tasks));
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
}

function switchTab(tab) {
    currentTab = tab;
    ['home', 'timetable', 'tasks', 'settings'].forEach(t => {
        const btn = document.getElementById('nav-' + t);
        if (btn) {
            if (t === tab) {
                btn.classList.remove('text-slate-400');
                btn.classList.add('text-blue-500');
            } else {
                btn.classList.remove('text-blue-500');
                btn.classList.add('text-slate-400');
            }
        }
    });
    renderApp();
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
}

function renderApp() {
    const container = document.getElementById('main-content');
    if (!container) return;
    if (currentTab === 'home') container.innerHTML = renderHome();
    else if (currentTab === 'timetable') container.innerHTML = renderTimetableTab();
    else if (currentTab === 'tasks') container.innerHTML = renderTasksTab();
    else if (currentTab === 'settings') container.innerHTML = renderSettingsTab();
}

function renderHome() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const daysArr = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeekStr = daysArr[now.getDay()];

    let dayKey = dayOfWeekStr;
    if (!timetableData[dayKey]) dayKey = '木';

    const lessons = timetableData[dayKey];
    const currentStatus = getCurrentLessonStatus();

    let html = '<div class="p-5">';
    html += '<div class="flex justify-between items-center mb-4">';
    html += '<div>';
    html += '<div class="flex items-center gap-2"><span class="text-2xl">☀️</span><h1 class="text-xl font-bold text-slate-700">おはよう！ ' + userProfile.name + '</h1></div>';
    html += '<p class="text-sm text-slate-500 font-medium mt-0.5">' + month + '月' + date + '日（' + dayOfWeekStr + '）</p>';
    html += '</div>';
    html += '<div class="flex items-center gap-2"><span class="text-2xl">🐱</span></div>';
    html += '</div>';

    html += '<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20 mb-6 relative overflow-hidden">';
    html += '<div class="absolute -right-6 -bottom-6 text-white/10 text-9xl font-extrabold pointer-events-none"><i class="fa-solid fa-graduation-cap"></i></div>';
    html += '<div class="flex justify-between items-start mb-2"><span class="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">' + currentStatus.badge + '</span><span class="text-xs font-medium opacity-90">' + currentStatus.timeRange + '</span></div>';
    html += '<div class="my-2"><h2 class="text-2xl font-extrabold tracking-wide">' + currentStatus.title + '</h2><p class="text-sm opacity-90 mt-1">' + currentStatus.subtitle + '</p></div>';
    html += '<div class="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs font-bold"><span>' + currentStatus.footerText + '</span><span>' + userProfile.grade + '</span></div>';
    html += '</div>';

    html += '<div class="flex items-center gap-2 mb-3"><i class="fa-solid fa-book-open text-blue-500"></i><h2 class="text-base font-bold text-slate-700">今日の時間割 (' + dayKey + '曜)</h2></div>';
    html += '<div class="space-y-3 mb-6">';
    
    lessons.forEach((lesson, idx) => {
        const pTime = periodTimes[idx];
        const isNow = currentStatus.activeIdx === idx;
        const isNext = currentStatus.nextIdx === idx;
        const themeClass = 'theme-' + (lesson.color || 'blue');

        html += '<div class="p-3.5 rounded-2xl border-2 ' + themeClass + ' flex items-center gap-3 transition-all ' + (isNow ? 'ring-4 ring-blue-400/30 scale-[1.02]' : '') + '">';
        html += '<div class="bg-white/80 backdrop-blur-sm px-3 py-2.5 rounded-xl text-center min-w-[50px] shadow-sm"><span class="text-xs font-bold text-slate-400 block leading-none">第</span><span class="text-base font-extrabold text-slate-700 leading-none">' + (idx + 1) + '</span></div>';
        html += '<div class="flex-1">';
        html += '<div class="flex justify-between items-center"><h3 class="text-base font-bold text-slate-800">' + (lesson.subject || '（未設定）') + '</h3>';
        if (isNow) html += '<span class="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">授業中</span>';
        if (isNext) html += '<span class="text-blue-600 text-xs font-bold">次の授業 ➔</span>';
        html += '</div>';
        html += '<p class="text-xs text-slate-500 mt-0.5">' + pTime.start + ' ~ ' + pTime.end + ' | ' + (lesson.teacher || '') + ' ' + (lesson.room || '') + '</p>';
        html += '</div></div>';
    });
    
    html += '</div>';

    html += '<div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">';
    html += '<div class="flex justify-between items-center mb-3"><h3 class="text-sm font-bold text-slate-700 flex items-center gap-2"><i class="fa-solid fa-list-check text-blue-500"></i> 今日の持ち物クイック確認</h3>';
    html += '<button onclick="openItemsModal()" class="text-xs font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition"><i class="fa-solid fa-pen"></i> 編集</button></div>';
    html += '<div class="space-y-2">';
    
    quickItems.forEach((item, i) => {
        html += '<label class="flex items-center gap-3 text-sm cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-50 transition">';
        html += '<input type="checkbox" ' + (item.checked ? 'checked' : '') + ' onchange="toggleQuickItem(' + i + ')" class="w-4 h-4 text-blue-500 rounded border-slate-300">';
        html += '<span class="' + (item.checked ? 'line-through text-slate-400' : 'text-slate-700') + ' font-medium">' + item.text + '</span>';
        html += '</label>';
    });

    html += '</div></div></div>';
    return html;
}

function renderTimetableTab() {
    const days = ['月', '火', '水', '木', '金'];
    const lessons = timetableData[selectedDayForTimetable];

    let html = '<div class="p-5">';
    html += '<h1 class="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><i class="fa-solid fa-calendar-days text-blue-500"></i> 一週間時間割</h1>';
    html += '<div class="flex bg-slate-200/70 p-1 rounded-2xl mb-5">';
    
    days.forEach(d => {
        html += '<button onclick="selectedDayForTimetable=\'' + d + '\'; renderApp();" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all ' + (selectedDayForTimetable === d ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500') + '">' + d + '曜日</button>';
    });
    
    html += '</div><div class="space-y-3">';

    lessons.forEach((lesson, idx) => {
        const pTime = periodTimes[idx];
        const themeClass = 'theme-' + (lesson.color || 'blue');
        html += '<div onclick="openLessonModal(\'' + selectedDayForTimetable + '\', ' + idx + ')" class="p-4 rounded-2xl border-2 ' + themeClass + ' flex items-center justify-between cursor-pointer hover:shadow-md transition-all">';
        html += '<div class="flex items-center gap-3">';
        html += '<div class="bg-white/85 px-3 py-2 rounded-xl text-center min-w-[50px] shadow-sm"><span class="text-[10px] font-bold text-slate-400 block leading-none">第</span><span class="text-sm font-extrabold text-slate-700 leading-none">' + (idx + 1) + '</span></div>';
        html += '<div><h3 class="text-base font-bold text-slate-800">' + (lesson.subject || '（タップして設定）') + '</h3><p class="text-xs text-slate-500 mt-0.5">' + pTime.start + ' ~ ' + pTime.end + ' | ' + (lesson.teacher || '先生未設定') + ' ' + (lesson.room || '') + '</p></div>';
        html += '</div><i class="fa-solid fa-chevron-right text-slate-400 text-sm mr-1"></i></div>';
    });

    html += '</div></div>';
    return html;
}

function renderTasksTab() {
    let html = '<div class="p-5">';
    html += '<div class="flex justify-between items-center mb-4"><h1 class="text-xl font-bold text-slate-700 flex items-center gap-2"><i class="fa-solid fa-square-check text-blue-500"></i> 課題・宿題管理</h1></div>';
    html += '<div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-5">';
    html += '<h3 class="text-xs font-bold text-slate-500 mb-2">新しい課題を追加</h3>';
    html += '<div class="space-y-2"><input type="text" id="task-title-input" placeholder="課題の内容（例: 数学プリントP10）" class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none outline-none">';
    html += '<div class="flex gap-2"><input type="text" id="task-limit-input" placeholder="期限（例: 明日まで）" class="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-sm border-none outline-none">';
    html += '<button onclick="addTask()" class="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm">追加</button></div></div></div>';

    html += '<div class="space-y-3">';
    tasks.forEach((task, i) => {
        html += '<div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">';
        html += '<label class="flex items-center gap-3 cursor-pointer flex-1">';
        html += '<input type="checkbox" ' + (task.done ? 'checked' : '') + ' onchange="toggleTask(' + i + ')" class="w-5 h-5 text-blue-500 rounded border-slate-300">';
        html += '<div><p class="text-sm font-bold ' + (task.done ? 'line-through text-slate-400' : 'text-slate-700') + '">' + task.title + '</p><p class="text-xs text-slate-400 mt-0.5"><i class="fa-regular fa-clock"></i> 期限: ' + task.limit + '</p></div>';
        html += '</label><button onclick="deleteTask(' + i + ')" class="text-slate-300 hover:text-red-400 p-2"><i class="fa-solid fa-trash-can text-sm"></i></button></div>';
    });
    html += '</div></div>';
    return html;
}

function renderSettingsTab() {
    const days = ['月', '火', '水', '木', '金'];
    let html = '<div class="p-5">';
    html += '<h1 class="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><i class="fa-solid fa-table-cells text-blue-500"></i> 一週間の時間割一覧表</h1>';
    html += '<div class="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mb-6 overflow-x-auto">';
    html += '<table class="w-full text-center text-xs"><thead><tr class="border-b border-slate-100 text-slate-400 font-bold"><th class="py-2">時限</th>';
    
    days.forEach(d => { html += '<th class="py-2">' + d + '</th>'; });
    html += '</tr></thead><tbody class="divide-y divide-slate-50">';

    [0, 1, 2, 3, 4, 5].forEach(pIdx => {
        html += '<tr><td class="py-2.5 font-bold text-slate-400 bg-slate-50/50">' + (pIdx + 1) + '限</td>';
        days.forEach(d => {
            const sub = (timetableData[d] && timetableData[d][pIdx] && timetableData[d][pIdx].subject) ? timetableData[d][pIdx].subject : '-';
            html += '<td class="py-2.5 font-bold text-slate-700 px-1 truncate max-w-[60px]">' + sub + '</td>';
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">';
    html += '<h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><i class="fa-solid fa-user-gear text-blue-500"></i> プロフィール設定</h3>';
    html += '<div class="space-y-3">';
    html += '<div><label class="text-xs font-bold text-slate-400 mb-1 block">お名前</label><input type="text" id="setting-name" value="' + userProfile.name + '" onchange="updateProfile()" class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none"></div>';
    html += '<div><label class="text-xs font-bold text-slate-400 mb-1 block">学校名</label><input type="text" id="setting-school" value="' + userProfile.school + '" onchange="updateProfile()" class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm outline-none"></div>';
    html += '<div><label class="text-xs font-bold text-slate-400 mb-1 block">学年・クラス</label><input type="text" id="setting-grade" value="' + userProfile.grade + '" onchange="updateProfile()" class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm outline-none"></div>';
    html += '</div></div></div>';
    return html;
}

function getCurrentLessonStatus() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const toMin = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    let activeIdx = -1;
    let nextIdx = -1;
    let title = '放課後・自由時間';
    let subtitle = '今日の授業はすべて終了しました';
    let badge = 'リラックス';
    let timeRange = '';
    let footerText = 'お疲れ様でした！';

    const todayLessons = timetableData['木'];

    for (let i = 0; i < periodTimes.length; i++) {
        const pt = periodTimes[i];
        if (pt.type === 'lunch') continue;

        const startMin = toMin(pt.start);
        const endMin = toMin(pt.end);

        if (currentMinutes >= startMin && currentMinutes <= endMin) {
            activeIdx = i;
            const subName = todayLessons[i]?.subject || '授業';
            title = (i + 1) + '限: ' + subName;
            subtitle = (todayLessons[i]?.teacher || '') + ' (' + (todayLessons[i]?.room || '') + ')';
            badge = '授業中';
            timeRange = pt.start + ' ~ ' + pt.end;
            footerText = '残り約 ' + (endMin - currentMinutes) + ' 分';
            break;
        } else if (currentMinutes < startMin) {
            nextIdx = i;
            break;
        }
    }

    const lunchStart = toMin('11:55');
    const lunchEnd = toMin('12:30');
    if (currentMinutes >= lunchStart && currentMinutes <= lunchEnd) {
        title = '昼休み 🍱';
        subtitle = '12:30まで自由時間です';
        badge = '休憩中';
        timeRange = '11:55 ~ 12:30';
        footerText = '午後の授業に備えよう';
    }

    if (activeIdx === -1 && title === '放課後・自由時間' && nextIdx !== -1) {
        const pt = periodTimes[nextIdx];
        title = 'まもなく ' + pt.period;
        subtitle = pt.start + ' 開始予定';
        badge = '準備中';
        timeRange = pt.start + ' ~';
        footerText = '教室移動をしましょう';
    }

    return { activeIdx, nextIdx, title, subtitle, badge, timeRange, footerText };
}

function openLessonModal(day, periodIdx) {
    document.getElementById('modal-day').value = day;
    document.getElementById('modal-period').value = periodIdx;
    const lesson = timetableData[day][periodIdx];
    document.getElementById('modal-subject').value = lesson.subject || '';
    document.getElementById('modal-teacher').value = lesson.teacher || '';
    document.getElementById('modal-room').value = lesson.room || '';
    document.getElementById('modal-color').value = lesson.color || 'blue';
    document.getElementById('lesson-modal').classList.remove('hidden');
}

function saveLesson() {
    const day = document.getElementById('modal-day').value;
    const idx = document.getElementById('modal-period').value;
    timetableData[day][idx] = {
        subject: document.getElementById('modal-subject').value,
        teacher: document.getElementById('modal-teacher').value,
        room: document.getElementById('modal-room').value,
        color: document.getElementById('modal-color').value
    };
    saveData();
    closeModal('lesson-modal');
    renderApp();
}

function openItemsModal() {
    const listEl = document.getElementById('modal-items-list');
    let html = '';
    quickItems.forEach((item, i) => {
        html += '<div class="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">';
        html += '<span class="text-sm font-medium text-slate-700">' + item.text + '</span>';
        html += '<button onclick="deleteQuickItem(' + i + ')" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash-can"></i></button>';
        html += '</div>';
    });
    listEl.innerHTML = html;
    document.getElementById('items-modal').classList.remove('hidden');
}

function addQuickItem() {
    const val = document.getElementById('new-item-input').value.trim();
    if (val) {
        quickItems.push({ text: val, checked: false });
        document.getElementById('new-item-input').value = '';
        saveData();
        openItemsModal();
    }
}

function deleteQuickItem(i) {
    quickItems.splice(i, 1);
    saveData();
    openItemsModal();
}

function toggleQuickItem(i) {
    quickItems[i].checked = !quickItems[i].checked;
    saveData();
}

function addTask() {
    const title = document.getElementById('task-title-input').value.trim();
    const limit = document.getElementById('task-limit-input').value.trim();
    if (title) {
        tasks.push({ title, limit: limit || '未設定', done: false });
        saveData();
        renderApp();
    }
}

function toggleTask(i) {
    tasks[i].done = !tasks[i].done;
    saveData();
    renderApp();
}

function deleteTask(i) {
    tasks.splice(i, 1);
    saveData();
    renderApp();
}

function updateProfile() {
    userProfile.name = document.getElementById('setting-name').value;
    userProfile.school = document.getElementById('setting-school').value;
    userProfile.grade = document.getElementById('setting-grade').value;
    saveData();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

setInterval(() => {
    if (currentTab === 'home') renderApp();
}, 60000);

document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});