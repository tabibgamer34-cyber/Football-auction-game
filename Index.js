const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const players = [
  { name: "Lionel Messi", club: "Inter Miami" },
  { name: "Kylian Mbappé", club: "Real Madrid" },
  { name: "Erling Haaland", club: "Man City" },
  { name: "Vinícius Júnior", club: "Real Madrid" },
  { name: "Jude Bellingham", club: "Real Madrid" },
  { name: "Mohamed Salah", club: "Liverpool" },
  // Add more players here if you want!
];

let currentIndex = 0;
let currentBid = 0;
let currentBidder = "No one";
let endTime = Date.now() + 15000;
let timer;

function startAuction() {
  currentBid = 0;
  currentBidder = "No one";
  endTime = Date.now() + 15000;
  const player = players[currentIndex];
  io.emit("newPlayer", { player, bid: 0, bidder: "No one", timeLeft: 15000 });
  clearTimeout(timer);
  timer = setTimeout(endAuction, 15000);
}

function endAuction() {
  io.emit("sold", { player: players[currentIndex], bid: currentBid, winner: currentBidder });
  currentIndex = (currentIndex + 1) % players.length;
  startAuction();
}

io.on("connection", (socket) => {
  const timeLeft = Math.max(0, endTime - Date.now());
  socket.emit("newPlayer", {
    player: players[currentIndex],
    bid: currentBid,
    bidder: currentBidder,
    timeLeft
  });

  socket.on("bid", (amount) => {
    if (amount <= currentBid || Date.now() > endTime) return;
    currentBid = amount;
    currentBidder = socket.id.slice(0, 6); // short temp name
    endTime = Date.now() + 5000;
    io.emit("newBid", { bid: currentBid, bidder: currentBidder, timeLeft: 5000 });
    clearTimeout(timer);
    timer = setTimeout(endAuction, 5000);
  });
});

startAuction();

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server on port ${port}`));
