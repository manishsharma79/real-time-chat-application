const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "Hey there! I am using ChatApp." },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketIds: [{ type: String }], // supports multiple tabs/devices
  },
  { timestamps: true }
);

userSchema.index({ username: "text", name: "text" });

module.exports = mongoose.model("User", userSchema);
