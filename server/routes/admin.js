const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/adminController')
const auth    = require('../middleware/auth')
const role    = require('../middleware/role')

router.use(auth, role('admin'))

router.get('/dashboard',   ctrl.dashboard)
router.get('/users',       ctrl.listUsers)
router.put('/users/:id',   ctrl.updateUser)
router.delete('/users/:id', ctrl.deleteUser)

module.exports = router
