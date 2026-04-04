const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/postController')
const auth    = require('../middleware/auth')
const upload  = require('../middleware/upload')

router.get('/feed',         auth, ctrl.feed)
router.get('/recommendations', auth, ctrl.recommendations)
router.get('/explore',      ctrl.explore)
router.get('/user/:userId', ctrl.myPosts)
router.get('/:id',          auth, ctrl.getOne)
router.post('/',            auth, upload.single('media'), ctrl.create)
router.post('/:id/like',    auth, ctrl.like)
router.post('/:id/comments', auth, ctrl.addComment)
router.delete('/:id',       auth, ctrl.remove)

module.exports = router
