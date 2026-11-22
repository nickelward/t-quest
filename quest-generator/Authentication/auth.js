const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const [scheme, token] = authHeader ? authHeader.split(" ") : [];

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      error: "Token required"
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "Authentication service unavailable"
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          error: "Invalid token"
        });
      }

      req.user = user;
      next();
    }
  );
}

module.exports = authenticateToken;