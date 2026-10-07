const checkbox = document.getElementById('toggle-input');

if (checkbox.checked) {
    // チェックが入っている（ON）ときの処理
    console.log("探索モードがONです！");
} else {
    // チェックが入っていない（OFF）ときの処理
    console.log("探索モードがOFFです！");
}