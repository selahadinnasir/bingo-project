const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');


const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins for testing
  }
});

let drawnNumbers = [];
let intervalId;
let players = {};
let winnerName = null;

// Function to generate random Bingo number (1-75)
function getRandomNumber() {
  let num;
  do {
    num = Math.floor(Math.random() * 75) + 1;
  } while (drawnNumbers.includes(num) && drawnNumbers.length < 75);
  drawnNumbers.push(num);
  return num;
}

// Start emitting random numbers every 5 seconds
function startDrawingNumbers() {
  intervalId = setInterval(() => {
    if (drawnNumbers.length >= 75) {
      clearInterval(intervalId);
      console.log("✅ All numbers drawn!");
      return;
    }
    const number = getRandomNumber();
    console.log("🎲 Number drawn:", number);
    io.emit("number-drawn", number);
  }, 5000);
}

// When a client connects
io.on('connection', (socket) => {
  console.log("📡 New client connected:", socket.id);

   // Listen for player name
   socket.on('set-name', (name) => {
    players[socket.id] = name;
    console.log(`👤 Player joined: ${name}`);
  });

  // Send drawn numbers history
  socket.emit("numbers-history", drawnNumbers);
  socket.emit("current-winner", winnerName);

  socket.on('declare-winner', (name) => {
    if (!winnerName) {
      winnerName = name;
      console.log(`🏆 Winner: ${name}`);
      io.emit("current-winner", winnerName);
    }
  });

  socket.on('disconnect', () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

app.get('/restart', (req, res) => {
  drawnNumbers = [];
  clearInterval(intervalId);
  startDrawingNumbers();
  res.send("Game restarted!");
});

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  startDrawingNumbers();
});
