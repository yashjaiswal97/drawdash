const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

let strokes = []; // Keep full drawing history

function broadcast(data, sender) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // send full history to newly joined client
  ws.send(JSON.stringify({ type: "history", strokes }));

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      return;
    }

    if (data.type === "stroke") {
      strokes.push(data.payload);
      broadcast({ type: "stroke", payload: data.payload }, ws);
    }

    if (data.type === "clear") {
      strokes = [];
      broadcast({ type: "clear" }, ws);
    }

    if (data.type === "undo") {
      strokes.pop();
      broadcast({ type: "undo" }, ws);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT)
);
