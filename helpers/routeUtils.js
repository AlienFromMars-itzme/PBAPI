const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalize = (value) => (value === undefined || value === null
  ? ''
  : value.toString().trim().toLowerCase());

const parsePagination = (query) => {
  const page = query.page === undefined ? 1 : Number.parseInt(query.page, 10);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number.parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) {
    return { error: 'Invalid page parameter.' };
  }

  if (Number.isNaN(limit) || limit < 1) {
    return { error: 'Invalid limit parameter.' };
  }

  const boundedLimit = Math.min(limit, MAX_LIMIT);
  return { page, limit: boundedLimit, offset: (page - 1) * boundedLimit };
};

const sendSuccess = (res, data) => res.json({ success: true, data });

const sendError = (res, status, message) => res.status(status).json({ success: false, error: message });

const buildPokemonImagePaths = (id) => {
  const paddedId = String(id).padStart(3, '0');
  return {
    hires: `/images/pokedex/hires/${paddedId}.png`,
    sprite: `/images/pokedex/sprites/${paddedId}.png`,
    thumbnail: `/images/pokedex/thumbnails/${paddedId}.png`,
  };
};

const buildItemImagePath = (id) => `/images/items/sprites/${id}.png`;

const computeBST = (baseStats) => {
  if (!baseStats) return 0;
  return baseStats.HP
    + baseStats.Attack
    + baseStats.Defense
    + baseStats['Sp. Attack']
    + baseStats['Sp. Defense']
    + baseStats.Speed;
};

const formatPokemon = (pokemon) => ({
  ...pokemon,
  base: {
    ...pokemon.base,
    BST: computeBST(pokemon.base),
  },
  image: buildPokemonImagePaths(pokemon.id),
});

const formatItem = (item) => ({
  ...item,
  sprite: buildItemImagePath(item.id),
});

const collectPokemonNames = (pokemon) => {
  const names = pokemon.name || {};
  return [names.english, names.japanese, names.chinese, names.french].filter(Boolean);
};

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalize,
  parsePagination,
  sendSuccess,
  sendError,
  buildPokemonImagePaths,
  buildItemImagePath,
  computeBST,
  formatPokemon,
  formatItem,
  collectPokemonNames,
};
