const express = require('express');
const {
  normalize,
  parsePagination,
  sendSuccess,
  sendError,
} = require('../helpers/routeUtils');

module.exports = ({ moves }) => {
  const router = express.Router();
  const movesById = new Map(moves.map((move) => [String(move.id), move]));
  const movesByEnglishName = new Map(
    moves.map((move) => [normalize(move.name?.english), move]),
  );

  router.get('/name/:name', (req, res) => {
    const name = normalize(req.params.name);
    const move = movesByEnglishName.get(name);
    if (!move) {
      return sendError(res, 404, 'Move not found.');
    }
    return sendSuccess(res, move);
  });

  router.get('/type/:type', (req, res) => {
    const type = normalize(req.params.type);
    const matches = moves.filter((move) => normalize(move.type) === type);
    return sendSuccess(res, matches);
  });

  router.get('/:id', (req, res) => {
    const move = movesById.get(String(req.params.id));
    if (!move) {
      return sendError(res, 404, 'Move not found.');
    }
    return sendSuccess(res, move);
  });

  router.get('/', (req, res) => {
    const { error, page, limit, offset } = parsePagination(req.query);
    if (error) {
      return sendError(res, 400, error);
    }

    const typeFilter = normalize(req.query.type);
    const categoryFilter = normalize(req.query.category);
    const matches = moves.filter((move) => {
      if (typeFilter && normalize(move.type) !== typeFilter) return false;
      if (categoryFilter && normalize(move.category) !== categoryFilter) return false;
      return true;
    });

    const total = matches.length;
    const data = matches.slice(offset, offset + limit);
    return sendSuccess(res, {
      data,
      total,
      page,
      limit,
    });
  });

  return router;
};
