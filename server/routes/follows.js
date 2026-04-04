const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/followController')
const auth    = require('../middleware/auth')

router.post('/:id/follow',    auth, ctrl.follow)
router.delete('/:id/unfollow', auth, ctrl.unfollow)
router.get('/:id/followers',  ctrl.followers)
router.get('/:id/following',  ctrl.following)

module.exports = router
