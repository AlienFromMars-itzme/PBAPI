const express = require('express');
const {
  normalize,
  parsePagination,
  sendSuccess,
  sendError,
  formatPokemon,
  computeBST,
  buildPokemonImagePaths,
  collectPokemonNames,
} = require('../helpers/routeUtils');
const { buildTypeMap, getPokemonDefensiveProfile } = require('../helpers/typeCalculator');

const includesType = (pokemon, typeName) => pokemon.type
  .map((type) => normalize(type))
  .includes(typeName);

const learnsetOverrides = new Map([
  ['nidoran♀', 'nidoranf'],
  ['nidoran♂', 'nidoranm'],
]);

const toLearnsetKey = (value) => {
  if (!value) return '';
  const normalized = value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalized.replace(/[^a-z0-9]+/g, '');
};

const getLearnsetKey = (pokemon) => {
  const englishName = pokemon.name?.english || '';
  const override = learnsetOverrides.get(englishName.toLowerCase());
  return override || toLearnsetKey(englishName);
};

module.exports = ({
  pokedex, types, moves, learnsets,
}) => {
  const router = express.Router();
  const typeMap = buildTypeMap(types);
  const pokemonById = new Map(pokedex.map((pokemon) => [String(pokemon.id), pokemon]));
  const pokemonByEnglishName = new Map(
    pokedex.map((pokemon) => [normalize(pokemon.name?.english), pokemon]),
  );
  const movesByType = new Map();
  const movesByKey = new Map();
  const learnsetsById = learnsets ? new Map(Object.entries(learnsets)) : null;

  moves.forEach((move) => {
    const typeKey = normalize(move.type);
    if (!typeKey) return;
    const existing = movesByType.get(typeKey);
    if (existing) {
      existing.push(move);
      return;
    }
    movesByType.set(typeKey, [move]);
  });

  moves.forEach((move) => {
    const moveKey = toLearnsetKey(move.name?.english);
    if (!moveKey) return;
    if (!movesByKey.has(moveKey)) {
      movesByKey.set(moveKey, move);
    }
  });

  const buildMovePayload = ({ move, moveKey, sources }) => ({
    id: move?.id || null,
    key: moveKey || (move ? toLearnsetKey(move.name?.english) : null),
    name: move?.name?.english || moveKey || null,
    type: move?.type || null,
    category: move?.category || null,
    pp: move?.pp || null,
    power: move?.power || null,
    accuracy: move?.accuracy || null,
    sources: sources || null,
  });

  const buildEvolutionNode = (pokemon, trigger = null) => {
    const nextStages = pokemon.evolution?.next || [];
    const evolvesTo = nextStages.map(([id, method]) => {
      const nextPokemon = pokemonById.get(String(id));
      if (!nextPokemon) {
        return { id, trigger: method };
      }
      return buildEvolutionNode(nextPokemon, method);
    });

    return {
      id: pokemon.id,
      name: pokemon.name?.english,
      type: pokemon.type,
      trigger,
      evolvesTo,
    };
  };

  const getEvolutionChain = (pokemon) => {
    let current = pokemon;
    while (current.evolution?.prev) {
      const prevId = Array.isArray(current.evolution.prev)
        ? current.evolution.prev[0]
        : null;
      const previous = prevId ? pokemonById.get(String(prevId)) : null;
      if (!previous) break;
      current = previous;
    }
    return buildEvolutionNode(current);
  };

  router.get('/search', (req, res) => {
    const query = normalize(req.query.q);
    if (!query) {
      return sendError(res, 400, 'Query parameter q is required.');
    }

    const matches = pokedex.filter((pokemon) => collectPokemonNames(pokemon)
      .some((name) => normalize(name).includes(query)));

    return sendSuccess(res, matches.map(formatPokemon));
  });

  router.get('/random', (req, res) => {
    const typeFilter = normalize(req.query.type);
    const candidates = typeFilter
      ? pokedex.filter((pokemon) => includesType(pokemon, typeFilter))
      : pokedex;

    if (!candidates.length) {
      return sendError(res, 404, 'No Pokemon found for the given type.');
    }

    const randomPokemon = candidates[Math.floor(Math.random() * candidates.length)];
    return sendSuccess(res, formatPokemon(randomPokemon));
  });

  router.get('/name/:name', (req, res) => {
    const name = normalize(req.params.name);
    const pokemon = pokemonByEnglishName.get(name);
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return sendSuccess(res, formatPokemon(pokemon));
  });

  router.get('/type/:type', (req, res) => {
    const type = normalize(req.params.type);
    const secondaryType = normalize(req.query.type2);
    const matches = pokedex.filter((pokemon) => includesType(pokemon, type)
      && (!secondaryType || includesType(pokemon, secondaryType)));
    return sendSuccess(res, matches.map(formatPokemon));
  });

  router.get('/:id/image', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return res.redirect(buildPokemonImagePaths(pokemon.id).hires);
  });

  router.get('/:id/sprite', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return res.redirect(buildPokemonImagePaths(pokemon.id).sprite);
  });

  router.get('/:id/thumbnail', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return res.redirect(buildPokemonImagePaths(pokemon.id).thumbnail);
  });

  router.get('/:id/weaknesses', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    const profile = getPokemonDefensiveProfile(typeMap, pokemon.type);
    return sendSuccess(res, profile);
  });

  router.get('/:id/stats', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }

    return sendSuccess(res, {
      ...pokemon.base,
      BST: computeBST(pokemon.base),
    });
  });

  router.get('/:id/moves', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }

    const { error, page, limit, offset } = parsePagination(req.query);
    if (error) {
      return sendError(res, 400, error);
    }

    const typeFilter = normalize(req.query.type);
    const categoryFilter = normalize(req.query.category);
    let matches = null;

    if (learnsetsById) {
      const learnset = learnsetsById.get(getLearnsetKey(pokemon));
      if (learnset?.learnset) {
        matches = Object.entries(learnset.learnset).map(([moveKey, sources]) => {
          const move = movesByKey.get(moveKey);
          return buildMovePayload({ move, moveKey, sources });
        });
      } else if (learnset) {
        matches = [];
      }
    }

    if (matches === null) {
      const pokemonTypes = (pokemon.type || []).map((type) => normalize(type));
      matches = pokemonTypes.flatMap((type) => movesByType.get(type) || [])
        .map((move) => buildMovePayload({ move }));
    }

    if (typeFilter) {
      matches = matches.filter((move) => normalize(move.type) === typeFilter);
    }
    if (categoryFilter) {
      matches = matches.filter((move) => normalize(move.category) === categoryFilter);
    }

    const total = matches.length;
    const data = matches.slice(offset, offset + limit);
    return sendSuccess(res, {
      data,
      total,
      page,
      limit,
    });
  });

  router.get('/:id/evolution', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return sendSuccess(res, getEvolutionChain(pokemon));
  });

  router.get('/:id', (req, res) => {
    const pokemon = pokemonById.get(String(req.params.id));
    if (!pokemon) {
      return sendError(res, 404, 'Pokemon not found.');
    }
    return sendSuccess(res, formatPokemon(pokemon));
  });

  router.get('/', (req, res) => {
    const { error, page, limit, offset } = parsePagination(req.query);
    if (error) {
      return sendError(res, 400, error);
    }

    const typeFilter = normalize(req.query.type);
    const search = normalize(req.query.search);
    const matches = pokedex.filter((pokemon) => {
      if (typeFilter && !includesType(pokemon, typeFilter)) return false;
      if (search) {
        return pokemon.name?.english
          && normalize(pokemon.name.english).includes(search);
      }
      return true;
    });

    const total = matches.length;
    const data = matches.slice(offset, offset + limit).map(formatPokemon);

    return sendSuccess(res, {
      data,
      total,
      page,
      limit,
    });
  });

  return router;
};
