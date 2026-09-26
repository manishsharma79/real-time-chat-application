const express = require("express");
const router = express.Router();
const {
  getUsers,
  searchUsers,
  getUserById,
  updateProfile,
  updatePassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.get("/search", searchUsers);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/profile", upload.single("profilePicture"), updateProfile);
router.put("/password", updatePassword);

module.exports = router;
