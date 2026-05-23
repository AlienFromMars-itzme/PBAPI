const express = require('express');
const {
  normalize,
  sendSuccess,
  sendError,
  formatPokemon,
  computeBST,
  buildPokemonImagePaths,
} = require('../helpers/routeUtils');

const statKeyMap = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  speed: 'Speed',
  'sp. attack': 'Sp. Attack',
  'sp. defense': 'Sp. Defense',
  bst: 'BST',
};

module.exports = ({ pokedex }) => {
  const router = express.Router();
  const pokemonById = new Map(pokedex.map((pokemon) => [String(pokemon.id), pokemon]));

  router.get('/quiz/random', (req, res) => {
    const pokemon = pokedex[Math.floor(Math.random() * pokedex.length)];
    const includeHint = normalize(req.query.hint) === 'true';

    const payload = {
      id: pokemon.id,
      image: buildPokemonImagePaths(pokemon.id),
    };

    if (includeHint) {
      payload.hint = { types: pokemon.type };
    }

    return sendSuccess(res, payload);
  });

  router.get('/compare', (req, res) => {
    const id1 = String(req.query.id1 || '');
    const id2 = String(req.query.id2 || '');
    if (!id1 || !id2) {
      return sendError(res, 400, 'Query parameters id1 and id2 are required.');
    }

    const pokemon1 = pokemonById.get(id1);
    const pokemon2 = pokemonById.get(id2);

    if (!pokemon1 || !pokemon2) {
      return sendError(res, 404, 'One or both Pokemon were not found.');
    }

    return sendSuccess(res, {
      left: formatPokemon(pokemon1),
      right: formatPokemon(pokemon2),
    });
  });

  router.get('/stats/leaderboard', (req, res) => {
    const statParam = normalize(req.query.stat);
    if (!statParam) {
      return sendError(res, 400, 'Query parameter stat is required.');
    }

    const statKey = statKeyMap[statParam];
    if (!statKey) {
      return sendError(res, 400, 'Invalid stat parameter.');
    }

    const limitParam = req.query.limit === undefined
      ? 10
      : Number.parseInt(req.query.limit, 10);
    if (Number.isNaN(limitParam) || limitParam < 1) {
      return sendError(res, 400, 'Invalid limit parameter.');
    }
    const limit = Math.min(limitParam, 100);

    const leaderboard = pokedex
      .map((pokemon) => {
        const base = pokemon.base || {};
        const value = statKey === 'BST' ? computeBST(base) : base[statKey];
        return {
          id: pokemon.id,
          name: pokemon.name?.english,
          type: pokemon.type,
          value,
          image: buildPokemonImagePaths(pokemon.id),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return sendSuccess(res, {
      stat: statKey,
      limit,
      leaderboard,
    });
  });

  return router;
};
