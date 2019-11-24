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
    hasAuthorization,
    getMe
    
} = require("../controllers/user");
const { requireSignin} = require("../controllers/auth");

const router = express.Router();

router.get("/users", allUsers);
router.get("/user/myinfo", requireSignin, getMe);

router.get("/user/:userId", getUser);
router.put("/user/:userId", requireSignin, hasAuthorization, updateUser);
router.delete("/user/:userId", requireSignin, hasAuthorization, deleteUser);
// photo
router.get("/user/photo/:userId", userPhoto);

router.put("/users/follow", requireSignin, addFollowing, addFollower);
router.put("/users/unfollow", requireSignin, removeFollowing, removeFollower);
router.get("/user/findpeople/:userId", requireSignin, findPeople);

// any route containing :userId, app will first execute userByID()
router.param("userId", userById);

module.exports = router;
