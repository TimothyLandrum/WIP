const { getUserById } = require("../db");
const jwt = require('jsonwebtoken');

function requireUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader){
    return res.status(401).send({ error: 'Authorization header required' });
  }

  const token = authHeader.replace('Bearer', '').trim();

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

  if (id) {
    getUserById(id)
      .then(user => {
        if (!user) {
          return res.status(404).send({ error: 'User not found' });
        }

        req.user = user;
        next();
      })
      .catch(err => {
        next(err);
      });
  } else {
    return res.status(401).send({ error: 'Invalid token' });
  }
} catch (err) {
  return res.status(401).send({ error: 'Invalid token', details: err.message });
}
}


module.exports = {
  requireUser
}