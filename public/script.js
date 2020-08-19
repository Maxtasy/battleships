const userGrid = document.querySelector(".grid-user");
const opponentGrid = document.querySelector(".grid-opponent");
const shipDisplay = document.querySelector(".ship-display");
const ships = document.querySelectorAll(".ship");

const readyButton = document.querySelector("#ready");
const rotateButton = document.querySelector("#rotate");

const setupButtons = document.querySelector(".setup-buttons");

const turnDisplay = document.querySelector("#turn-display");
const infoDisplay = document.querySelector("#info-display");

const BOARD_WIDTH = 10;
const USER_SQUARES = [];
const OPPONENT_SQUARES = [];
const HITS = {
    user: {
        destroyer: 0,
        submarine: 0,
        cruiser: 0,
        battleship: 0,
        carrier: 0
    },
    opponent: {
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
let GAME_OVER = false;

// Multiplayer variables
let socket = null;
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipsPlaced = false;
let shotFiredAtId = -1;

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
];

function createBoard(grid, squares) {
    for (let i = 0; i < BOARD_WIDTH * BOARD_WIDTH; i++) {
        const square = document.createElement("div");
        square.dataset.id = i;

        if (squares === OPPONENT_SQUARES) {
            square.addEventListener("click", e => {
                handleSquareClick(e.target);
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
            let randomStart = Math.floor(Math.random() * (OPPONENT_SQUARES.length - ship.directions[0].length * direction));
                
            const isTaken = current.some(index => OPPONENT_SQUARES[randomStart + index].classList.contains("taken"));
            const isAtRightEdge = current.some(index => (randomStart + index) % BOARD_WIDTH === BOARD_WIDTH);
            const isAtLeftEdge = current.some(index => {
                if (randomStart % BOARD_WIDTH === 0) return false;
                else if ((randomStart + index) % BOARD_WIDTH === 0) return true;
                else return false;
            });
        
            if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
                current.forEach(index => {
                    OPPONENT_SQUARES[randomStart + index].classList.add("taken", ship.name);
                });
    
                placedShip = true;
            }
        }
    });
}

function rotateShips() {
    shipDisplay.classList.toggle("vertical");

    ships.forEach(ship => {
        const shipType = ship.dataset.shiptype;
        ship.classList.toggle(`${shipType}-container-vertical`);
        ship.classList.toggle(`${shipType}-container`);
    });
}

function checkForWin(player) {
    let shooter;
    let opponent;
    if (gameMode === "singleplayer") {
        shooter = (player === "user") ? "User" : "Computer";
        opponent = (shooter === "User") ? "Computer" : "User";
    } else if (gameMode === "multiplayer") {
        shooter = (player === "user") ? "User" : "Opponent";
        opponent = (shooter === "User") ? "Opponent" : "User";
    }

    if (HITS[player].destroyer === 2) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Destroyer!`;
        HITS[player].destroyer = "destroyed";
    }

    if (HITS[player].submarine === 3) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Submarine!`;
        HITS[player].submarine = "destroyed";
    }

    if (HITS[player].cruiser === 4) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Cruiser!`;
        HITS[player].cruiser = "destroyed";
    }

    if (HITS[player].battleship === 5) {
        infoDisplay.textContent = `${shooter} sunk ${opponent}'s Battleship!`;
        HITS[player].battleship = "destroyed";
    }

    if (HITS[player].carrier === 6) {
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
        infoDisplay.textContent = `${shooter} Won!`;
    }
}

function revealSquare(square) {
    if (square.classList.contains("taken")) {
        const shiptype = square.classList[1];
        HITS.user[shiptype]++;
        square.classList.add("hit");
        // square.classList.remove("taken");
        soundHit.play();
        checkForWin("user");
    } else {
        square.classList.add("miss");
        soundMiss.play();
    }

    CURRENT_PLAYER = "computer";
    singleplayerGameLoop();
}

function handleSquareClick(square) {
    if (gameMode === "singleplayer") {
        if (allShipsPlaced && CURRENT_PLAYER === "user" && !GAME_OVER) {
            if (square.classList.contains("miss") || square.classList.contains("hit")) return;
            revealSquare(square);
        }
    } else if (gameMode === "multiplayer") {
        if (CURRENT_PLAYER === "user" && ready && enemyReady && !GAME_OVER) {
            if (square.classList.contains("miss") || square.classList.contains("hit")) return;
            shootAtSquare(square);
        }
    }
}

function shootAtSquare(square) {
    shotFiredAtId = square.dataset.id;

    // Tell enemy that we shot at square with a specific ID
    socket.emit("fired-at-square", shotFiredAtId);
    
    CURRENT_PLAYER = "opponent";
    multiplayerGameLoop();
}

function executeComputersMove() {
    const availableSquares = USER_SQUARES.filter(square => {
        if (square.classList.contains("hit") || square.classList.contains("miss")) {
            return false;
        } else {
            return true;
        }
    });
    
    const randomIndex = Math.floor(Math.random() * availableSquares.length);
    const randomSquare = availableSquares[randomIndex];
        
    if (randomSquare.classList.contains("taken")) {
        const shiptype = randomSquare.classList[1];
        HITS.opponent[shiptype]++;
        randomSquare.classList.add("hit");
        // randomSquare.classList.remove("taken");
        soundHit.play();
        checkForWin("opponent");
    } else {
        randomSquare.classList.add("miss");
        soundMiss.play();
    }

    CURRENT_PLAYER = "user";

    singleplayerGameLoop();
}

