// tech_detailを表示するため
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// JSONを読み込む
fetch("../data/tech.json")
    .then(response => response.json())
    .then(data => {

        // idに対応する技術を取得
        const technique = data[id];

        // 基本情報
        document.getElementById("breadcrumb-title").textContent = technique.title;
        document.title = `${technique.title} | 技術解説`;
        document.getElementById("tech-title").textContent = technique.title;
        document.getElementById("tech-overview").textContent = technique.overview;

        // カテゴリーの色を追加
        const techDetail = document.getElementById("tech-detail");
        techDetail.classList.add(technique.category);

        // main画像
        const mainImage = document.getElementById("main-img");
        if (mainImage) {
            if (technique.mainImg) {
                mainImage.src = `../${technique.mainImg}`;
                mainImage.style.display = "";
            } else {
                mainImage.style.display = "none";
            }
}

        // タグ
        const tags = document.getElementById("tech-tags");

        technique.tags.forEach(tag => {
            const span = document.createElement("span");
            span.textContent = tag;
            tags.appendChild(span);
        });

        // ポイント
        const points = document.getElementById("tech-points");

        technique.points.forEach(point => {
            const li = document.createElement("li");
            li.textContent = point;
            points.appendChild(li);
        });

        // 背景画像        
        const decorationTarget = document.getElementById("decoration-right");
        const category = technique.category;

        decorationTarget.src = `../image/decoration-image/${category}.png`;

    });
