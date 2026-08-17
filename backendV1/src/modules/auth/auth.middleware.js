import jwt from 'jsonwebtoken';
import asyncHandler from '../../utils/asyncHandler.js';
import { sendError } from '../../utils/response.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return sendError(res, 401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
    req.user = decoded; // { id, role, organization, name }
    next();
  } catch (error) {
    console.error(error);
    return sendError(res, 401, 'Not authorized, token failed');
  }
});
