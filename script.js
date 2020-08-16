const userGrid = document.querySelector(".grid-user");
const computerGrid = document.querySelector(".grid-computer");
const displayGrid = document.querySelector(".grid-display");
const ships = document.querySelectorAll(".ship");

const startButton = document.querySelector("#start");
const rotateButton = document.querySelector("#rotate");

const turnDisplay = document.querySelector("#turn-display");
const infoDisplay = document.querySelector("#info-display");

const BOARD_WIDTH = 10;
const USER_SQUARES = [];
const COMPUTER_SQUARES = [];
const HITS = {
    user: {
        destroyer: 0,
        submarine: 0,
        cruiser: 0,
        battleship: 0,
        carrier: 0
    },
    computer: {
        destroyer: 0,
        submarine: 0,
        cruiser: 0,
        battleship: 0,
        carrier: 0
    }
}

const soundHit = new Audio();
soundHit.src = "sound/hit.ogg";
soundHit.volume = .1;

const soundMiss = new Audio();
soundMiss.src = "sound/miss.ogg";
soundMiss.volume = .1;

let ACTIVE_SHIP = null;
let ACTIVE_SHIP_CLICK_OFFSET = null;
let CURRENT_PLAYER = "user";
let GAME_STARTED = false;
let GAME_OVER = false;

const shipsArray = [
    {
        name: "destroyer",
        directions: [
            [0, 1],
            [0, BOARD_WIDTH]
        ]
    },
    {
        name: "submarine",
        directions: [
            [0, 1, 2],
            [0, BOARD_WIDTH, BOARD_WIDTH * 2]
        ]
    },
    {
        name: "cruiser",
        directions: [
            [0, 1, 2, 3],
            [0, BOARD_WIDTH, BOARD_WIDTH * 2, BOARD_WIDTH * 3]
        ]
    },
    {
        name: "battleship",
        directions: [
            [0, 1, 2, 3, 4],
            [0, BOARD_WIDTH, BOARD_WIDTH * 2, BOARD_WIDTH * 3, BOARD_WIDTH * 4]
        ]
    },
    {
        name: "carrier",
        directions: [
            [0, 1, 2, 3, 4, 5],
            [0, BOARD_WIDTH, BOARD_WIDTH * 2, BOARD_WIDTH * 3, BOARD_WIDTH * 4, BOARD_WIDTH * 5]
        ]
    },
]

function createBoard(grid, squares) {
    for (let i = 0; i < BOARD_WIDTH * BOARD_WIDTH; i++) {
        const square = document.createElement("div");
        square.dataset.id = i;

        if (squares === COMPUTER_SQUARES) {
            square.addEventListener("click", e => {
                revealSquare(e.target);
            });
        }

        grid.appendChild(square);
        squares.push(square);
    }
}

function placeComputerShips(shipsArray) {
    shipsArray.forEach(ship => {
        let placedShip = false;

        while (!placedShip) {
            let randomDirectionIndex = Math.floor(Math.random() * ship.directions.length);
            let current = ship.directions[randomDirectionIndex];
            if (randomDirectionIndex === 0) direction = 1;
            if (randomDirectionIndex === 1) direction = BOARD_WIDTH;
            let randomStart = Math.floor(Math.random() * (COMPUTER_SQUARES.length - ship.directions[0].length * direction));
                
            const isTaken = current.some(index => COMPUTER_SQUARES[randomStart + index].classList.contains("taken"));
            const isAtRightEdge = current.some(index => (randomStart + index) % BOARD_WIDTH === BOARD_WIDTH);
            const isAtLeftEdge = current.some(index => {
                if (randomStart % BOARD_WIDTH === 0) return false;
                else if ((randomStart + index) % BOARD_WIDTH === 0) return true;
                else return false;
            });
        
            if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
                current.forEach(index => {
                    COMPUTER_SQUARES[randomStart + index].classList.add("taken", ship.name);
                });
    
                placedShip = true;
            }
        }
    });
}

function rotateShips() {
    displayGrid.classList.toggle("vertical");
}

