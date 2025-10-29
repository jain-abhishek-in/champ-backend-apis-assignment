import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type EventType =
  | "ACE"
  | "DOUBLE_FAULT"
  | "WINNER"
  | "BREAK_POINT"
  | "CHALLENGE"
  | "UNFORCED_ERROR";

interface Game {
  gameId: string;
  player1: string;
  player2: string;
  setScore: Array<{ p1: number; p2: number }>;
  status: string;
  events: Array<{
    type: EventType;
    player: number;
    time: string;
  }>;
}

let games: Game[] = [];
for (let i = 1; i <= 3; i++) {
  games.push({
    gameId: `T${i}`,
    player1: `Player ${i}A`,
    player2: `Player ${i}B`,
    setScore: [{ p1: 0, p2: 0 }],
    status: Math.random() > 0.5 ? "IN_PROGRESS" : "SCHEDULED",
    events: [],
  });
}

// Update games at random intervals (1-10 seconds)
function updateGames() {
  games.forEach((game) => {
    // Start scheduled games randomly
    if (game.status === "SCHEDULED" && Math.random() > 0.7) {
      game.status = "IN_PROGRESS";
    }

    if (game.status === "IN_PROGRESS") {
      const rand = Math.random();

      if (rand > 0.75) {
        const player = Math.random() > 0.5 ? 1 : 2;
        const currentSet = game.setScore[game.setScore.length - 1];

        // Different event types
        let eventType: EventType = "WINNER";
        if (rand > 0.95) eventType = "ACE";
        else if (rand > 0.9) eventType = "DOUBLE_FAULT";
        else if (rand > 0.85) eventType = "BREAK_POINT";
        else if (rand > 0.8) eventType = "UNFORCED_ERROR";
        else if (rand > 0.77) eventType = "CHALLENGE";

        game.events.push({
          type: eventType,
          player,
          time: new Date().toISOString(),
        });

        // Update score on certain events
        if (["ACE", "WINNER", "BREAK_POINT"].includes(eventType)) {
          if (player === 1) currentSet.p1++;
          else currentSet.p2++;

          if (currentSet.p1 >= 6 || currentSet.p2 >= 6) {
            if (game.setScore.length < 2) {
              game.setScore.push({ p1: 0, p2: 0 });
            } else {
              game.status = "COMPLETED";
            }
          }
        }
      }
    }

    // Reset completed games to create new matches
    if (game.status === "COMPLETED" && Math.random() > 0.8) {
      game.status = "SCHEDULED";
      game.setScore = [{ p1: 0, p2: 0 }];
      game.events = [];
    }
  });

  // Schedule next update with random delay (1-10 seconds)
  const randomDelay = Math.floor(Math.random() * 9000) + 1000;
  setTimeout(updateGames, randomDelay);
}

// Start updating
updateGames();

app.get("/api/games", (req, res) => {
  res.json({ games });
});

app.get("/api/games/:id", (req, res) => {
  const game = games.find((g) => g.gameId === req.params.id);
  res.json(game || { error: "Not found" });
});

app.listen(3002, () => {
  console.log("🎾 Tennis API running on port 3002");
});
