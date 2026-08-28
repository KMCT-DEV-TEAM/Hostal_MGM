const sendSuccess = (res, statusCode, message, payload = {}) => {
  let finalPayload = payload;
  // If payload is a Mongoose document, convert it to a plain object to prevent circular references (like $session)
  if (payload && typeof payload.toJSON === 'function') {
    finalPayload = payload.toJSON();
  }

  if (Array.isArray(finalPayload)) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: finalPayload,
    });
  }
  
  return res.status(statusCode).json({
    success: true,
    message,
    ...finalPayload,
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
