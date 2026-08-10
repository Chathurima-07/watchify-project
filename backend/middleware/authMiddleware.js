import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {

    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (req.user?.role === "mentor" && req.user.mentorStatus === "disabled") {
        return res.status(403).json({ message: "Account disabled. Contact an administrator." });
      }

      next();

    } catch (error) {
      return res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
};