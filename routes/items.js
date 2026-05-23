const express = require('express');
const {
  normalize,
  parsePagination,
  sendSuccess,
  sendError,
  buildItemImagePath,
  formatItem,
} = require('../helpers/routeUtils');

module.exports = ({ items }) => {
  const router = express.Router();
  const itemsById = new Map(items.map((item) => [String(item.id), item]));
  const itemsByEnglishName = new Map(
    items.map((item) => [normalize(item.name?.english), item]),
  );

  router.get('/name/:name', (req, res) => {
    const name = normalize(req.params.name);
    const item = itemsByEnglishName.get(name);
    if (!item) {
      return sendError(res, 404, 'Item not found.');
    }
    return sendSuccess(res, formatItem(item));
  });

  router.get('/:id/sprite', (req, res) => {
    const item = itemsById.get(String(req.params.id));
    if (!item) {
      return sendError(res, 404, 'Item not found.');
    }
    return res.redirect(buildItemImagePath(item.id));
  });

  router.get('/:id', (req, res) => {
    const item = itemsById.get(String(req.params.id));
    if (!item) {
      return sendError(res, 404, 'Item not found.');
    }
    return sendSuccess(res, formatItem(item));
  });

  router.get('/', (req, res) => {
    const { error, page, limit, offset } = parsePagination(req.query);
    if (error) {
      return sendError(res, 400, error);
    }

    const search = normalize(req.query.search);
    const matches = items.filter((item) => {
      if (!search) return true;
      const name = normalize(item.name?.english);
      const description = normalize(item.description);
      return name.includes(search) || description.includes(search);
    });

    const total = matches.length;
    const data = matches.slice(offset, offset + limit).map(formatItem);
    return sendSuccess(res, {
      data,
      total,
      page,
      limit,
    });
  });

  return router;
};
