let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const hide = (el) => el.style.display = 'none';
const show = (el) => el.style.display = 'block';
let menu = document.getElementById('menu');
let main = document.getElementById('main');
let diffMenu = document.getElementById('difficulty-menu');
const difficulty = document.querySelectorAll('.difficulty-btn');
let mouseDown = false;
let seconds = 0;
let timer;
let cellDown;
let gameOver = false;
let gameWon = false;
let score;

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown) {
        const pos = getGridCoords(e.clientX, e.clientY);
        let i = calculatePos(pos.x, pos.y);
        if (i < 0 || i >= grid.length) {
            return;
        }
        if (cellDown && cellDown != i) {
            grid[cellDown].isDown = false;
        }
        grid[i].isDown = true;
        cellDown = i;
    }
})

canvas.addEventListener('mousedown', (e) => {
    // Draw game status
    // draw smiley
    mouseDown = true;
})

canvas.addEventListener('mouseup', (e) => {
    // change smiley
    // make cell go down
    mouseDown = false;
    if (grid[cellDown]) {
        grid[cellDown].isDown = false;
    }
})

canvas.addEventListener('click', (e) => {
    // Calculate click position within grid
    let resetButton = {
        x: (WIDTH * 16) / 2 - 12,
        y: H_HEIGHT / 2 - 12
    }
    let xPos = e.clientX - canvas.parentNode.offsetLeft;
    let yPos = e.clientY - canvas.parentNode.offsetTop;

    if (xPos >= resetButton.x && xPos < resetButton.x + 23
        && yPos >= resetButton.y && yPos < resetButton.y + 23) {
            resetGame();
    }

    if (gameOver || gameWon) {
        return;
    }

    const pos = getGridCoords(e.clientX, e.clientY);

    let i = calculatePos(pos.x, pos.y);
    if (i < 0 || i >= grid.length) {
        return;
    }

    if (grid[i].isMine) {
        grid[i].clicked = true;
    } else {
        grid[i].visible = true;
    }

    if (!grid[i].isMine) {
        gameWon = grid.filter(x => !x.isMine && x.visible).length == BOARD_SIZE - mines;
    }

    if (grid[i].count == 0 && !grid[i].isMine) {
        // enqueue and reveal non-mine neighbors
        revealOther.push(grid[i])
        while (!revealOther.length == 0) {
            let cell = revealOther.shift()
            // getNeighbors return array of adjacent cells
            if (cell.count == 0 && !cell.isMine) {
                let adjCells = getNeighbors(cell.x, cell.y).filter(val => !val.isMine && !val.visible);
                adjCells.forEach(x => revealOther.push(x));
            }
           if (!cell.isMine) {
                cell.visible = true;
            }
        }
    } else if (grid[i].isMine) {
        gameOver = true;
        grid.forEach(cell => {
            if (cell.isMine && !cell.clicked) {
                cell.visible = true;
            }
        })
    }
})

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const pos = getGridCoords(e.clientX, e.clientY);
    let i = calculatePos(pos.x, pos.y);
    grid[i].isFlag = !grid[i].isFlag;
    score = mines - grid.filter(x => x.isFlag).length;
})

difficulty.forEach(item => {
    item.addEventListener('click', event => {
        let mode = event.target.getAttribute('difficulty');
        // set game difficulty
        setupGame(mode);
        hide(diffMenu);
        hide(menu);
    })
})

const imgs = [
    'bombcell',
    'bombcellclick',
    'cell',
    'clickdown',
    'clicksmiley',
    'cool',
    'dead',
    'eightcell',
    'eightscore',
    'fivecell',
    'flagcell',
    'fourcell',
    'fourscore',
    'fivescore',
    'linescore',
    'ninescore',
    'nonescore',
    'onecell',
    'onescore',
    'sevencell',
    'sevenscore',
    'sixcell',
    'sixscore',
    'threecell',
    'threecell',
    'threescore',
    'twocell',
    'twoscore',
    'unclicksmiley',
    'zerocell',
    'zeroscore',
    'bordertop',
    'centerborder',
    'topleft',
    'borderleft',
    'bottomleft',
    'border'
]

const CELL = 16;
let grid;
let WIDTH;
let HEIGHT;
const H_HEIGHT = 64;
let H_WIDTH;
let BOARD_SIZE;
let mines;
let request;
let revealOther = [];
let loadedAssets = {};
const neighbors = [
    {x: -1, y: -1},
    {x: -1, y: 0},
    {x: -1, y: 1},
    {x: 0, y: -1},
    {x: 0, y: 1},
    {x: 1, y: -1},
    {x: 1, y: 0},
    {x: 1, y: 1},
]

