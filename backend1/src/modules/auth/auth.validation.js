const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and Password are required",
    });
  }

  next();
};

const validateRefreshToken = (req, res, next) => {
  const token = req.cookies?.refreshToken;

  req.token = token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  next();
};

export {
  validateLogin,
  validateRefreshToken,
}
