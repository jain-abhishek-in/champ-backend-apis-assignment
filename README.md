# Backend Assignment - Sports Event Tracker

## 🎯 The Task

You have 3 sport APIs running live. Each API exposes match events but with **different data structures**.

**Your mission:** Record all events and show the current state of every game in all sports.

---

## 🏗️ What You Get

We provide everything you need:

- **3 Sport APIs** running on Docker (Soccer, Tennis, Hockey)
- **MongoDB** for storage
- **Kafka** for messaging (optional to use - bonus)

Just run `docker-compose up` and start building!

---

## 🚀 Quick Start

```bash
# 1. Start everything
docker-compose up -d

# 2. Test the APIs
curl http://localhost:3001/api/matches    # Soccer
curl http://localhost:3002/api/games      # Tennis
curl http://localhost:3003/api/games      # Hockey

# 3. Build your solution!
```

**💡 Tip:** Import `Sports-APIs.postman_collection.json` into Postman to test all endpoints easily!

---

## 📡 The APIs

### Soccer API (Port 3001)

```bash
GET /api/matches       # All matches
GET /api/matches/:id   # Single match
```

**Structure:** `matchId`, `homeTeam`, `awayTeam`, `score`, `minute`, `status`, `events[]`  
**Events:** GOAL, YELLOW_CARD, RED_CARD, CORNER, SUBSTITUTION, PENALTY

### Tennis API (Port 3002)

```bash
GET /api/games         # All games
GET /api/games/:id     # Single game
```

**Structure:** `gameId`, `player1`, `player2`, `setScore[]`, `status`, `events[]`  
**Events:** ACE, DOUBLE_FAULT, WINNER, BREAK_POINT, CHALLENGE, UNFORCED_ERROR

### Hockey API (Port 3003)

```bash
GET /api/games         # All games
GET /api/games/:id     # Single game
```

**Structure:** `id`, `teams[]`, `score`, `period`, `status`, `events[]`  
**Events:** GOAL, PENALTY, SHOT, SAVE, HIT, FACEOFF, POWER_PLAY

**Note:** Each API updates at random intervals (1-10 seconds). Games progress, scores change, events happen!

---

## 🎯 What to Build

**Required:**

1. Record data from all 3 APIs
2. Organize the data on the database
3. Expose 1 API that provides current game states - every game entity has the same generic structure no matter the sport type

---

## 📝 Submission

Create a GitHub repo with your solution and send us the link.

Include:

- Your code
- README with setup instructions
- Brief explanation of your approach

**Time:** This should take appox. 2 hours.

---

## 🔧 Infrastructure Details

**MongoDB:**

```
mongodb://admin:password@localhost:27017
```

**Kafka:**

```
localhost:9092
```

---

Good luck! 🚀
