const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/userController')
const auth    = require('../middleware/auth')
const upload  = require('../middleware/upload')

router.get('/search',      ctrl.searchUsers)
router.get('/:id',         ctrl.getProfile)
router.put('/me',          auth, upload.single('avatar'), ctrl.updateProfile)

module.exports = router
