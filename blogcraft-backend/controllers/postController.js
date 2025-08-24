const Post = require('../models/post');

// Get all posts for a user
exports.getUserPosts = async (req, res) => {
  try {
    const { status, search, sort } = req.query;
    let query = { authorId: req.user._id };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search in title, content, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    let sortOption = {};
    // Sort options
    switch(sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }
    
    const posts = await Post.find(query).sort(sortOption);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, status, featuredImage } = req.body;
    
    const post = await Post.create({
      title,
      content,
      category,
      tags: tags || [],
      status: status || 'draft',
      featuredImage: featuredImage || '',
      authorId: req.user._id
    });
    
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { title, content, category, tags, status, featuredImage } = req.body;
    
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category,
        tags: tags || [],
        status,
        featuredImage: featuredImage || '',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const publishedPosts = await Post.find({ 
      authorId: req.user._id, 
      status: 'published' 
    });
    
    const totalViews = publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalLikes = publishedPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = publishedPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
    
    // Get recent posts
    const recentPosts = await Post.find({ authorId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      totalPosts: publishedPosts.length,
      totalViews,
      totalLikes,
      totalComments,
      recentPosts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const publishedPosts = await Post.find({ 
      authorId: req.user._id, 
      status: 'published' 
    });
    
    if (publishedPosts.length === 0) {
      return res.json({
        avgViews: 0,
        engagementRate: '0%',
        popularCategory: '-',
        topPosts: []
      });
    }
    
    const totalViews = publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalLikes = publishedPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = publishedPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
    
    const avgViews = Math.round(totalViews / publishedPosts.length);
    const engagementRate = totalViews > 0 
      ? Math.round(((totalLikes + totalComments) / totalViews) * 100) 
      : 0;
    
    // Find most popular category
    const categoryStats = {};
    publishedPosts.forEach(post => {
      categoryStats[post.category] = (categoryStats[post.category] || 0) + (post.views || 0);
    });
    
    const popularCategory = Object.keys(categoryStats).reduce((a, b) => 
      categoryStats[a] > categoryStats[b] ? a : b, '-'
    );
    
    // Top performing posts
    const topPosts = publishedPosts
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    
    res.json({
      avgViews,
      engagementRate: engagementRate + '%',
      popularCategory,
      topPosts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};