const express = require('express');
const {
    getPosts,
    createPost,
    postsByUser,
    postById,
    isPoster,
    updatePost,
    deletePost,
    photo,
    singlePost,
    like,
    unlike,
    comment,
    uncomment,
    updateComment
} = require('../controllers/post');
const { requireSignin } = require('../controllers/auth');
const { userById } = require('../controllers/user');
const { createPostValidator } = require('../validator');

const router = express.Router();

// post routes
router.post('/post/new/:userId', requireSignin, createPost, createPostValidator);
router.get('/posts', getPosts);
router.get('/posts/by/:userId', requireSignin, postsByUser);
router.get('/post/:postId', singlePost);
router.put('/post/:postId', requireSignin, isPoster, updatePost);
router.delete('/post/:postId', requireSignin, isPoster, deletePost);
// photo
router.get('/post/photo/:postId', photo);
// like unlike
router.put('/posts/like', requireSignin, like);
router.put('/posts/unlike', requireSignin, unlike);

// comments
router.put('/posts/comment', requireSignin, comment);
router.put('/posts/uncomment', requireSignin, uncomment);
router.put('/posts/updatecomment', requireSignin, updateComment);

// any route containing :userId, app will first execute userById()
router.param('userId', userById);
// any route containing :postId, app will first execute postById()
router.param('postId', postById);

module.exports = router;
