import jwt from "jsonwebtoken";

const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organization: user.organization ? (user.organization._id || user.organization) : undefined,
    },
    process.env.JWT_ACCESS_TOKEN,
    {
      expiresIn: getSecondsUntilMidnight(),
    }
  );
};

export const generateRefreshToken = (user) => {
  let expiresIn = "7d";

  switch (user.role) {
    case "super_admin":
      expiresIn = "8h";
      break;
    case "admin":
      expiresIn = "12h";
      break;
    case "warden":
      expiresIn = "24h";
      break;
    case "student":
    case "parent":
    default:
      expiresIn = "7d";
      break;
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organization: user.organization ? (user.organization._id || user.organization) : undefined,
    },
    process.env.JWT_REFRESH_TOKEN,
    {
      expiresIn,
    }
  );
};