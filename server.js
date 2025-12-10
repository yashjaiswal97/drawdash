// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// serve static files from ./public
app.use(express.static(path.join(__dirname, "public")));

// In-memory state (simple demo)
let strokes = []; // drawing history
let scores = [0, 0]; // scores for player index 0 and 1
let names = {0: "Player 1", 1: "Player 2"};
let currentRound = null; // { drawerIndex, secret, endsAt, timer }

// Broadcast helper
function broadcast(data, except = null) {
  const raw = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (c !== except && c.readyState === WebSocket.OPEN) c.send(raw);
  });
}

function send(client, data) {
  if (client && client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send current state to new client
  send(ws, { type: "history", strokes });
  send(ws, { type: "scores", scores });
  send(ws, { type: "names", names });
  if (currentRound) {
    // If a round is active, send round-start info (including secret)
    // We broadcast the secret in the round-start payload; clients will only show it if they are the drawer (honor system).
    send(ws, {
      type: "round-start",
      payload: {
        drawerIndex: currentRound.drawerIndex,
        secret: currentRound.secret,
        duration: Math.max(0, Math.round((currentRound.endsAt - Date.now()) / 1000)),
        startAt: Date.now(),
      },
    });
  }

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.warn("Invalid JSON:", msg);
      return;
    }

    switch (data.type) {
      // client registers/updates names (optional)
      case "set-names": {
        const payload = data.payload || {};
        if (payload[0]) names[0] = String(payload[0]).slice(0, 32);
        if (payload[1]) names[1] = String(payload[1]).slice(0, 32);
        broadcast({ type: "names", names });
        break;
      }

      // drawing actions
      case "stroke": {
        const payload = data.payload;
        if (!payload) break;
        strokes.push(payload);
        broadcast({ type: "stroke", payload }, ws);
        break;
      }
      case "clear": {
        strokes = [];
        broadcast({ type: "clear" }, ws);
        break;
      }
      case "undo": {
        strokes.pop();
        broadcast({ type: "undo" }, ws);
        break;
      }

      // Game control: start round
      case "start-round": {
        // payload: { drawerIndex: 0|1, duration: seconds, names: {0,1} }
        const payload = data.payload || {};
        const drawerIndex = Number(payload.drawerIndex) === 1 ? 1 : 0;
        const duration = Number(payload.duration) || 60;

        // update names if supplied
        if (payload.names) {
          if (payload.names[0]) names[0] = String(payload.names[0]).slice(0, 32);
          if (payload.names[1]) names[1] = String(payload.names[1]).slice(0, 32);
          broadcast({ type: "names", names });
        }

        // End any previous round
        if (currentRound && currentRound.timer) {
          clearTimeout(currentRound.timer);
          currentRound = null;
        }

        // choose secret word
        const WORDS = [
          "apple","bicycle","guitar","house","elephant","computer","pizza","rainbow","airplane","camera",
          "mountain","basketball","flower","banana","shark","cloud","book","umbrella","key","dragon",
          "rocket","bridge","sushi","tree","sunglasses","piano","clock","hat","boat","island"
        ];
        const secret = WORDS[Math.floor(Math.random() * WORDS.length)];

        const round = {
          drawerIndex,
          secret,
          endsAt: Date.now() + duration * 1000,
        };
        // schedule end
        round.timer = setTimeout(() => {
          // on timeout, broadcast round-end with no winner
          currentRound = null;
          broadcast({ type: "round-end", payload: { winnerIndex: null, secret } });
        }, duration * 1000);

        currentRound = round;

        // broadcast round-start to all clients (includes secret; clients decide whether to show)
        broadcast({
          type: "round-start",
          payload: {
            drawerIndex: round.drawerIndex,
            secret: round.secret,
            duration,
            startAt: Date.now(),
          },
        });
        break;
      }

      // Guess sent by client
      case "guess": {
        // payload: { playerIndex, text }
        const payload = data.payload || {};
        const playerIndex = payload.playerIndex === 1 ? 1 : 0;
        const text = String(payload.text || "").trim();

        // Broadcast the guess to all clients (so they can show it in chat)
        broadcast({ type: "guess", payload: { playerIndex, text, byName: names[playerIndex] } });

        // If round active and guess matches secret (case-insensitive)
        if (currentRound && currentRound.secret && text.toLowerCase() === String(currentRound.secret).toLowerCase()) {
          // award point
          scores[playerIndex] = (scores[playerIndex] || 0) + 1;

          // clear round timer
          if (currentRound.timer) clearTimeout(currentRound.timer);
          const secret = currentRound.secret;
          currentRound = null;

          // broadcast round-end with winner and updated scores
          broadcast({ type: "round-end", payload: { winnerIndex: playerIndex, secret, scores } });
          // also broadcast scores separately
          broadcast({ type: "scores", scores });
        }
        break;
      }

      // explicit next-turn (swap drawer) -> clients handle drawerIndex locally, we'll just broadcast command
      case "next-turn": {
        // payload: { nextDrawerIndex }
        const nd = data.payload && Number(data.payload.nextDrawerIndex) === 1 ? 1 : 0;
        // stop current round if any
        if (currentRound && currentRound.timer) {
          clearTimeout(currentRound.timer);
          currentRound = null;
        }
        broadcast({ type: "next-turn", payload: { nextDrawerIndex: nd } });
        break;
      }

      // request full state (clients can ask)
      case "request-state": {
        send(ws, { type: "history", strokes });
        send(ws, { type: "scores", scores });
        send(ws, { type: "names", names });
        if (currentRound) {
          send(ws, {
            type: "round-start",
            payload: {
              drawerIndex: currentRound.drawerIndex,
              secret: currentRound.secret,
              duration: Math.max(0, Math.round((currentRound.endsAt - Date.now()) / 1000)),
              startAt: Date.now(),
            },
          });
        }
        break;
      }

      default:
        // unknown
        break;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
