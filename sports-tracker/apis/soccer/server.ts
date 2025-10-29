import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type EventType =
  | "GOAL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "CORNER"
  | "SUBSTITUTION"
  | "PENALTY";

interface Match {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  minute: number;
  status: string;
  events: Array<{
    type: EventType;
    minute: number;
    team: string;
    time: string;
  }>;
}

let matches: Match[] = [];
for (let i = 1; i <= 3; i++) {
  matches.push({
    matchId: `M${i}`,
    homeTeam: `Team ${i}A`,
    awayTeam: `Team ${i}B`,
    score: { home: 0, away: 0 },
    minute: 0,
    status: Math.random() > 0.5 ? "LIVE" : "SCHEDULED",
    events: [],
  });
}

// Update matches at random intervals (1-10 seconds)
function updateMatches() {
  matches.forEach((match) => {
    // Start scheduled matches randomly
    if (match.status === "SCHEDULED" && Math.random() > 0.7) {
      match.status = "LIVE";
      match.minute = 0;
    }

    if (match.status === "LIVE") {
      match.minute++;

      const rand = Math.random();
      const team = Math.random() > 0.5 ? "home" : "away";

      // GOAL (10% chance)
      if (rand > 0.9) {
        match.score[team]++;
        match.events.push({
          type: "GOAL",
          minute: match.minute,
          team,
          time: new Date().toISOString(),
        });
      }
      // YELLOW_CARD (5% chance)
      else if (rand > 0.85) {
        match.events.push({
          type: "YELLOW_CARD",
          minute: match.minute,
          team,
          time: new Date().toISOString(),
        });
      }
      // CORNER (8% chance)
      else if (rand > 0.77) {
        match.events.push({
          type: "CORNER",
          minute: match.minute,
          team,
          time: new Date().toISOString(),
        });
      }
      // SUBSTITUTION (3% chance)
      else if (rand > 0.74) {
        match.events.push({
          type: "SUBSTITUTION",
          minute: match.minute,
          team,
          time: new Date().toISOString(),
        });
      }
      // RED_CARD (1% chance)
      else if (rand > 0.73) {
        match.events.push({
          type: "RED_CARD",
          minute: match.minute,
          team,
          time: new Date().toISOString(),
        });
      }

      if (match.minute >= 90) {
        match.status = "FINISHED";
      }
    }

    // Reset finished matches to create new games
    if (match.status === "FINISHED" && Math.random() > 0.8) {
      match.status = "SCHEDULED";
      match.minute = 0;
      match.score = { home: 0, away: 0 };
      match.events = [];
    }
  });

  // Schedule next update with random delay (1-10 seconds)
  const randomDelay = Math.floor(Math.random() * 9000) + 1000;
  setTimeout(updateMatches, randomDelay);
}

// Start updating
updateMatches();

app.get("/api/matches", (req, res) => {
  res.json({ matches });
});

app.get("/api/matches/:id", (req, res) => {
  const match = matches.find((m) => m.matchId === req.params.id);
  res.json(match || { error: "Not found" });
});

app.listen(3001, () => {
  console.log("⚽ Soccer API running on port 3001");
});