function singleplayerGameLoop() {
    if (GAME_OVER) return;

    if (CURRENT_PLAYER === "user") {
        turnDisplay.textContent = "Your Go";
    } else if (CURRENT_PLAYER === "computer") {
        turnDisplay.textContent = "Computer's Go";
        setTimeout(executeComputersMove, 500);
    }
}

function multiplayerGameLoop() {
    if (GAME_OVER) return;

    if (enemyReady) {
        if (CURRENT_PLAYER === "user") {
            turnDisplay.textContent = "Your Go";
        } else if (CURRENT_PLAYER === "opponent") {
            turnDisplay.textContent = "Opponent's Go";
        }
    }
}

function setPlayerReady(playerNum) {
    const player = `.p${parseInt(playerNum) + 1}`;
    document.querySelector(`${player} .ready`).classList.add("active");
}

function startSingleplayer() {
    placeComputerShips(shipsArray);
    infoDisplay.textContent = "Place all your ships and ready up.";
}

function startMultiplayer() {
    socket = io();
    
    // Get your player number
    socket.on("player-number", num => {
        if (num === -1) {
            infoDisplay.textContent = "Sorry, the server is already full. Try again later."
        } else {
            playerNum = parseInt(num);
            if (playerNum === 1) CURRENT_PLAYER = "opponent";
    
            infoDisplay.textContent = "Place all your ships and ready up.";

            // Get other player's status
            socket.emit("check-players");
        }
    });

    // Another player has connected or disconnected
    socket.on("player-connection", num => {
        playerConnected(num);
    });

    socket.on("player-disconnection", num => {
        playerDisconnected(num);
    });

    // Opponent clicked on ready
    socket.on("enemy-ready", num => {
        enemyReady = true;
        setPlayerReady(num);
        if (ready) {
            multiplayerGameLoop();
            setupButtons.style.display = "none";
        }
    });

    // Receiving players' status from server
    socket.on("check-players", players => {
        players.forEach((player, index) => {
            if (player.connected) playerConnected(index);
            if (player.ready) {
                setPlayerReady(index);
                if (index !== playerNum) enemyReady = true;
            }
        });
    });

    // Opponent fired a shot
    socket.on("fired-at-square", squareId => {
        const square = USER_SQUARES[squareId];
        const taken = square.classList.contains("taken");
        const shiptype = (taken) ? square.classList[1] : null; 
        const squareInfo = {taken: taken, shiptype: shiptype}
        socket.emit("fire-reply", squareInfo);

        if (taken) {
            square.classList.add("hit");
            // square.classList.remove("taken");
            HITS.opponent[shiptype]++;
            soundHit.play();
            checkForWin("opponent");
        } else {
            square.classList.add("miss");
            soundMiss.play();
        }

        CURRENT_PLAYER = "user";
    });

    // Get info from opponent about the square we shot at
    socket.on("fire-reply", squareInfo => {
        if (squareInfo.taken) {
            OPPONENT_SQUARES[shotFiredAtId].classList.add("hit");
            OPPONENT_SQUARES[shotFiredAtId].classList.remove("taken");
            HITS.user[squareInfo.shiptype]++;
            soundHit.play();
            checkForWin("user");
        } else {
            OPPONENT_SQUARES[shotFiredAtId].classList.add("miss");
            soundMiss.play();
        }

        shotFiredAtId = -1;
    });

    // Notify player if their time limit ran out
    socket.on("timeout", () =>{
        infoDisplay.textContent = "You have reached the time limit.";
    });

    function playerConnected(num) {
        const player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .connected`).classList.add("active");
        if (parseInt(num) === playerNum) {
            document.querySelector(player).style.fontWeight = "bold";
        }
    }

    function playerDisconnected(num) {
        const player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .connected`).classList.remove("active");
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

    const droppedOn = (shipDisplay.classList.contains("vertical")) ? parseInt(e.target.dataset.id) - ACTIVE_SHIP_CLICK_OFFSET * BOARD_WIDTH : parseInt(e.target.dataset.id) - ACTIVE_SHIP_CLICK_OFFSET;
    const shipLength = ACTIVE_SHIP.children.length;

    if (shipDisplay.classList.contains("vertical")) {
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
            square.classList.add("taken", ACTIVE_SHIP.dataset.shiptype, "vertical");
            if (i === 0) square.classList.add("first");
            if (i === shipLength - 1) square.classList.add("last");
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
            square.classList.add("taken", ACTIVE_SHIP.dataset.shiptype, "horizontal");
            if (i === 0) square.classList.add("first");
            if (i === shipLength - 1) square.classList.add("last");
        }

        ACTIVE_SHIP.remove();
    }

    if (!shipDisplay.querySelector(".ship")) allShipsPlaced = true;
});

rotateButton.addEventListener("click", () => {
    rotateShips();
});

readyButton.addEventListener("click", () => {
    if (!allShipsPlaced) {
        alert("Place all your ships first.");
        return;
    }
    if (gameMode === "singleplayer") {
        infoDisplay.textContent = "";
        singleplayerGameLoop();
        setupButtons.style.display = "none";
    } else if (gameMode === "multiplayer") {
        infoDisplay.textContent = "";
    
        if (!ready) {
            socket.emit("player-ready");
            ready = true;
            setPlayerReady(playerNum);
        }

        if (enemyReady) setupButtons.style.display = "none";

        multiplayerGameLoop();
    }
});

createBoard(userGrid, USER_SQUARES);
createBoard(opponentGrid, OPPONENT_SQUARES);

// Start game depending on selecte game mode
if (gameMode === "singleplayer") {
    startSingleplayer();
} else if (gameMode === "multiplayer") {
    startMultiplayer();
}