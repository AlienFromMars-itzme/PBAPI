const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const pokemonRoutes = require('./routes/pokemon');
const moveRoutes = require('./routes/moves');
const itemRoutes = require('./routes/items');
const typeRoutes = require('./routes/types');
const utilsRoutes = require('./routes/utils');

const loadJson = (fileName) => {
  const candidates = [
    path.join(__dirname, 'data', fileName),
    path.join(__dirname, fileName),
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    throw new Error(`Missing required data file: ${fileName}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const data = {
  pokedex: loadJson('pokedex.json'),
  moves: loadJson('moves.json'),
  items: loadJson('items.json'),
  types: loadJson('types.json'),
};

const app = express();
app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/pokemon', pokemonRoutes(data));
app.use('/api/moves', moveRoutes(data));
app.use('/api/items', itemRoutes(data));
app.use('/api/types', typeRoutes(data));
app.use('/api', utilsRoutes(data));

app.get('/', (req, res) => {
  res.json({ success: true, data: 'Pokemon API is running.' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Pokemon API listening on port ${port}`);
});