const createGrid = () => {
    return Array.from({length: BOARD_SIZE}, (v, i) => ({
            visible: false,
            isMine: false,
            isFlag: false,
            isDown: false,
            clicked: false,
            count: 0,
            x: i % WIDTH,
            y: Math.floor(i / WIDTH)
        }))
}

const getGridCoords = (x, y) => {
    return {
        x: pixelToGrid(x, canvas.parentNode.offsetLeft),
        y: pixelToGrid(y, canvas.parentNode.offsetTop + H_HEIGHT),
    }
}

const getNeighbors = (x, y) => {
    return neighbors.map(neighbor => ({ x:neighbor.x + x, y:neighbor.y + y }))
    .filter(val => val.x >= 0 && val.x < WIDTH && val.y >= 0 && val.y < HEIGHT)
    .map(val => grid[calculatePos(val.x, val.y)]);
}

const pixelToGrid = (pos, offset) => Math.floor((pos - offset) / CELL);

const calculatePos = (x, y) => (y * WIDTH + x);

const generateMine = (size) => Math.floor(Math.random() * Math.floor(size));

function loadImage(url) {
    return new Promise((resolve, reject) => { 
        let i = new Image();
        i.src = url;
        i.onload = (() => resolve(i));
        i.onerror = () => reject(new Error(`could not load asset ${url}`))
    })
}

const setupGrid = (mines) => {
    placeMines(mines)
    getAdjValues();
}

const resetGame = () => {
    grid = createGrid();
    placeMines(mines);
    getAdjValues();
    seconds = 0;
    gameOver = gameWon = false;
    score = mines;
}


const placeMines = (mines) => {
    for (let i = 0; i < mines; i++) {
        let minePos = generateMine(grid.length);
        // Prevent two mines from occupying same location
        while (grid[minePos].isMine) {
            minePos = generateMine(grid.length);
        }
        grid[minePos].isMine = true
    }
}

const getAdjValues = () => {
    grid.forEach((val) => {
        val.count = getNeighbors(val.x, val.y).filter(cell => cell.isMine).length;
    })
}

const drawGrid = () => {
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            let cell = grid[calculatePos(x, y)];
            let yPos = y * CELL + H_HEIGHT
            if (cell.isMine && cell.clicked) {
                // Game over!
                ctx.drawImage(loadedAssets['bombcellclick'], x * CELL, yPos);
            } else if (cell.isMine && cell.visible) {
                ctx.drawImage(loadedAssets['bombcell'], x * CELL, yPos);
            } else if (cell.isFlag) {
                ctx.drawImage(loadedAssets['flagcell'], x * CELL, yPos);
            } else if (cell.count == 0 && cell.visible) {
                ctx.drawImage(loadedAssets['zerocell'], x * CELL, yPos);
            } else if (cell.count == 1 && cell.visible) {
                ctx.drawImage(loadedAssets['onecell'], x * CELL, yPos);
            } else if (cell.count == 2 && cell.visible) {
                ctx.drawImage(loadedAssets['twocell'], x * CELL, yPos);
            } else if (cell.count == 3 && cell.visible) {
                ctx.drawImage(loadedAssets['threecell'], x * CELL, yPos);
            } else if (cell.count == 4 && cell.visible) {
                ctx.drawImage(loadedAssets['fourcell'], x * CELL, yPos);
            } else if (cell.count == 5 && cell.visible) {
                ctx.drawImage(loadedAssets['fivecell'], x * CELL, yPos);
            } else if (cell.count == 6 && cell.visible) {
                ctx.drawImage(loadedAssets['sixcell'], x * CELL, yPos);
            } else if (cell.count == 7 && cell.visible) {
                ctx.drawImage(loadedAssets['sevencell'], x * CELL, yPos);
            } else if (cell.count == 8 && cell.visible) {
                ctx.drawImage(loadedAssets['eightcell'], x * CELL, yPos);
            } else if (cell.isDown == true) {
                ctx.drawImage(loadedAssets['zerocell'], x * CELL, yPos);
            }  else {
                ctx.drawImage(loadedAssets['cell'], x * CELL, yPos);
            }
        }
    }
}

