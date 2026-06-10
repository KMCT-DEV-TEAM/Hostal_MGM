const sendSuccess = (res, statusCode, message, payload = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...payload,
  });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export {
  sendSuccess,
  sendError
};
