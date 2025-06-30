import jwt from "jsonwebtoken";

const authenticateUser = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({ success: false, message: "Not authorized, please log in again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    req.user = { userId: decoded.id }; // Store userId in req.user
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authenticateUser;