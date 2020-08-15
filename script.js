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

let isHorizontal = true;
let ACTIVE_SHIP = null;

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
            let randomStart = Math.abs(Math.floor(Math.random() * (COMPUTER_SQUARES.length - ship.directions[0].length * direction)));
                
            const isTaken = current.some(index => COMPUTER_SQUARES[randomStart + index].classList.contains("taken"));
            const isAtRightEdge = current.some(index => (randomStart + index) % BOARD_WIDTH === BOARD_WIDTH - 1);
            const isAtLeftEdge = current.some(index => (randomStart + index) % BOARD_WIDTH === 0);
        
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
    if (isHorizontal) {
        
    }
}

ships.forEach(ship => {
    ship.addEventListener("drag", e => {
        ACTIVE_SHIP = e.target;
    });
});

userGrid.addEventListener("dragover", e => {
    e.preventDefault();
});

userGrid.addEventListener("drop", e => {
    e.preventDefault();

    const droppedOn = parseInt(e.target.dataset.cellNum);
    const shipLength = ACTIVE_SHIP.children.length;
    console.log(ACTIVE_SHIP.children)

    for (let i = shipLength - 1; i >= 0; i--) {
        document.querySelector(`[data-cell-num='${droppedOn + i}']`).remove();
        userGrid.insertBefore(ACTIVE_SHIP.children[i], document.querySelector(`[data-cell-num='${droppedOn + shipLength}']`))
    }
});

createBoard(userGrid, USER_SQUARES);
createBoard(computerGrid, COMPUTER_SQUARES);
placeComputerShips(shipsArray);