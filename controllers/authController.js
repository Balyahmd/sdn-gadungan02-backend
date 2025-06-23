import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const user = await User.findByUsernameOrEmail(trimmedUsername);

    // Validate username/email
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username not found",
        error: "USER_NOT_FOUND",
      });
    }

    // Validate password
    const validPass = await User.comparePassword(
      trimmedPassword,
      user.password
    );

    if (!validPass) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
        error: "INVALID_PASSWORD",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: req.app.locals.hashids.encode(user.id),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const verify = async (req, res) => {
  res.json({
    success: true,
    user: {
      ...req.user,
      id: req.app.locals.hashids.encode(req.user.id)
    },
  });
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
