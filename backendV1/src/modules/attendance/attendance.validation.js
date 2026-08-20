export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateWindowIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid attendance window ID.",
    });
  }

  next();
};

export const validateScanQR = (req, res, next) => {
  const { qrToken } = req.body;

  if (!qrToken || qrToken.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "QR Token is required.",
    });
  }

  next();
};
