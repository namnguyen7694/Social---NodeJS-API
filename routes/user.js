const express = require("express");
const {
    userById,
    allUsers,
    getUser,
    updateUser,
    deleteUser,
    userPhoto,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower,
    findPeople,
    hasAuthorization
    
} = require("../controllers/user");
const { requireSignin, getMe } = require("../controllers/auth");

const router = express.Router();

// any route containing :userId, our app will first execute userByID()
router.param("userId", userById);

router.get("/users", requireSignin, allUsers);
router.get("/user/:userId", requireSignin, getUser);
// router.get("/user/me", requireSignin, getMe)
router.put("/user/:userId", requireSignin, hasAuthorization, updateUser);
router.delete("/user/:userId", requireSignin, hasAuthorization, deleteUser);
// photo
router.get("/user/photo/:userId", userPhoto);

router.put("/user/follow", requireSignin, addFollowing, addFollower);
router.put("/user/unfollow", requireSignin, removeFollowing, removeFollower);
router.get("/user/findpeople/:userId", requireSignin, findPeople);

module.exports = router;
