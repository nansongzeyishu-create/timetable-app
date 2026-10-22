<<<<<<< HEAD
// ==========================================
// 1. Supabaseの接続設定
// ==========================================
const SUPABASE_URL = 'https://wjabyemjrvmdwonwknmy.supabase.co'; //[cite: 4, 8]
const SUPABASE_KEY = 'sb_publishable_KBVBabyCyp1GrKIg3ELRYw_WcER...'; // ←コピーしたKeyを貼り付け[cite: 8]

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 曜日と時限のマッピング用
const days = ['月', '火', '水', '木', '金'];
const periods = [1, 2, 3, 4, 5, 6];

// 教科ごとの色を決める関数（画像の色使いを再現）
function getColorClass(title) {
  if (title.includes('数学')) return 'color-math';
  if (title.includes('英語')) return 'color-english';
  if (title.includes('国語')) return 'color-japan';
  if (title.includes('体育')) return 'color-pe';
  if (title.includes('理科')) return 'color-science';
  if (title.includes('社会')) return 'color-social';
  return 'color-default';
}


// ==========================================
// 2. 授業の登録（教師）
// ==========================================
async function addClass() {
  const title = document.getElementById('class-title').value.trim();
  const day = document.getElementById('class-day').value;
  const period = document.getElementById('class-period').value;

  if (!title) {
    alert('授業名を入力してください');
    return;
  }

  // Supabaseに保存
  const { data, error } = await supabase
    .from('classes')
    .insert([{ title: title, day: day, period: parseInt(period) }]);

  if (error) {
    console.error('エラー:', error);
    alert('登録できませんでした');
  } else {
    alert('登録しました！');
    document.getElementById('class-title').value = '';
    fetchClasses(); // グリッドを更新
  }
}


// ==========================================
// 3. 時間割の描画（生徒）
// ==========================================
async function fetchClasses() {
  // 1. Supabaseから全データを取得
  const { data: classes, error } = await supabase.from('classes').select('*');

  if (error) {
    console.error('取得エラー:', error);
    return;
  }

  const grid = document.getElementById('grid');

  // ヘッダー（曜日）以外の既存マス目を消去
  const headers = Array.from(grid.children).slice(0, 6);
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  // 2. 1時限〜6時限までの枠を生成
  periods.forEach(p => {
    // 左端の時限表示
    const periodLabel = document.createElement('div');
    periodLabel.className = 'period-label';
    periodLabel.innerHTML = `<span class="period-num">${p}</span>`;
    grid.appendChild(periodLabel);

    // 月〜金のマス目を作成
    days.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'cell';

      // 該当する曜日・時限の授業を探す
      const match = classes.find(c => c.day === d && c.period === p);

      if (match) {
        cell.innerText = match.title;
        // 教科名に応じて色をつける
        cell.classList.add(getColorClass(match.title));
      }

      grid.appendChild(cell);
    });
  });
}

// ページが開いた時に実行
window.onload = fetchClasses;
=======
const subjects = [
  "国語",
  "算数",
  "理科",
  "社会",
  "英語"
];

console.log(subjects); 
>>>>>>> 81eee13f047deb4763aa2d580eb791f924711339
