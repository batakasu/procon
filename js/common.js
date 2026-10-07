const pageTopButton = document.getElementById("page-top");

window.addEventListener("scroll", function () {
    const shrinkPoint = window.innerHeight * 0.6;
    const restorePoint = window.innerHeight * 0.5;
    const pageTopPoint = window.innerHeight * 0.6;

    if (window.scrollY > shrinkPoint) {
        header.classList.add("small");
    } else if (window.scrollY < restorePoint) {
        header.classList.remove("small");
    }

    if (window.scrollY > pageTopPoint) {
        pageTopButton.style.display = "block";
    } else {
        pageTopButton.style.display = "none";
    }
});

pageTopButton.addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});