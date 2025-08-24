const express = require('express');
const {
  getUserPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getDashboardStats,
  getAnalytics
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getUserPosts);
router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/:id', getPost);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

module.exports = router;