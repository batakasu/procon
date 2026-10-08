(() => {
      const svg = document.getElementById("board");
      const status = document.getElementById("status");
      const countEl = document.getElementById("count");
      const totalEl = document.getElementById("total");

      // -----------------------------
      // ブレッドボードの設定
      // -----------------------------
      const COLS = 25, ROWS = 15;
      const x0 = 70, y0 = 95, dx = 36, dy = 30;
      const X = c => x0 + c * dx;
      const Y = r => y0 + r * dy;

      // 穴番号は (列, 行) で指定。
      const solution = [
        [[1, 2], [23, 2]],    // 上の電源ランイ
        [[1, 3], [1, 8]],    // 左の縦ライン
        [[1, 13], [23, 13]],  // 下のライン
        [[23, 6], [23, 13]],  // 右の縦ライン
        [[1, 3], [23, 3]],   // LEDまで
        [[12, 4], [23, 4]],   // トグルスイッチ上側
        [[12, 4], [12, 9]],   // トグルスイッチまで
        [[11, 8], [11, 13]],  // トグルスイッチ下側

        [[17, 5], [23, 5]],   // タクトスイッチ上側
        [[17, 5], [17, 8]],   // タクトスイッチまで
        [[16, 12], [16, 13]], // タクトスイッチ下側


      ];

      // 正解線上なら途中の穴を使った配線でも正解になります。
      const key = p => `${p[0]},${p[1]}`;
      const edgeKey = (a, b) => {
        const A = key(a), B = key(b);
        return A < B ? A + "|" + B : B + "|" + A;
      };

      const solutionMap = new Map();

      function addSolutionPath(a, b) {
        if (a[0] === b[0]) {
          const step = a[1] <= b[1] ? 1 : -1;
          for (let r = a[1]; r !== b[1]; r += step) {
            const p1 = [a[0], r], p2 = [a[0], r + step];
            solutionMap.set(edgeKey(p1, p2), [p1, p2]);
          }
        } else if (a[1] === b[1]) {
          const step = a[0] <= b[0] ? 1 : -1;
          for (let c = a[0]; c !== b[0]; c += step) {
            const p1 = [c, a[1]], p2 = [c + step, a[1]];
            solutionMap.set(edgeKey(p1, p2), [p1, p2]);
          }
        } else {
          // 斜めの定義があった場合も、元の表示と同じL字に分解
          const mid = [b[0], a[1]];
          addSolutionPath(a, mid);
          addSolutionPath(mid, b);
        }
      }

      for (const [a, b] of solution) addSolutionPath(a, b);

      totalEl.textContent = solutionMap.size;

      // userWires = 実際にプレイヤーが引いた配線
      // covered = その配線でカバーできた正解区間
      const wires = new Map();
      const covered = new Set();
      let selected = null;
      let mistakes = 0;
      let hintOn = false;

      // -----------------------------
      // SVG helpers
      // -----------------------------
      function el(name, attrs = {}, text = "") {
        const e = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        if (text) e.textContent = text;
        svg.appendChild(e);
        return e;
      }

      // ボード本体
      el("rect", {x: 35, y: 55, width: 930, height: 510, rx: 12, class: "board"});

      // 上下の穴エリア
      for (let r = 0; r < ROWS; r++) {
        const yy = Y(r);
        el("line", {x1: 55, y1: yy, x2: 945, y2: yy, class: "rail"});
      }
      for (let c = 0; c < COLS; c++) {
        el("line", {x1: X(c), y1: 75, x2: X(c), y2: 545, class: "rail"});
      }

      // 溝
      el("rect", {x: 50, y: Y(4) - 12, width: 900, height: 24, fill: "#ececea"});
      el("line", {x1: 50, y1: Y(4), x2: 950, y2: Y(4), stroke: "#c7c7c3", "stroke-width": 2});
      el("rect", {x: 50, y: Y(9) - 12, width: 900, height: 24, fill: "#ececea"});
      el("line", {x1: 50, y1: Y(9), x2: 950, y2: Y(9), stroke: "#c7c7c3", "stroke-width": 2});


      // 穴
      const holeMap = new Map();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const circle = el("circle", {cx: X(c), cy: Y(r), r: 5, class: "hole"});
          circle.dataset.c = c; circle.dataset.r = r;
          holeMap.set(key([c, r]), circle);
          circle.addEventListener("click", () => holeClick([c, r]));
        }
      }

      // 端子列（右側）
      [2, 3, 4, 5, 6].forEach(r => {
        el("rect", {x: X(23) - 9, y: Y(r) - 9, width: 18, height: 18, rx: 3, class: "terminal"});
      });
      el("text", {x: X(24) - 29, y: Y(2) - 0, class: "label"}, "Vcc");
      el("text", {x: X(24) - 29, y: Y(3) - 0, class: "label"}, "SW1");
      el("text", {x: X(24) - 29, y: Y(4) - 0, class: "label"}, "SW2");
      el("text", {x: X(24) - 29, y: Y(5) - 0, class: "label"}, "SW3");
      el("text", {x: X(24) - 29, y: Y(6) - 0, class: "label"}, "GND");

      // 簡易抵抗器
      //四角形
      el("rect", {x: X(1) - 7, y: Y(9), width: 14, height: 72, rx: 3, class: "component resistor"});
      //線
      el("line", {x1: X(1), y1: Y(8), x2: X(1), y2: Y(9), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("line", {x1: X(1), y1: Y(11.4), x2: X(1), y2: Y(13), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("text", {x: X(1) - 23, y: Y(10.6), class: "label"}, "抵抗");

      el("rect", {x: X(12) - 7, y: Y(3), width: 14, height: 72, rx: 3, class: "component resistor"});
      el("line", {x1: X(12), y1: Y(2), x2: X(12), y2: Y(3), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("line", {x1: X(12), y1: Y(5.4), x2: X(12), y2: Y(7), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("text", {x: X(12) - 23, y: Y(4.6), class: "label"}, "抵抗");

      el("rect", {x: X(17) - 7, y: Y(3), width: 14, height: 72, rx: 3, class: "component resistor"});
      el("line", {x1: X(17), y1: Y(2), x2: X(17), y2: Y(3), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("line", {x1: X(17), y1: Y(5.4), x2: X(17), y2: Y(7), stroke: "#555", "stroke-width": 3, class: "partVisual"});
      el("text", {x: X(17) - 23, y: Y(4.6), class: "label"}, "抵抗");

      // 簡易トグルスイッチ
      const toggleWidth = dx * 3;
      const toggleHeight = 32;
      //四角形
      el("rect", {x: X(11) - toggleWidth / 2, y: Y(8) - toggleHeight / 2, width: toggleWidth, height: toggleHeight*2, rx: 6, class: "component switch"});
      //丸
      el("circle", {cx: X(11) - toggleWidth / 2 + 18, cy: Y(9), r: 7, fill: "#777", class: "partVisual"});
      el("circle", {cx: X(11) + toggleWidth / 2 - 18, cy: Y(9), r: 7, fill: "#777", class: "partVisual"});
      el("circle", {cx: X(10) + toggleWidth / 2 - 18, cy: Y(8), r: 7, fill: "#777", class: "partVisual"});
      //線
      el("line", {x1: X(10) , y1: Y(9) - 2, x2: X(11) + 10, y2: Y(7)+10 , stroke: "#333", "stroke-width": 4, class: "partVisual"});
      el("text", {x: X(11) - 42, y: Y(9) + 38, class: "label"}, "トグルスイッチ");

      // LED
      el("circle", {cx: X(1), cy: Y(2.5), r: 10, fill: "#00c853", stroke: "#006b2d", "stroke-width": 2, class: "partVisual"});
      el("text", {x: X(1) - 12, y: Y(2) - 17, class: "label"}, "LED");




      // 簡易タクトスイッチ
      const tactCenterX = X(16.5);
      const tactCenterY = Y(10);
      const tactSize = dx * 2;
      //線
      el("line", {x1: X(16), y1: Y(8), x2: X(16), y2: Y(12), stroke: "#000", "stroke-width": 4, class: "partVisual"});
      el("line", {x1: X(17), y1: Y(8), x2: X(17), y2: Y(12), stroke: "#000", "stroke-width": 4, class: "partVisual"});
      // 正方形
      el("rect", {x: tactCenterX - tactSize / 2, y: tactCenterY - tactSize / 2, width: tactSize, height: tactSize, rx: 2, class: "component switch"});
      // 丸
      el("circle", {cx: tactCenterX, cy: tactCenterY, r: tactSize / 2, class: "led"});
      el("text", {x: tactCenterX - 42, y: tactCenterY + tactSize / 2 + 18, class: "label"}, "タクトスイッチ");


      // -----------------------------
      // 配線
      // -----------------------------
      function drawWire(a, b, cls = "wire") {
        // 見本に合わせて、斜めではなく直角の折れ線にする。
        const ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
        let points;
        if (a[0] === b[0] || a[1] === b[1]) {
          points = `${ax},${ay} ${bx},${by}`;
        } else {
          const mx = bx;
          points = `${ax},${ay} ${mx},${ay} ${bx},${by}`;
        }
        const p = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        p.setAttribute("points", points);
        p.setAttribute("class", cls);
        p.dataset.wireKey = edgeKey(a, b);
        p.addEventListener("click", e => {
          if (cls === "wire") {
            e.stopPropagation();
            const k = edgeKey(a, b);
            wires.delete(k);
            p.remove();
            recomputeCovered();
            update();
            status.textContent = "配線を1本削除しました。";
            status.className = "";
          }
        });
        svg.appendChild(p);

        // 配線を描いた後も、穴を最前面に戻す。
        // これで「すでに配線が通っている穴」も再びクリックできます。
        for (const circle of holeMap.values()) svg.appendChild(circle);
        return p;
      }

      function getPathEdges(a, b) {
        const result = [];
        if (a[0] === b[0]) {
          const step = a[1] <= b[1] ? 1 : -1;
          for (let r = a[1]; r !== b[1]; r += step) result.push(edgeKey([a[0], r], [a[0], r + step]));
          return result;
        }
        if (a[1] === b[1]) {
          const step = a[0] <= b[0] ? 1 : -1;
          for (let c = a[0]; c !== b[0]; c += step) result.push(edgeKey([c, a[1]], [c + step, a[1]]));
          return result;
        }

        // L字配線も、折れ曲がった2区間がどちらも正解線なら正解。
        const mid = [b[0], a[1]];
        const p1 = getPathEdges(a, mid), p2 = getPathEdges(mid, b);
        if (p1.length && p2.length && p1.concat(p2).every(e => solutionMap.has(e))) return p1.concat(p2);
        return [];
      }

      function recomputeCovered() {
        covered.clear();
        for (const wire of wires.values()) for (const e of getPathEdges(wire.a, wire.b)) if (solutionMap.has(e)) covered.add(e);
      }

      function holeClick(p) {
        if (selected === null) {
          selected = p;
          holeMap.get(key(p)).classList.add("selected");
          status.textContent = `始点 ${p[0] + 1},${p[1] + 1} を選択中。終点をクリックしてください。`;
          return;
        }

        const first = selected;
        holeMap.get(key(first)).classList.remove("selected");
        selected = null;

        if (key(first) === key(p)) {
          status.textContent = "同じ穴は選べません。";
          return;
        }

        const k = edgeKey(first, p);
        if (wires.has(k)) {
          status.textContent = "その配線はすでにあります。";
          return;
        }

        // 完成しているかどうかは「完成チェック」ボタンを押した時だけ判定する。
        const wireEdges = getPathEdges(first, p);
        wires.set(k, {a: first, b: p});

        // 今回の配線が正解経路の一部を通っている場合だけ、
        // 完成チェック用の covered に記録する。
        for (const e of wireEdges) {
          if (solutionMap.has(e)) covered.add(e);
        }

        drawWire(first, p);
        update();
        status.textContent = "配線を追加しました。完成チェックで正解か確認できます。";
        status.className = "";
      }

      function update() {

        // 正解経路をどれだけ覆っているかは完成チェックで判定する。
        countEl.textContent = wires.size;
      }

      function clearWires() {
        document.querySelectorAll(".wire").forEach(e => e.remove());
        wires.clear();
        covered.clear();
        selected = null;
        document.querySelectorAll(".hole.selected").forEach(e => e.classList.remove("selected"));
        status.textContent = "配線を全部消しました。正解判定は完成チェックで行います。";
        status.className = "";
        update();
      }

      function showHint() {
        hintOn = !hintOn;
        document.querySelectorAll(".ghost").forEach(e => e.remove());
        if (hintOn) {
          for (const [k, [a, b]] of solutionMap) {
            if (!wires.has(k)) drawWire(a, b, "ghost");
          }
          status.textContent = "オレンジの点線が未完成の配線です。";
        } else {
          status.textContent = "ヒントを消しました。";
        }
      }

      function check() {
        // 完成チェックを押した時だけ判定する。
        // 正解経路をすべて通っていることに加えて、
        // 余計な配線が1本でもあれば不正解とする。
        recomputeCovered();

        let hasExtraWire = false;
        for (const wire of wires.values()) {
          const edges = getPathEdges(wire.a, wire.b);
          // 配線が正解経路から1区間でも外れていたら「余計な配線」
          if (edges.length === 0 || edges.some(e => !solutionMap.has(e))) {
            hasExtraWire = true;
            break;
          }
        }

        if (hasExtraWire) {
          status.textContent = "❌ 不正解！ 正解配線以外の余計な配線があります。";
          status.className = "ng";
        } else if (covered.size === solutionMap.size) {
          status.textContent = `🎉 正解！ 正解配線がすべて完成しています。配線 ${wires.size} 本。`;
          status.className = "ok";
        } else {
          const left = solutionMap.size - covered.size;
          status.textContent = `❌ 未完成です。正解配線があと ${left} 個あります。`;
          status.className = "ng";
        }
      }

      document.getElementById("clear").addEventListener("click", clearWires);
      document.getElementById("hint").addEventListener("click", showHint);
      document.getElementById("check").addEventListener("click", check);

      update();
    })();
