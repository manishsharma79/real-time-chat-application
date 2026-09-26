const bcrypt = require("bcryptjs");
const User = require("../models/User");

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "name username email profilePicture isOnline lastSeen bio"
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=
const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { name: regex }],
    }).select("name username email profilePicture isOnline lastSeen bio");

    res.json(users);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name username email profilePicture isOnline lastSeen bio"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, username } = req.body;
    const user = req.user;

    if (username && username.toLowerCase() !== user.username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) return res.status(400).json({ message: "Username already taken" });
      user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (req.file) user.profilePicture = `/uploads/${req.file.filename}`;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, searchUsers, getUserById, updateProfile, updatePassword };
