const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle a socket connection request from web client
const connections = [null, null];

io.on("connection", socket => {
    // Find an available player number
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] === null) {
            playerIndex = i;
            break;
        }
    }

    // Tell the connecting player which player number they are
    socket.emit("player-number", playerIndex);
    console.log(`Player ${parseInt(playerIndex) + 1} has connected.`)

    // Ignore further players if 2 are already available
    if (playerIndex === -1) return;

    connections[playerIndex] = false;

    // Tell everyone which player number just connected
    socket.broadcast.emit("player-connection", playerIndex);

    // Handle disconnect
    socket.on("disconnect", () =>{
        console.log(`Player ${parseInt(playerIndex) + 1} disconnected.`);
        connections[playerIndex] = null;

        // Tell everyone which player number just disconnected
        socket.broadcast.emit("player-disconnection", playerIndex);
    });

    // Player clicked ready button
    socket.on("player-ready", () => {
        console.log(`Player ${parseInt(playerIndex) + 1} is ready.`);

        socket.broadcast.emit("enemy-ready", playerIndex);
        connections[playerIndex] = true;
    });

    // Check player connections
    socket.on("check-players", () => {
        const players = [];
        for (const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]});
        }
        socket.emit("check-players", players);
    });

    // Player fired a shot on a square
    socket.on("fired-at-square", shotFiredAtId => {
        console.log(`Player ${parseInt(playerIndex) + 1} shot at square ${shotFiredAtId}`);

        // Emit the move to the other player
        socket.broadcast.emit("fired-at-square", shotFiredAtId);
    });

    // Opponent sent back info of hit square
    socket.on("fire-reply", squareInfo => {
        // console.log(`Sending back info of square.`);

        // Forward the info to the shooter
        socket.broadcast.emit("fire-reply", squareInfo);
    });

    // Timeout connection
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit("timeout");
        socket.disconnect();
    }, 600000); // 10 minutes limit per player
});