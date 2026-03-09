const jwt = require('jsonwebtoken');

const authenticationMiddleware = (request, response, next) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'No authentication token provided' });
  }

  const tokenString = authorizationHeader.split(' ')[1];

  try {
    const decodedPayload = jwt.verify(tokenString, process.env.JWT_SECRET);
    request.user = decodedPayload;
    next();
  } catch (error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticationMiddleware;
