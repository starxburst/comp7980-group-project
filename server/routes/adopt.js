const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/adoptController')
const auth    = require('../middleware/auth')
const role    = require('../middleware/role')

router.get('/',      ctrl.list)
router.get('/mine',  auth, role('shelter_staff', 'admin'), ctrl.mine)
router.get('/:id',   ctrl.get)

module.exports = router
