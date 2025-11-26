// ===== 定数＆データ構造 =====
const STORAGE_KEY_DEALS = 'btob_sales_deals_v1';
const STORAGE_KEY_FILTER = 'btob_sales_filter_v1';

let deals = [];
let filter = {
    stage: 'all',
    keyword: ''
};
let editingId = null; // 今編集中の案件ID（新規時はnull）

// ステージID → 表示名 & クラス
const STAGE_MAP = {
    lead: { label: 'リード', badgeClass: 'badge--lead' },
    hearing: { label: 'ヒアリング', badgeClass: 'badge--hearing' },
    proposal: { label: '提案中', badgeClass: 'badge--proposal' },
    negotiation: { label: '交渉中', badgeClass: 'badge--negotiation' },
    won: { label: '受注', badgeClass: 'badge--won' },
    lost: { label: '失注', badgeClass: 'badge--lost' }
};

// ===== localStorage 読み書き =====
function loadDeals() {
    const raw = localStorage.getItem(STORAGE_KEY_DEALS);
    if (!raw) return [];
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

function saveDeals() {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
}

function loadFilter() {
    const raw = localStorage.getItem(STORAGE_KEY_FILTER);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        if (data.stage) filter.stage = data.stage;
        if (typeof data.keyword === 'string') filter.keyword = data.keyword;
    } catch (e) {
        console.error(e);
    }
}

function saveFilter() {
    localStorage.setItem(STORAGE_KEY_FILTER, JSON.stringify(filter));
}

// ===== 初期化 =====
function initState() {
    deals = loadDeals();
    loadFilter();
}

// ===== 描画処理 =====
function renderSummary(filteredDeals) {
    const count = filteredDeals.length;
    const totalAmount = filteredDeals.reduce((sum, d) => {
        const amount = Number(d.amount) || 0;
        const prob = Number(d.probability) || 0;
        // 簡易的に「金額×確度」で見込み金額として計算
        return sum + Math.round(amount * (prob / 100));
    }, 0);

    $('#summaryCount').text(count);
    $('#summaryAmount').text(totalAmount.toLocaleString());
}

function formatStage(stage) {
    const info = STAGE_MAP[stage] || { label: stage || '-', badgeClass: '' };
    const cls = ['badge'];
    if (info.badgeClass) cls.push(info.badgeClass);
    return `<span class="${cls.join(' ')}">${info.label}</span>`;
}

function formatNextAction(dateStr) {
    if (!dateStr) return '<span class="next-action">-</span>';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(dateStr);
    if (isNaN(d)) return `<span class="next-action">${dateStr}</span>`;

    d.setHours(0, 0, 0, 0);

    const isOverdue = d.getTime() < today.getTime();
    const cls = isOverdue ? 'next-action next-action--overdue' : 'next-action';
    return `<span class="${cls}">${dateStr}</span>`;
}

function renderDealTable() {
    // フィルタ適用
    let filtered = deals.slice();

    if (filter.stage !== 'all') {
        filtered = filtered.filter(d => d.stage === filter.stage);
    }

    if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.toLowerCase();
        filtered = filtered.filter(d => {
            return (
                (d.title || '').toLowerCase().includes(kw) ||
                (d.company || '').toLowerCase().includes(kw) ||
                (d.contact || '').toLowerCase().includes(kw)
            );
        });
    }

    // 次アクション日 → 近い順にソート
    filtered.sort((a, b) => {
        const ad = a.nextActionDate || '';
        const bd = b.nextActionDate || '';
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return ad.localeCompare(bd);
    });

    const $tbody = $('#dealTableBody');
    $tbody.empty();

    filtered.forEach(deal => {
        const amountNum = Number(deal.amount) || 0;
        const prob = (deal.probability !== undefined && deal.probability !== null && deal.probability !== '')
            ? `${deal.probability}%`
            : '-';

        const $tr = $(`
      <tr data-id="${deal.id}">
        <td>
          <div class="deal-main">
            <div class="deal-main__title">${escapeHtml(deal.title || '(タイトル未設定)')}</div>
            <div class="deal-main__meta">
              ${escapeHtml(deal.company || '')} ${deal.contact ? '｜' + escapeHtml(deal.contact) : ''}
            </div>
          </div>
        </td>
        <td>${formatStage(deal.stage)}</td>
        <td>
          <div class="deal-amount">
            ${amountNum ? amountNum.toLocaleString() + '円' : '-'}
          </div>
          <div class="deal-amount__prob">
            受注確度：${prob}
          </div>
        </td>
        <td>${formatNextAction(deal.nextActionDate)}</td>
        <td>
          <div class="deal-actions">
            <button type="button" class="btn-sm btn-edit">編集</button>
            <button type="button" class="btn-sm btn-sm--danger btn-delete">削除</button>
          </div>
        </td>
      </tr>
    `);

        $tbody.append($tr);
    });

    renderSummary(filtered);
}

