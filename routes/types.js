const express = require('express');
const {
  normalize,
  sendSuccess,
  sendError,
} = require('../helpers/routeUtils');
const {
  buildTypeMap,
  getCombinedMultiplier,
  getEffectivenessLabel,
} = require('../helpers/typeCalculator');

const toTypeResponse = (type) => ({
  name: type.english,
  strengths: type.effective || [],
  weaknesses: type.ineffective || [],
  immunities: type.no_effect || [],
});

module.exports = ({ types }) => {
  const router = express.Router();
  const typeMap = buildTypeMap(types);
  const isValidType = (name) => typeMap.has(normalize(name));

  router.get('/matchup', (req, res) => {
    const atk = req.query.atk;
    const def = req.query.def;
    const def2 = req.query.def2;

    if (!atk || !def) {
      return sendError(res, 400, 'Query parameters atk and def are required.');
    }

    if (!isValidType(atk) || !isValidType(def) || (def2 && !isValidType(def2))) {
      return sendError(res, 400, 'Invalid type provided.');
    }

    const multiplier = getCombinedMultiplier(
      typeMap,
      atk,
      [def, def2].filter(Boolean),
    );

    return sendSuccess(res, {
      multiplier,
      effectiveness: getEffectivenessLabel(multiplier),
    });
  });

  router.get('/:name', (req, res) => {
    const type = typeMap.get(normalize(req.params.name));
    if (!type) {
      return sendError(res, 404, 'Type not found.');
    }
    return sendSuccess(res, toTypeResponse(type));
  });

  router.get('/', (req, res) => {
    const data = types.map(toTypeResponse);
    return sendSuccess(res, data);
  });

  return router;
};
