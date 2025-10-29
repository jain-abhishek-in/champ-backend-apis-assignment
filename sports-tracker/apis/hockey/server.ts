import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type EventType =
  | "GOAL"
  | "PENALTY"
  | "SHOT"
  | "SAVE"
  | "HIT"
  | "FACEOFF"
  | "POWER_PLAY";

interface Game {
  id: string;
  teams: [string, string];
  score: { team1: number; team2: number };
  period: number;
  status: string;
  events: Array<{
    type: EventType;
    team?: string;
    period: number;
    time: string;
  }>;
}

let games: Game[] = [];
for (let i = 1; i <= 3; i++) {
  games.push({
    id: `H${i}`,
    teams: [`Team ${i}A`, `Team ${i}B`],
    score: { team1: 0, team2: 0 },
    period: 1,
    status: Math.random() > 0.5 ? "LIVE" : "SCHEDULED",
    events: [],
  });
}

// Update games at random intervals (1-10 seconds)
function updateGames() {
  games.forEach((game) => {
    // Start scheduled games randomly
    if (game.status === "SCHEDULED" && Math.random() > 0.7) {
      game.status = "LIVE";
      game.period = 1;
    }

    if (game.status === "LIVE") {
      const rand = Math.random();
      const team = Math.random() > 0.5 ? "team1" : "team2";

      // GOAL (8% chance)
      if (rand > 0.92) {
        game.score[team]++;
        game.events.push({
          type: "GOAL",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // SHOT (15% chance)
      else if (rand > 0.77) {
        game.events.push({
          type: "SHOT",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // SAVE (10% chance)
      else if (rand > 0.67) {
        game.events.push({
          type: "SAVE",
          team: team === "team1" ? "team2" : "team1", // Opposite team's goalie
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // PENALTY (5% chance)
      else if (rand > 0.62) {
        game.events.push({
          type: "PENALTY",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // HIT (8% chance)
      else if (rand > 0.54) {
        game.events.push({
          type: "HIT",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // FACEOFF (6% chance)
      else if (rand > 0.48) {
        game.events.push({
          type: "FACEOFF",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }
      // POWER_PLAY (3% chance)
      else if (rand > 0.45) {
        game.events.push({
          type: "POWER_PLAY",
          team,
          period: game.period,
          time: new Date().toISOString(),
        });
      }

      // Advance period
      if (rand > 0.98 && game.period < 3) {
        game.period++;
      } else if (game.period >= 3 && rand > 0.99) {
        game.status = "FINAL";
      }
    }

    // Reset finished games to create new matches
    if (game.status === "FINAL" && Math.random() > 0.8) {
      game.status = "SCHEDULED";
      game.period = 1;
      game.score = { team1: 0, team2: 0 };
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
  const game = games.find((g) => g.id === req.params.id);
  res.json(game || { error: "Not found" });
});

app.listen(3003, () => {
  console.log("🏒 Hockey API running on port 3003");
});
