const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/vaccinationController')
const auth    = require('../middleware/auth')

router.get('/:petId',    auth, ctrl.list)
router.post('/:petId',   auth, ctrl.create)
router.put('/:id',       auth, ctrl.update)
router.delete('/:id',    auth, ctrl.remove)

module.exports = router
