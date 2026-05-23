# Pokemon REST API

REST API for Pokemon data, designed for Discord bot commands. Data is loaded from the JSON files in this repository and served directly from memory.

## Setup

```bash
npm install
npm start
```

Default port is `3000` (override with `PORT` env var).

## Response Format

All JSON responses follow:

```json
{ "success": true, "data": { } }
```

Errors use:

```json
{ "success": false, "error": "Message" }
```

## Endpoints

### Pokedex

| Method | Endpoint | Description | Query Params |
| --- | --- | --- | --- |
| GET | `/api/pokemon` | Paginated list of Pokemon | `page`, `limit`, `type`, `search` |
| GET | `/api/pokemon/:id` | Pokemon by national Pokedex number | - |
| GET | `/api/pokemon/name/:name` | Pokemon by English name (case-insensitive) | - |
| GET | `/api/pokemon/random` | Random Pokemon | `type` |
| GET | `/api/pokemon/:id/evolution` | Evolution chain | - |
| GET | `/api/pokemon/type/:type` | All Pokemon of a type | `type2` |
| GET | `/api/pokemon/:id/weaknesses` | Weaknesses/resistances/immunities | - |
| GET | `/api/pokemon/:id/stats` | Base stats + BST | - |
| GET | `/api/pokemon/:id/moves` | Moves matching Pokemon types | `page`, `limit`, `type`, `category` |
| GET | `/api/pokemon/search` | Fuzzy search across names | `q` |

### Moves

| Method | Endpoint | Description | Query Params |
| --- | --- | --- | --- |
| GET | `/api/moves` | Paginated list of moves | `page`, `limit`, `type`, `category` |
| GET | `/api/moves/:id` | Move by ID | - |
| GET | `/api/moves/name/:name` | Move by English name | - |
| GET | `/api/moves/type/:type` | Moves by type | - |

### Items

| Method | Endpoint | Description | Query Params |
| --- | --- | --- | --- |
| GET | `/api/items` | Paginated list of items | `page`, `limit`, `search` |
| GET | `/api/items/:id` | Item by ID | - |
| GET | `/api/items/name/:name` | Item by English name | - |

### Types

| Method | Endpoint | Description | Query Params |
| --- | --- | --- | --- |
| GET | `/api/types` | List all types | - |
| GET | `/api/types/:name` | Type chart by type | - |
| GET | `/api/types/matchup` | Damage multiplier | `atk`, `def`, `def2` |

### Images

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/pokemon/:id/image` | Redirect to hires image |
| GET | `/api/pokemon/:id/sprite` | Redirect to sprite image |
| GET | `/api/pokemon/:id/thumbnail` | Redirect to thumbnail image |
| GET | `/api/items/:id/sprite` | Redirect to item sprite |

### Utilities

| Method | Endpoint | Description | Query Params |
| --- | --- | --- | --- |
| GET | `/api/quiz/random` | Random Pokemon for quiz | `hint` |
| GET | `/api/compare` | Side-by-side stat comparison | `id1`, `id2` |
| GET | `/api/stats/leaderboard` | Top Pokemon by stat | `stat`, `limit` |

## Static Images

Images are served from `/images`. The API image endpoints redirect to these static assets.
