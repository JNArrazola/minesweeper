const menu = document.getElementById('menu');
const gameView = document.getElementById('game-view');
const gridElement = document.getElementById('grid');
const gameStatus = document.getElementById('game-status');
const flagsCountElement = document.getElementById('flags-count');
const startCustomBtn = document.getElementById('start-custom');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const exitGameBtn = document.getElementById('exit-game');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let rows, cols, mines;
let grid = [];
let mineLocations = [];
let firstClick = true;
let flags = 0;
let cellsRevealed = 0;
let totalCells;

const difficulties = {
    facil: { rows: 9, cols: 9, mines: 10 },
    medio: { rows: 16, cols: 16, mines: 40 },
    dificil: { rows: 16, cols: 30, mines: 99 },
    hardcore: { rows: 24, cols: 30, mines: 180 },
    leyenda: { rows: 30, cols: 30, mines: 300 }
};

function showGameView() {
    menu.style.display = 'none';
    gameView.style.display = 'flex';
}

function showMenu() {
    gameView.style.display = 'none';
    menu.style.display = 'flex';
}

startCustomBtn.addEventListener('click', () => {
    const customRows = parseInt(document.getElementById('rows').value);
    const customCols = parseInt(document.getElementById('cols').value);
    const customMines = parseInt(document.getElementById('mines').value);

    if (customRows < 5 || customCols < 5) {
        alert('El tamaño mínimo del tablero es 5x5.');
        return;
    }

    if (customMines >= customRows * customCols) {
        alert('La cantidad de minas debe ser menor que el total de celdas.');
        return;
    }

    rows = customRows;
    cols = customCols;
    mines = customMines;
    initGame();
    showGameView();
});

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const difficulty = btn.getAttribute('data-difficulty');
        const config = difficulties[difficulty];
        if (config) {
            rows = config.rows;
            cols = config.cols;
            mines = config.mines;
            initGame();
            showGameView();
        }
    });
});

exitGameBtn.addEventListener('click', () => {
    resetGame();
    showMenu();
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error al intentar entrar en pantalla completa: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = 'Salir de Pantalla Completa';
    } else {
        fullscreenBtn.textContent = 'Pantalla Completa';
    }
});

function initGame() {
    grid = [];
    mineLocations = [];
    firstClick = true;
    flags = 0;
    cellsRevealed = 0;
    totalCells = rows * cols;
    gameStatus.textContent = 'Juego en progreso...';
    gridElement.innerHTML = '';

    flagsCountElement.textContent = mines - flags;

    gridElement.style.setProperty('--cols', cols);
    gridElement.style.setProperty('--rows', rows);

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = {
                row: r,
                col: c,
                isMine: false,
                adjacentMines: 0,
                revealed: false,
                flagged: false
            };
            row.push(cell);

            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.setAttribute('data-row', r);
            cellElement.setAttribute('data-col', c);
            cellElement.addEventListener('click', onCellClick);
            cellElement.addEventListener('contextmenu', onCellRightClick);
            gridElement.appendChild(cellElement);
        }
        grid.push(row);
    }
}

function resetGame() {
    grid = [];
    mineLocations = [];
    firstClick = true;
    flags = 0;
    cellsRevealed = 0;
    totalCells = 0;
    gridElement.innerHTML = '';
    gameStatus.textContent = 'Selecciona una configuración para comenzar.';
    flagsCountElement.textContent = '0';
    fullscreenBtn.textContent = 'Pantalla Completa';
}

function onCellClick(e) {
    const row = parseInt(e.target.getAttribute('data-row'));
    const col = parseInt(e.target.getAttribute('data-col'));
    const cell = grid[row][col];

    if (cell.flagged || cell.revealed) return;

    if (firstClick) {
        placeMines(row, col);
        calculateAdjacents();
        firstClick = false;
    }

    revealCell(row, col);

    checkWin();
}

function onCellRightClick(e) {
    e.preventDefault();
    const row = parseInt(e.target.getAttribute('data-row'));
    const col = parseInt(e.target.getAttribute('data-col'));
    const cell = grid[row][col];

    if (cell.revealed) return;

    if (!cell.flagged && flags >= mines) {
        return;
    }

    cell.flagged = !cell.flagged;
    const cellElement = e.target;
    if (cell.flagged) {
        cellElement.classList.add('flagged');
        flags++;
    } else {
        cellElement.classList.remove('flagged');
        flags--;
    }

    flagsCountElement.textContent = mines - flags;
}

function placeMines(initialRow, initialCol) {
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if ((r === initialRow && c === initialCol) || grid[r][c].isMine) continue;

        grid[r][c].isMine = true;
        mineLocations.push({ r, c });
        minesPlaced++;
    }
}

function calculateAdjacents() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1],  [1, 0], [1, 1]
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].isMine) continue;
            let count = 0;
            directions.forEach(dir => {
                const nr = r + dir[0];
                const nc = c + dir[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
                    count++;
                }
            });
            grid[r][c].adjacentMines = count;
        }
    }
}

function revealCell(r, c) {
    const cell = grid[r][c];
    const cellElement = getCellElement(r, c);

    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    cellsRevealed++;
    cellElement.classList.add('revealed');

    if (cell.isMine) {
        cellElement.classList.add('mine');
        gameOver(false);
        return;
    }

    if (cell.adjacentMines > 0) {
        cellElement.textContent = cell.adjacentMines;
        cellElement.style.color = getNumberColor(cell.adjacentMines);
    } else {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1]
        ];
        directions.forEach(dir => {
            const nr = r + dir[0];
            const nc = c + dir[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                revealCell(nr, nc);
            }
        });
    }
}

function getCellElement(r, c) {
    return gridElement.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
}

function gameOver(win) {
    mineLocations.forEach(loc => {
        const cell = grid[loc.r][loc.c];
        const cellElement = getCellElement(loc.r, loc.c);
        if (!cell.revealed) {
            cellElement.classList.add('mine');
        }
    });

    if (win) {
        gameStatus.textContent = '¡Felicidades! ¡Has ganado!';
    } else {
        gameStatus.textContent = '¡Has perdido!';
    }

    const allCells = gridElement.querySelectorAll('.cell');
    allCells.forEach(cell => {
        cell.removeEventListener('click', onCellClick);
        cell.removeEventListener('contextmenu', onCellRightClick);
    });
}

function checkWin() {
    if (cellsRevealed === totalCells - mines) {
        gameOver(true);
    }
}

function getNumberColor(number) {
    const colors = {
        1: 'blue',
        2: 'green',
        3: 'red',
        4: 'darkblue',
        5: 'brown',
        6: 'cyan',
        7: 'black',
        8: 'gray'
    };
    return colors[number] || 'black';
}
