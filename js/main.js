// js/main.js

$(function () {
    const STORAGE_KEY = "salesDeals_v1";

    // =========================
    // データの読み書き
    // =========================
    function loadDeals() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("loadDeals error", e);
            return [];
        }
    }

    function saveDeals() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    }

    let deals = loadDeals();

    // =========================
    // ユーティリティ
    // =========================
    function createId() {
        return "deal_" + Date.now();
    }

    function getStageLabel(stage) {
        switch (stage) {
            case "lead":
                return "リード";
            case "hearing":
                return "ヒアリング";
            case "proposal":
                return "提案中";
            case "negotiation":
                return "交渉中";
            case "won":
                return "受注";
            case "lost":
                return "失注";
            default:
                return "-";
        }
    }

    function getStageBadgeClass(stage) {
        switch (stage) {
            case "lead":
                return "badge badge--lead";
            case "hearing":
                return "badge badge--hearing";
            case "proposal":
                return "badge badge--proposal";
            case "negotiation":
                return "badge badge--negotiation";
            case "won":
                return "badge badge--won";
            case "lost":
                return "badge badge--lost";
            default:
                return "badge";
        }
    }

    function getValuationLabel(val) {
        switch (val) {
            case "valu-s":
                return "S";
            case "valu-a":
                return "A";
            case "valu-b":
                return "B";
            case "valu-c":
                return "C";
            default:
                return "-";
        }
    }

    // 日付文字列（YYYY-MM-DD）が「今日より前」なら true
    function isOverdue(dateStr, stage) {
        if (!dateStr) return false;
        if (stage === "won" || stage === "lost") return false;

        const todayStr = new Date().toISOString().slice(0, 10);
        return dateStr < todayStr;
    }

    // =========================
    // 統計の更新
    // =========================
    function updateStats() {
        const total = deals.length;
        const active = deals.filter(
            (d) => d.stage === "proposal" || d.stage === "negotiation"
        ).length;
        const keyDeals = deals.filter((d) => d.valuation === "valu-s").length;
        const won = deals.filter((d) => d.stage === "won").length;

        $("#statTotalDeals").text(total);
        $("#statActiveDeals").text(active);
        $("#statKeyDeals").text(keyDeals);
        $("#statWonDeals").text(won);
    }

    // =========================
    // テーブル描画
    // =========================
    function renderDeals() {
  const $tbody = $("#dealTableBody");
  $tbody.empty();

  const filterStage = $("#filterStage").val();
  const keyword = $("#filterKeyword").val().trim().toLowerCase();

  let filtered = deals.slice();

  // ステータスフィルタ
  if (filterStage && filterStage !== "all") {
    filtered = filtered.filter((d) => d.stage === filterStage);
  }

  // キーワードフィルタ（会社名・案件名・メモ・※担当者はあれば）
  if (keyword) {
    filtered = filtered.filter((d) => {
      const text =
        (d.company || "") +
        " " +
        (d.title || "") +
        " " +
        (d.contactLabel || "") +
        " " +
        (d.note || "");
      return text.toLowerCase().includes(keyword);
    });
  }

  // 次アクション日が近い順にソート（空は最後）
  filtered.sort((a, b) => {
    const aDate = a.nextActionDate || "9999-12-31";
    const bDate = b.nextActionDate || "9999-12-31";
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });

  filtered.forEach((deal) => {
    const stageLabel = getStageLabel(deal.stage);
    const stageClass = getStageBadgeClass(deal.stage);
    const valuLabel = getValuationLabel(deal.valuation);
    const probLabel =
      deal.probability !== null && deal.probability !== undefined
        ? deal.probability + "%"
        : "-";

    const memoText = (deal.note || "").trim();
    const memoHtml = memoText
      ? `<div class="deal-memo-text">${memoText}</div>`
      : `<div class="deal-memo-text deal-memo-text--empty">（メモはまだ登録されていません）</div>`;

    const $row = $(`
      <tr data-id="${deal.id}">
        <!-- 1列目：ステータス -->
        <td>
          <span class="${stageClass}">${stageLabel}</span>
        </td>

        <!-- 2列目：会社名 / 案件名 -->
        <td>
          <div class="deal-company">${deal.company || "-"}</div>
          <div class="deal-title">${deal.title || ""}</div>
        </td>

        <!-- 3列目：案件評価 / 受注確度 -->
        <td>
          <div class="deal-rating">評価：${valuLabel}</div>
          <div class="deal-amount__prob">受注確度：${probLabel}</div>
        </td>

        <!-- 4列目：進捗メモ -->
        <td>
          ${memoHtml}
        </td>

        <!-- 5列目：操作 -->
        <td>
          <div class="deal-actions">
            <button type="button" class="btn-sm js-edit">編集</button>
            <button type="button" class="btn-sm btn-sm--danger js-delete">削除</button>
          </div>
        </td>
      </tr>
    `);

    $tbody.append($row);
  });

  updateStats();
}




    // =========================
    // フォーム操作
    // =========================
    function resetForm() {
        $("#dealId").val("");
        $("#dealForm")[0].reset();

        $(".deal-form #formTitleLabel").text("案件を追加");

        $("#stage").val("lead");
        $("#valuation").val("valu-s");
    }

    $("#resetBtn").on("click", function () {
        resetForm();
    });

    $("#dealForm").on("submit", function (e) {
        e.preventDefault();

        const id = $("#dealId").val() || createId();

        const title = $("#title").val().trim();
        const company = $("#company").val().trim();
        const contactValue = $("#contact").val();
        const contactLabel = $("#contact option:selected").text();
        const valuation = $("#valuation").val();
        const probabilityStr = $("#probability").val();
        const probability =
            probabilityStr === "" ? null : Number(probabilityStr) || null;
        const stage = $("#stage").val();
        const nextActionDate = $("#nextActionDate").val();
        const note = $("#note").val();

        const existingIndex = deals.findIndex((d) => d.id === id);

        const dealData = {
            id,
            title,
            company,
            contactValue,
            contactLabel,
            valuation,
            probability,
            stage,
            nextActionDate,
            note,
        };

        if (existingIndex >= 0) {
            deals[existingIndex] = dealData;
        } else {
            deals.push(dealData);
        }

        saveDeals();
        renderDeals();
        resetForm();
    });

    // =========================
    // 編集・削除ボタン
    // =========================
    $("#dealTableBody").on("click", ".js-edit", function () {
        const id = $(this).closest("tr").data("id");
        const deal = deals.find((d) => d.id === id);
        if (!deal) return;

        $("#dealId").val(deal.id);
        $("#title").val(deal.title);
        $("#company").val(deal.company);
        $("#contact").val(deal.contactValue);
        $("#valuation").val(deal.valuation);
        $("#probability").val(
            deal.probability === null || deal.probability === undefined
                ? ""
                : deal.probability
        );
        $("#stage").val(deal.stage);
        $("#nextActionDate").val(deal.nextActionDate);
        $("#note").val(deal.note);

        $(".deal-form #formTitleLabel").text("案件を編集");
    });

    $("#dealTableBody").on("click", ".js-delete", function () {
        const id = $(this).closest("tr").data("id");
        if (!id) return;

        if (!window.confirm("この案件を削除しますか？")) return;

        deals = deals.filter((d) => d.id !== id);
        saveDeals();
        renderDeals();

        if ($("#dealId").val() === id) {
            resetForm();
        }
    });

    // =========================
    // フィルターイベント
    // =========================
    $("#filterStage").on("change", function () {
        renderDeals();
    });

    $("#filterKeyword").on("input", function () {
        renderDeals();
    });

    // =========================
    // 初期描画
    // =========================
    renderDeals();
    resetForm();
});