function checkForWin(player) {
    const shooter = (player === "user") ? "User" : "Computer";
    const opponent = (shooter === "User") ? "Computer" : "User";

    if (HITS[player].destroyer === 2) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Destroyer!`;
        HITS[player].destroyer = "destroyed";
    }

    if (HITS[player].submarine === 3) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Submarine!`;
        HITS[player].submarine = "destroyed";
    }

    if (HITS.user.cruiser === 4) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Cruiser!`;
        HITS[player].cruiser = "destroyed";
    }

    if (HITS.user.battleship === 5) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Battleship!`;
        HITS[player].battleship = "destroyed";
    }

    if (HITS.user.carrier === 6) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Carrier!`;
        HITS[player].carrier = "destroyed";
    }

    let remainingShips = false;

    Object.keys(HITS[player]).forEach(key => {
        if (HITS[player][key] !== "destroyed") {
            remainingShips = true;
            return;
        }
    });

    if (!remainingShips) {
        GAME_OVER = true;
        infoDisplay.textContent = `${shooter} Won!`
    }
}

function revealSquare(square) {
    if (!GAME_STARTED || CURRENT_PLAYER !== "user") return;
    if (square.classList.contains("taken")) {
        const shiptype = square.classList[1];
        HITS.user[shiptype]++;
        square.classList.add("hit");
        square.classList.remove("taken");
        soundHit.play();
        checkForWin("user");
    } else {
        square.classList.add("miss");
        soundMiss.play();
    }

    CURRENT_PLAYER = "computer";

    gameLoop();
}

function executeComputerMove() {
    const availableSquares = USER_SQUARES.filter(square => {
        if (square.classList.contains("hit") || square.classList.contains("miss")) {
            return false;
        } else {
            return true;
        }
    })

    
    const randomIndex = Math.floor(Math.random() * availableSquares.length);
    const randomSquare = availableSquares[randomIndex];
        
    if (randomSquare.classList.contains("taken")) {
        const shiptype = randomSquare.classList[1];
        HITS.computer[shiptype]++;
        randomSquare.classList.add("hit");
        randomSquare.classList.remove("taken");
        soundHit.play();
        checkForWin("computer");
    } else {
        randomSquare.classList.add("miss");
        soundMiss.play();
    }

    CURRENT_PLAYER = "user";

    gameLoop();
}

function gameLoop() {
    GAME_STARTED = true;
    if (GAME_OVER) return;

    if (CURRENT_PLAYER === "user") {
        turnDisplay.textContent = "Your Go";
    } else if (CURRENT_PLAYER === "computer") {
        turnDisplay.textContent = "Computer's Go";
        setTimeout(executeComputerMove, 500);
    }
}

ships.forEach(ship => {
    ship.addEventListener("dragstart", e => {
        const partID = parseInt(e.explicitOriginalTarget.id.substr(-1));
        ACTIVE_SHIP_CLICK_OFFSET = partID;
        ACTIVE_SHIP = e.target;
    });
});

userGrid.addEventListener("dragover", e => {
    e.preventDefault();
});

userGrid.addEventListener("drop", e => {
    e.preventDefault();

    const droppedOn = (displayGrid.classList.contains("vertical")) ? parseInt(e.target.dataset.id) - ACTIVE_SHIP_CLICK_OFFSET * BOARD_WIDTH : parseInt(e.target.dataset.id) - ACTIVE_SHIP_CLICK_OFFSET;
    const shipLength = ACTIVE_SHIP.children.length;

    if (displayGrid.classList.contains("vertical")) {
        if (droppedOn + shipLength * BOARD_WIDTH >= BOARD_WIDTH * BOARD_WIDTH + BOARD_WIDTH) {
            return;
        }

        for (let i = 0; i < shipLength; i++) {
            const square = document.querySelector(`[data-id='${droppedOn + i * BOARD_WIDTH}']`);
            if (!square || square.classList.contains("taken")) {
                return;
            }
        }

        for (let i = 0; i < shipLength; i++) {
            const square = document.querySelector(`[data-id='${droppedOn + i * BOARD_WIDTH}']`);
            square.classList.add("taken", ACTIVE_SHIP.dataset.shiptype);
        }

        ACTIVE_SHIP.remove();
    } else {
        if ((droppedOn % BOARD_WIDTH) + shipLength > BOARD_WIDTH) {
            return;
        }

        for (let i = 0; i < shipLength; i++) {
            const square = document.querySelector(`[data-id='${droppedOn + i}']`);
            if (!square || square.classList.contains("taken")) {
                return;
            }
        }

        for (let i = 0; i < shipLength; i++) {
            const square = document.querySelector(`[data-id='${droppedOn + i}']`);
            square.classList.add("taken", ACTIVE_SHIP.dataset.shiptype);
        }

        ACTIVE_SHIP.remove();
    }
});

rotateButton.addEventListener("click", () => {
    rotateShips();
});

startButton.addEventListener("click", gameLoop);

createBoard(userGrid, USER_SQUARES);
createBoard(computerGrid, COMPUTER_SQUARES);
placeComputerShips(shipsArray);