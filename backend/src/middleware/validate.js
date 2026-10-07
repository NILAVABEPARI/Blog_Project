/**
 * validate({ body, params, query })
 * Parses each part with its Zod schema. Parsed (coerced, trimmed, stripped) values replace
 * req.body / req.params; parsed query values are exposed as req.validatedQuery because
 * req.query is read-only in Express 5.
 */
const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
