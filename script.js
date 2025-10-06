// --- 設定 ---
const ROWS = 20; // 縦のマス数
const COLS = 10; // 横のマス数
const BLOCK_SIZE = 25; // 1マスのピクセルサイズ
let score = 0;
let isGameOver = false;

// ボードの状態を管理する二次元配列
// 0: 空, 1-7: 固定されたブロック
let board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

// ミノの形状と色（対応するCSSクラス名）
const TETROMINOS = [
    // 形状は4x4の配列で定義（1がブロック、0が空）
    { shape: [[1, 1, 1, 1]], color: 'I' }, // I
    { shape: [[1, 1], [1, 1]], color: 'O' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'T' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'J' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'L' }, // L
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'S' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'Z' }  // Z
];

// 現在落下中のミノ
let currentTetromino;
let currentX; // ボード上のX座標（左上）
let currentY; // ボード上のY座標（左上）

// --- 初期化 ---

// ゲームボードのHTML要素を作成
function createBoard() {
    const container = document.getElementById('game-container');
    container.style.gridTemplateColumns = `repeat(${COLS}, ${BLOCK_SIZE}px)`;
    container.style.gridTemplateRows = `repeat(${ROWS}, ${BLOCK_SIZE}px)`;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${r}-${c}`;
            container.appendChild(cell);
        }
    }
}

// 新しいミノを生成
function newTetromino() {
    // 7種類からランダムに選択
    const randIndex = Math.floor(Math.random() * TETROMINOS.length);
    currentTetromino = { ...TETROMINOS[randIndex] }; // コピーして独立させる

    // 初期位置を設定 (中央上部)
    currentX = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
    currentY = 0;

    // 生成位置で衝突したらゲームオーバー
    if (checkCollision(0, 0, currentTetromino.shape)) {
        isGameOver = true;
        document.getElementById('message').classList.remove('hidden');
        clearInterval(gameLoopInterval); // ゲームループを停止
    }
}

// --- ゲームロジック ---

// 衝突判定
function checkCollision(dx, dy, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const newRow = currentY + r + dy;
                const newCol = currentX + c + dx;

                // 範囲外 or 既に固定されたブロックと衝突
                if (newCol < 0 || newCol >= COLS || newRow >= ROWS || board[newRow][newCol]) {
                    // Y座標が0未満（画面上部）で衝突するのは許容（生成時のみチェック）
                    if (newRow < 0) continue;
                    return true;
                }
            }
        }
    }
    return false;
}

// ミノをボードに固定する
function lockTetromino() {
    for (let r = 0; r < currentTetromino.shape.length; r++) {
        for (let c = 0; c < currentTetromino.shape[r].length; c++) {
            if (currentTetromino.shape[r][c]) {
                const row = currentY + r;
                const col = currentX + c;
                // ミノのインデックス（色）をボードに書き込む
                board[row][col] = TETROMINOS.findIndex(t => t.color === currentTetromino.color) + 1;
            }
        }
    }
    checkLines();
    newTetromino(); // 次のミノを生成
}

// ライン消去判定
function checkLines() {
    let linesCleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
        // その行がすべてブロックで埋まっているかチェック
        if (board[r].every(cell => cell !== 0)) {
            linesCleared++;
            // 行を消去（上の行をコピーしてくる）
            for (let k = r; k > 0; k--) {
                board[k] = [...board[k - 1]]; // 上の行をコピー
            }
            board[0].fill(0); // 一番上の行を空にする
            r++; // 行が詰まったので、同じ行をもう一度チェック
        }
    }

    if (linesCleared > 0) {
        // スコア加算 (単純化)
        score += linesCleared * 100;
        document.getElementById('score').textContent = `スコア: ${score}`;
    }
}

// ミノの回転
function rotateTetromino() {
    const shape = currentTetromino.shape;
    // 新しい形状の配列を作成（転置して反転）
    const newShape = shape[0].map((_, colIndex) =>
        shape.map(row => row[colIndex]).reverse()
    );

    // 回転後の形状で衝突しないかチェック
    if (!checkCollision(0, 0, newShape)) {
        currentTetromino.shape = newShape;
    }
}

// 描画処理 (HTMLを更新)
function draw() {
    // 1. ボード全体を空に描画
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            cell.className = 'cell'; // CSSクラスをリセット

            if (board[r][c]) {
                // 固定ブロック
                const colorIndex = board[r][c] - 1;
                cell.classList.add('block', TETROMINOS[colorIndex].color);
            }
        }
    }

    // 2. 落下中のミノを描画
    for (let r = 0; r < currentTetromino.shape.length; r++) {
        for (let c = 0; c < currentTetromino.shape[r].length; c++) {
            if (currentTetromino.shape[r][c]) {
                const row = currentY + r;
                const col = currentX + c;

                // 画面内のセルのみ描画
                if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                    const cell = document.getElementById(`cell-${row}-${col}`);
                    cell.classList.add('block', currentTetromino.color);
                }
            }
        }
    }
}

// ゲームループ（落下処理）
function gameLoop() {
    if (isGameOver) return;

    // 1マス下に移動できるかチェック
    if (!checkCollision(0, 1, currentTetromino.shape)) {
        currentY++; // 落下
    } else {
        // 移動できない場合は固定
        lockTetromino();
    }
    draw();
}

// --- キーボード操作 ---
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    switch (e.key) {
        case 'ArrowLeft': // 左移動
            if (!checkCollision(-1, 0, currentTetromino.shape)) currentX--;
            break;
        case 'ArrowRight': // 右移動
            if (!checkCollision(1, 0, currentTetromino.shape)) currentX++;
            break;
        case 'ArrowDown': // ソフトドロップ
            if (!checkCollision(0, 1, currentTetromino.shape)) currentY++;
            break;
        case 'ArrowUp': // 回転
        case 'x':
            rotateTetromino();
            break;
    }
    draw(); // 操作後はすぐに描画を更新
});

// --- ゲーム開始 ---
createBoard();
newTetromino();
// 1秒ごとに落下（速度調整可能）
const gameLoopInterval = setInterval(gameLoop, 1000); 

// 初回描画
draw();
