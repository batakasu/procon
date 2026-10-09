let order = document.getElementById("order");
let filter = document.getElementById("filter");
const techList = document.getElementById("tech-list");

let allTechData = {};

fetch("../data/tech.json")
    .then(response => response.json())
    .then(data => {
        allTechData = data;
        updateList();
    });

order.addEventListener("change", updateList);
filter.addEventListener("change", updateList);

function updateList()
{
    let techData = Object.entries(allTechData);

    techData = filterData(techData);
    techData = sortData(techData);

    techData = renderList(techData);
}

function filterData(techData)
{
    if (filter.value === "all") {
        return techData;
    }

    return techData.filter(([id,technique]) => {
        return technique.category === filter.value;
    });
}

function sortData(techData)
{
    // 元データの順番
    if (order.value === "default") {
        return techData;
    }

    // 名前順
    if (order.value === "name") {
        return techData.sort((a, b) => {
            return a[1].title.localeCompare(b[1].title, "ja");
        });
    }

    // カテゴリ順
    if (order.value === "category") {
        return techData.sort((a, b) => {
            return a[1].category.localeCompare(b[1].category, "ja");
        });
    }

    return techData;
}

function renderList(techData)
{
    techList.innerHTML = "";

    techData.forEach(([id, technique]) => {
        const article = document.createElement("article");

        let overview;
        if ( technique.overview.length < 20) {
            overview = technique.overview;
        }
        else {
            overview = technique.overview.slice(0, 20) + "...";
        }

        article.innerHTML = `
            <a href="detail.html?id=${id}" class="tech-card text-decoration-none ${technique.category}">

                <div class="top d-flex justify-content-between p-2">
                    <h2 class="my-1 mx-2">${technique.title}</h2>
                    <p class="mt-3 mb-0 mx-2">${categoryClasses[technique.category] ?? "error"}</p>
                </div>

                <div class="bottom p-1">
                    <p class="m-2">${overview}</p>
                </div>

            </a>
        `;

        techList.appendChild(article);
    });
}