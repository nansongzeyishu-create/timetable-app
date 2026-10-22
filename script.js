// Supabaseの接続設定
const SUPABASE_URL = 'https://wjabYemjrvmdwonwknmy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KBVBabycyp1GrKig3ELRyW_WcEr...'; // コピーしたKey

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 曜日と時限のマッピング用
const days = ['月', '火', '水', '木', '金'];
const periods = [1, 2, 3, 4, 5, 6];

// 教科ごとの色を決める関数
function geticolorClass(title) {
    if (title.includes('数学')) return 'color-math';
    if (title.includes('英語')) return 'color-english';
    if (title.includes('国語')) return 'color-japan';
    if (title.includes('体育')) return 'color-pe';
    if (title.includes('理科')) return 'color-science';
    if (title.includes('社会')) return 'color-social';
    return 'color-default';
}

// 授業の登録 (教師用)
async function registerLesson(day, period, subject, room) {
    const { data, error } = await supabase
        .from('timetables')
        .upsert([{ day, period, subject, room }], { onConflict: ['day', 'period'] });
    
    if (error) {
        console.error('登録エラー:', error);
    } else {
        console.log('登録成功:', data);
    }
}