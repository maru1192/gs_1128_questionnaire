$(function () {
    const STORAGE_KEY = "salesDeals_v1";

    //ページ読み込み時にストレージからデータを取得して表示
    function loadDeals() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];   //ストレージに何も入ってなかったら、空配列で返す
    }

    // =========================
    // セーブ処理
    // =========================
    
    function saveDeals() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    }

    let deals = loadDeals();

    //ユーティリティ？
    function createId(){
        return "deal_"+ Date.now();
    }

    //ステージラベルの取得
    function getStageLabel(stage){
        if (stage === "lead"){
            return "リード"
        }else if( stage === "hearing"){
            return "ヒアリング"
        }else if( stage === "proposal"){
            return "提案中"
        }else if( stage === "negotiation"){
            return "交渉中"
        }else if( stage === "won"){
            return "受注"
        }else if( stage === "lost"){
            return "失注"
        }else{
            return "-"
        }
    }

    //ステージラベルCSSクラスの取得
    function getStageBadgeClass(stage){
        if ( stage === "lead"){
            return "badge badge--lead"
        }else if( stage === "hearing"){
            return"badge badge--hearing"
        }else if( stage === "proposal"){
            return "badge badge--proposal"
        }else if( stage === "negotiation"){
            return "badge badge--negotiation"
        }else if(stage === "won"){
            return "badge badge--won"
        }else if(stage === "lost"){
            return "badge badge--lost"
        }else{
            return "badge"
        }
    }

    //案件評価の取得
    function getValuationLabel(val){
        if (val === "valu-s"){
            return "S"
        }else if(val === "valu-a"){
            return "A"
        }else if(val === "valu-b"){
            return "B"
        }else if(val === "valu-c"){
            return "C"
        }else{
            return "-"
        }
    }

    //統計カードの更新部分
    function updateStats(){
        let statTotalDeals = deals.length;
        let statActiveDeals = 0;
        let statKeyDeals = 0;
        let statWonDeals = 0;
        
        for (let i = 0; i < deals.length; i++){
            const d = deals[i];

            if(d.stage === "lead" ||d.stage === "negotiation"){
                statActiveDeals++;
            }
            if(d.valuation === "valu-s"){
                statKeyDeals++;
            }
            if(d.stage === "won"){
                statWonDeals++;
            }
        }

        $("#statTotalDeals").text(statTotalDeals);
        $("#statActiveDeals").text(statActiveDeals);
        $("#statKeyDeals").text(statKeyDeals);
        $("#statWonDeals").text(statWonDeals);
    }





    //以下消さない
}
)