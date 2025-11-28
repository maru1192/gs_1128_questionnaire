$(function () {
    const STORAGE_KEY = "salesDeals_v1";

    //ページ読み込み時にストレージからデータを取得して表示
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


    // =========================
    // セーブ処理
    // =========================

    function saveDeals() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    }

    let deals = loadDeals();

    //ユーティリティ？
    function createId() {
        return "deal_" + Date.now();
    }

    //ステージラベルの取得
    function getStageLabel(stage) {
        if (stage === "lead") {
            return "リード"
        } else if (stage === "hearing") {
            return "ヒアリング"
        } else if (stage === "proposal") {
            return "提案中"
        } else if (stage === "negotiation") {
            return "交渉中"
        } else if (stage === "won") {
            return "受注"
        } else if (stage === "lost") {
            return "失注"
        } else {
            return "-"
        }
    }

    //ステージラベルCSSの取得
    function getStageBadgeClass(stage) {
        if (stage === "lead") {
            return "badge badge--lead"
        } else if (stage === "hearing") {
            return "badge badge--hearing"
        } else if (stage === "proposal") {
            return "badge badge--proposal"
        } else if (stage === "negotiation") {
            return "badge badge--negotiation"
        } else if (stage === "won") {
            return "badge badge--won"
        } else if (stage === "lost") {
            return "badge badge--lost"
        } else {
            return "badge"
        }
    }

    //案件評価の取得
    function getValuationLabel(val) {
        if (val === "valu-s") {
            return "S"
        } else if (val === "valu-a") {
            return "A"
        } else if (val === "valu-b") {
            return "B"
        } else if (val === "valu-c") {
            return "C"
        } else {
            return "-"
        }
    }

    //統計カードの更新部分
    function updateStats() {
        let statTotalDeals = deals.length;
        let statActiveDeals = 0;
        let statKeyDeals = 0;
        let statWonDeals = 0;

        for (let i = 0; i < deals.length; i++) {
            const d = deals[i];

            if (d.stage === "lead" || d.stage === "negotiation") {
                statActiveDeals++;
            }
            if (d.valuation === "valu-s") {
                statKeyDeals++;
            }
            if (d.stage === "won") {
                statWonDeals++;
            }
        }

        $("#statTotalDeals").text(statTotalDeals);
        $("#statActiveDeals").text(statActiveDeals);
        $("#statKeyDeals").text(statKeyDeals);
        $("#statWonDeals").text(statWonDeals);
    }

    //フォームのリセット
    function resetForm() {
        // 隠しIDは空に
        $("#dealId").val("");

        // フォーム全体を一旦リセット（ブラウザ標準の reset）
        const formEl = $("#dealForm")[0];   // jQuery → 生のDOM要素
        if (formEl) {
            formEl.reset();
        }

        // 「初期値に戻したいもの」を上書き
        $("#valuation").val("valu-s");  // 案件評価：S
        $("#stage").val("lead");        // ステータス：リード
    }

    //テーブル描画
    function renderDeals() {
        const $tbody = $("#dealTableBody");
        $tbody.empty();


        //フィルター条件の取得
        const $filterStage = $("#filterStage").val();
        const $filterKeyword = $("#filterKeyword").val().trim().toLowerCase();

        let filtered = deals.slice();   //元データをコピー

        if ($filterStage !== "all") {
            const newFiltered = [];

            for (let i = 0; i < filtered.length; i++) {
                const d = filtered[i];

                if (d.stage === $filterStage) {
                    newFiltered.push(d);
                }
            }

            filtered = newFiltered;  //表示データをただのコピーデータからフィルターデータに更新
        }

        //キーワード
        if ($filterKeyword) {
            const newFiltered = [];

            for (let i = 0; i < filtered.length; i++) {
                const d = filtered[i];

                let text = "";
                text += (d.company || "") + " ";
                text += (d.title || "") + " ";

                const lowerText = text.toLowerCase();   //小文字にしてから検索

                if (lowerText.includes($filterKeyword)) {
                    newFiltered.push(d);
                }

                filtered = newFiltered;
            }
        }

        // --- 絞り込まれたデータを1件ずつtbodyへ ---
        for (let i = 0; i < filtered.length; i++) {
            const deal = filtered[i];

            const stageLabel = getStageLabel(deal.stage);
            const stageBadgeClass = getStageBadgeClass(deal.stage);
            const valuationLabel = getValuationLabel(deal.valuation);

            let probLabel;
            if (
                deal.probability === null ||
                deal.probability === undefined ||
                deal.probability === ""
            ) {
                probLabel = "-";
            } else {
                probLabel = deal.probability + "%";
            }

            //メモの表示
            let memoText = "";

            if (deal.note) {
                memoText = deal.note.trim();
            }

            let memoHtml;

            if (memoText) {
                memoHtml = '<div class="deal-memo-text">' + memoText + '</div>';
            } else {
                memoHtml = '<div class="deal-memo-text deal-memo-text--empty">（メモはまだ登録されていません）</div>';
            }

            // 1行ぶんのHTMLを組み立て
            const rowHtml =
                '<tr data-id="' +
                deal.id +
                '">' +
                // 1列目：ステータス
                '<td><span class="' +
                stageBadgeClass +
                '">' +
                stageLabel +
                "</span></td>" +
                // 2列目：会社名 / 案件名
                "<td>" +
                '<div class="deal-company">' +
                (deal.company || "-") +
                "</div>" +
                '<div class="deal-title">' +
                (deal.title || "") +
                "</div>" +
                "</td>" +
                // 3列目：案件評価 / 受注確度
                "<td>" +
                '<div class="deal-rating">評価：' +
                valuationLabel +
                "</div>" +
                '<div class="deal-amount__prob">受注確度：' +
                probLabel +
                "</div>" +
                "</td>" +
                // 4列目：進捗メモ
                "<td>" +
                memoHtml +
                "</td>" +
                // 5列目：操作ボタン
                "<td>" +
                '<div class="deal-actions">' +
                '<button type="button" class="btn-sm js-edit">編集</button>' +
                '<button type="button" class="btn-sm btn-sm--danger js-delete">削除</button>' +
                "</div>" +
                "</td>" +
                "</tr>";

            $tbody.append(rowHtml);
        }
        updateStats();
    }

    // --- フォームの保存 ---　//
    $("#dealForm").on("submit", function (e) {
        e.preventDefault(); // 画面リロードを止める

        // 既存IDがあればそれを使う（＝編集）、なければ新規IDを作る
        const idFromHidden = $("#dealId").val();
        const id = idFromHidden || createId();

        const title = $("#title").val().trim();
        const company = $("#company").val().trim();
        const valuation = $("#valuation").val();
        const probabilityStr = $("#probability").val();
        const stage = $("#stage").val();
        const nextActionDate = $("#nextActionDate").val();
        const note = $("#note").val();

        // 受注確度は 数値 or null にしておく
        let probability = null;
        if (probabilityStr !== "") {
            const num = Number(probabilityStr);
            if (!isNaN(num)) {
                probability = num;
            }
        }

        // 1件分のデータオブジェクト
        const dealData = {
            id: id,
            title: title,
            company: company,
            valuation: valuation,
            probability: probability,
            stage: stage,
            nextActionDate: nextActionDate,
            note: note,
        };

        // 既存データかどうかチェック
        let existingIndex = -1;
        for (let i = 0; i < deals.length; i++) {
            if (deals[i].id === id) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            // 上書き（編集）
            deals[existingIndex] = dealData;
        } else {
            // 新規追加
            deals.push(dealData);
        }

        // 保存 → 再描画 → フォームリセット
        saveDeals();
        renderDeals();
        resetForm();

    });

    // =========================
    // 編集ボタン
    // =========================
    $("#dealTableBody").on("click", ".js-edit", function () {
        const id = $(this).closest("tr").data("id");
        if (!id) return;

        // idが一致するデータを探す
        let deal = null;
        for (let i = 0; i < deals.length; i++) {
            if (deals[i].id === id) {
                deal = deals[i];
                break;
            }
        }
        if (!deal) return;

        // フォームに値をセット
        $("#dealId").val(deal.id);
        $("#title").val(deal.title);
        $("#company").val(deal.company);
        $("#valuation").val(deal.valuation);
        $("#probability").val(
            deal.probability === null || deal.probability === undefined
                ? ""
                : deal.probability
        );
        $("#stage").val(deal.stage);
        $("#nextActionDate").val(deal.nextActionDate);
        $("#note").val(deal.note);

        // 見出しを「案件を編集」に変更
        $(".deal-form #formTitleLabel").text("案件を編集");
    });

    // =========================
    // 削除ボタン
    // =========================
    $("#dealTableBody").on("click", ".js-delete", function () {
        const id = $(this).closest("tr").data("id");
        if (!id) return;

        if (!window.confirm("この案件を削除しますか？")) {
            return;
        }

        const newDeals = [];
        for (let i = 0; i < deals.length; i++) {
            if (deals[i].id !== id) {
                newDeals.push(deals[i]);
            }
        }
        deals = newDeals;

        saveDeals();
        renderDeals();

    });

    // =========================
    // フィルター操作
    // =========================
    $("#filterStage").on("change", function () {
        renderDeals();
    });

    $("#filterKeyword").on("input", function () {
        renderDeals();
    });

    // =========================
    // 初期表示
    // =========================
    renderDeals();
});