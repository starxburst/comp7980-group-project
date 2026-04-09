const mongoose = require('mongoose')
const Post     = require('../models/Post')
const Follow   = require('../models/Follow')
const Comment  = require('../models/Comment')
const MyPet    = require('../models/MyPet')
const { uploadFile } = require('../utils/uploadToMinio')

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toObjectId(id) {
  return new mongoose.Types.ObjectId(id)
}

function serializePopulatedPost(post, currentUserId) {
  const plain = post.toObject ? post.toObject() : post
  const likedBy = plain.likedBy || []
  return {
    ...plain,
    likeCount: likedBy.length || plain.likeCount || 0,
    isLiked: likedBy.some(id => String(id) === String(currentUserId)),
    likedBy: undefined,
  }
}

exports.feed = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 20)
    const skip = (page - 1) * limit
    const follows = await Follow.find({ followerId: req.user.id })
    const followingIds = follows.map(f => toObjectId(f.followingId))
    const prioritizedAuthorIds = followingIds
    const posts = await Post.aggregate([
      { $match: { type: 'pawpost', authorId: { $ne: toObjectId(req.user.id) } } },
      {
        $addFields: {
          isFollowingAuthor: { $in: ['$authorId', prioritizedAuthorIds] },
          isLiked: { $in: [toObjectId(req.user.id), { $ifNull: ['$likedBy', []] }] },
          likeCount: { $size: { $ifNull: ['$likedBy', []] } },
        },
      },
      { $lookup: { from: 'mypets', localField: 'petId',    foreignField: '_id', as: 'pet' } },
      { $lookup: { from: 'users',  localField: 'authorId', foreignField: '_id', as: 'author' } },
      { $unwind: { path: '$pet', preserveNullAndEmptyArrays: true } },
      { $unwind: '$author' },
      { $project: { 'author.passwordHash': 0, likedBy: 0 } },
      { $sort: { isFollowingAuthor: -1, createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit + 1 },
    ])
    const hasMore = posts.length > limit
    res.json({
      items: hasMore ? posts.slice(0, limit) : posts,
      page,
      limit,
      hasMore,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.recommendations = async (req, res) => {
  try {
    const limit = Math.min(parsePositiveInt(req.query.limit, 5), 12)
    const follows = await Follow.find({ followerId: req.user.id })
    const currentUserId = toObjectId(req.user.id)
    const excludedAuthorIds = [
      ...follows.map(f => toObjectId(f.followingId)),
      currentUserId,
    ]

    const candidates = await Post.aggregate([
      { $match: { type: 'pawpost', authorId: { $nin: excludedAuthorIds } } },
      { $lookup: { from: 'mypets', localField: 'petId', foreignField: '_id', as: 'pet' } },
      { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'author' } },
      { $unwind: { path: '$pet', preserveNullAndEmptyArrays: true } },
      { $unwind: '$author' },
      // exclude posts about the current user's own pets
      { $match: { $or: [{ 'pet.ownerId': { $exists: false } }, { 'pet.ownerId': { $ne: currentUserId } }] } },
      { $project: { 'author.passwordHash': 0, likedBy: 0 } },
      { $addFields: { randomOrder: { $rand: {} } } },
      { $sort: { randomOrder: 1, createdAt: -1, _id: -1 } },
      { $limit: Math.max(limit * 4, 12) },
    ])

    const seenAuthors = new Set()
    const items = []

    for (const post of candidates) {
      const authorId = String(post.author?._id || '')
      if (!authorId || seenAuthors.has(authorId)) continue
      seenAuthors.add(authorId)
      items.push(post)
      if (items.length >= limit) break
    }

    res.json(items)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.explore = async (req, res) => {
  try {
    const { type } = req.query
    const match = { type: type || 'pawpost' }
    const posts = await Post.aggregate([
      { $match: match },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likedBy', []] } },
        },
      },
      { $lookup: { from: 'mypets', localField: 'petId',    foreignField: '_id', as: 'pet' } },
      { $lookup: { from: 'users',  localField: 'authorId', foreignField: '_id', as: 'author' } },
      { $unwind: { path: '$pet', preserveNullAndEmptyArrays: true } },
      { $unwind: '$author' },
      { $project: { 'author.passwordHash': 0, likedBy: 0 } },
      { $sort: { createdAt: -1 } }, { $limit: 30 },
    ])
    res.json(posts)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    const { petId, caption, type } = req.body
    if (!req.file) return res.status(400).json({ message: 'Media file required' })

    let linkedPet = null
    if (petId) {
      linkedPet = await MyPet.findOne({ _id: petId, ownerId: req.user.id })
      if (!linkedPet) return res.status(403).json({ message: 'You can only post your own pets' })
    }

    const mediaUrl = await uploadFile(req.file.buffer, req.file.originalname, 'posts')
    const canAutoTagAdoptable = ['shelter_staff', 'admin'].includes(req.user.role)
      && linkedPet?.adoptionStatus === 'available'

    const postData = {
      authorId: req.user.id,
      petId: linkedPet?._id,
      type: type === 'story' ? 'story' : 'pawpost',
      mediaUrl, caption,
      likedBy: [],
      adoptionBadge: Boolean(canAutoTagAdoptable),
      adoptionPetId: canAutoTagAdoptable ? linkedPet._id : undefined,
    }
    postData.likeCount = 0
    const post = await Post.create(postData)
    res.status(201).json(post)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getOne = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', '-passwordHash')
      .populate('petId')
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const comments = await Comment.find({ postId: post._id })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: 1 })

    res.json({
      ...serializePopulatedPost(post, req.user?.id),
      author: post.authorId,
      pet: post.petId,
      comments: comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.authorId,
      })),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.like = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    post.likedBy = post.likedBy || []
    const alreadyLiked = post.likedBy.some(id => String(id) === String(req.user.id))
    if (!alreadyLiked) {
      post.likedBy.push(req.user.id)
    } else {
      post.likedBy = post.likedBy.filter(id => String(id) !== String(req.user.id))
    }

    post.likeCount = post.likedBy.length
    await post.save()

    res.json({ likeCount: post.likeCount, isLiked: !alreadyLiked })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    await Post.findOneAndDelete({ _id: req.params.id, authorId: req.user.id })
    res.json({ message: 'Post deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.myPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId }).populate('petId').sort({ createdAt: -1 })
    res.json(posts.map(post => ({
      ...post.toObject(),
      pet: post.petId,
      likeCount: post.likedBy?.length || post.likeCount || 0,
      likedBy: undefined,
    })))
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.addComment = async (req, res) => {
  try {
    const content = req.body.content?.trim()
    if (!content) return res.status(400).json({ message: 'Comment content is required' })

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const comment = await Comment.create({
      postId: req.params.id,
      authorId: req.user.id,
      content,
    })

    await comment.populate('authorId', 'name avatar')

    res.status(201).json({
      _id: comment._id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.authorId,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
