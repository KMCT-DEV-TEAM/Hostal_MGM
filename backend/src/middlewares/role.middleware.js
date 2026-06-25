const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `You are not authorized to perform this action , only ${roles.join(", ")} can perform this action , your role is ${req.user.role}`,
      });
    }

    next();
  };
};

export default roleMiddleware;