const drawHeader = () => {
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < 4; y++) {
            if (y == 0) {
                ctx.drawImage(loadedAssets['border'], x * 16, y * 16);
            } else if (y == 3) {
                ctx.drawImage(loadedAssets['border'], x * 16, y * 16);
            } else {
                ctx.drawImage(loadedAssets['centerborder'], x * 16, y * 16);
            }
        }
    }

    let yPos = H_HEIGHT / 2 - 12;
    // Draw game status
    if (gameOver) {
        ctx.drawImage(loadedAssets['dead'], (WIDTH * 16) / 2 - 12, yPos);
    } else if (mouseDown) {
        ctx.drawImage(loadedAssets['clickdown'], (WIDTH * 16) / 2 - 12, yPos);
    } else {
        ctx.drawImage(loadedAssets['unclicksmiley'], (WIDTH * 16) / 2 - 12, yPos);
    }



}

const getScoreImages = (digits) => {
    let imgs = [];
    for (let i = 0; i < 3; i++) {
        if (digits[i]) {
            let digit = digits[i]
            switch (digit) {
                case "0":
                    imgs.push('zeroscore');
                    break;
                case "1":
                    imgs.push('onescore');
                    break;
                case "2":
                    imgs.push('twoscore');
                    break;
                case "3":
                    imgs.push('threescore');
                    break;
                case "4":
                    imgs.push('fourscore');
                    break;
                case "5":
                    imgs.push('fivescore');
                    break;
                case "6":
                    imgs.push('sixscore');
                    break;
                case "7":
                    imgs.push('sevenscore');
                    break;
                case "8":
                    imgs.push('eightscore');
                    break;
                case "9":
                    imgs.push('ninescore');
                    break;
            }
        }
        else {
            imgs.unshift('nonescore')
        }
    }
    return imgs
}

const splitDigits = (digits) => {
    return (""+digits).split("");
}

const drawTime = () => {
    let yPos = H_HEIGHT / 2 - 12;
    // Time
    if (seconds > 999) {
        seconds = 0;
    }
    let digits = splitDigits(seconds)
    let toDraw = getScoreImages(digits);

    toDraw.forEach((num, i) => {
        ctx.drawImage(loadedAssets[num], (WIDTH * 16) - (10 + (13 * (3 - i))), yPos);
    })
}

const drawScore = () => {
    let yPos = H_HEIGHT / 2 - 12;
    let scoreDraw = getScoreImages(splitDigits(score));
    scoreDraw.forEach((val, i) => {
        ctx.drawImage(loadedAssets[val], 10 + i * 13, yPos);
    })
    // Score
    // ctx.drawImage(loadedAssets['nonescore'], 10, yPos);
    // ctx.drawImage(loadedAssets['onescore'], 23, yPos);
    // ctx.drawImage(loadedAssets['threescore'], 36, yPos);
}

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHeader();
    drawTime();
    drawScore();
    drawGrid();
}

const loop = () => {
    draw();
    request = requestAnimationFrame(loop)
}

const initBoard = (difficulty) => {
    if (difficulty === 'novice') {
        WIDTH = 8;
        HEIGHT = 8;
        mines = 10;
    } else if (difficulty === 'intermediate') {
        WIDTH = 16;
        HEIGHT = 16;
        mines = 40;
    } else {
        WIDTH = 31;
        HEIGHT = 16;
        mines = 99;
    }
    BOARD_SIZE = WIDTH * HEIGHT;
    H_WIDTH = WIDTH;
    canvas.width = WIDTH * 16;
    canvas.height = HEIGHT * 16 + 64;
    score = mines;
}

const setupGame = (difficulty) => {
    // Set game dimensions based on difficulty
    initBoard(difficulty);

    // Set up grid
    grid = createGrid();
    setupGrid(mines);

    // Start timer
    setInterval(() => {
        seconds++
    }, 1000);

    // Start game
    request = requestAnimationFrame(loop);
} 

const startGame = () => {
    hide(main);
    // hide(menu);
    show(diffMenu);
    // setupGrid(mines);
    // request = requestAnimationFrame(loop);
}

const mainMenu = () => {
    show(menu);
    show(main);
}

let loadAssets = () => {
    // Load the game assets
    imgs.forEach((val) => {
        let imgPath = './assets/' + val + '.png';
        loadImage(imgPath).then(
            result => loadedAssets[val] = result,
            error => console.log(error)
        )
    });
    mainMenu();
}

loadAssets();