// HTMLエスケープ（XSS対策）
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== フォーム関連 =====
function resetForm() {
    editingId = null;
    $('#dealId').val('');
    $('#title').val('');
    $('#company').val('');
    $('#contact').val('');
    $('#amount').val('');
    $('#probability').val('');
    $('#stage').val('lead');
    $('#nextActionDate').val('');
    $('#note').val('');

    $('#formTitleLabel').text('案件を追加');
    $('#submitBtn').text('保存する');
}

function fillForm(deal) {
    editingId = deal.id;
    $('#dealId').val(deal.id);
    $('#title').val(deal.title || '');
    $('#company').val(deal.company || '');
    $('#contact').val(deal.contact || '');
    $('#amount').val(deal.amount || '');
    $('#probability').val(deal.probability || '');
    $('#stage').val(deal.stage || 'lead');
    $('#nextActionDate').val(deal.nextActionDate || '');
    $('#note').val(deal.note || '');

    $('#formTitleLabel').text('案件を編集');
    $('#submitBtn').text('更新する');
}

// ===== イベント登録 =====
$(function () {
    initState();

    // フィルタ初期値反映
    $('#filterStage').val(filter.stage);
    $('#filterKeyword').val(filter.keyword);

    // 初期描画
    renderDealTable();
    resetForm();

    // フォーム送信
    $('#dealForm').on('submit', function (e) {
        e.preventDefault();

        const id = $('#dealId').val() || null;
        const title = $('#title').val().trim();
        if (!title) {
            alert('案件名は必須です。');
            return;
        }

        const newDeal = {
            id: id || `deal_${Date.now()}`,
            title,
            company: $('#company').val().trim(),
            contact: $('#contact').val().trim(),
            amount: $('#amount').val(),
            stage: $('#stage').val(),
            probability: $('#probability').val(),
            nextActionDate: $('#nextActionDate').val(),
            note: $('#note').val().trim(),
            updatedAt: Date.now()
        };

        if (!id) {
            // 新規
            newDeal.createdAt = Date.now();
            deals.push(newDeal);
        } else {
            // 更新
            const index = deals.findIndex(d => d.id === id);
            if (index !== -1) {
                newDeal.createdAt = deals[index].createdAt || Date.now();
                deals[index] = newDeal;
            } else {
                // 一応なかった場合は追加
                newDeal.createdAt = Date.now();
                deals.push(newDeal);
            }
        }

        saveDeals();
        renderDealTable();
        resetForm();
    });

    // フォームリセットボタン
    $('#resetBtn').on('click', function () {
        resetForm();
    });

    // フィルタ：ステージ
    $('#filterStage').on('change', function () {
        filter.stage = $(this).val();
        saveFilter();
        renderDealTable();
    });

    // フィルタ：キーワード
    $('#filterKeyword').on('input', function () {
        filter.keyword = $(this).val();
        saveFilter();
        renderDealTable();
    });

    // 編集ボタン
    $('#dealTableBody').on('click', '.btn-edit', function () {
        const id = $(this).closest('tr').data('id');
        const deal = deals.find(d => d.id === id);
        if (!deal) return;
        fillForm(deal);

        // フォームの方へスクロール（SP用）
        $('html, body').animate({
            scrollTop: $('.deal-form').offset().top - 16
        }, 200);
    });

    // 削除ボタン
    $('#dealTableBody').on('click', '.btn-delete', function () {
        const id = $(this).closest('tr').data('id');
        const deal = deals.find(d => d.id === id);
        if (!deal) return;

        if (!window.confirm(`「${deal.title}」を削除しますか？`)) {
            return;
        }

        deals = deals.filter(d => d.id !== id);
        saveDeals();
        renderDealTable();
    });
});
