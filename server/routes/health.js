const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/healthController')
const auth    = require('../middleware/auth')

router.get('/:petId/logs',    auth, ctrl.getLogs)
router.post('/:petId/logs',   auth, ctrl.addLog)
router.delete('/logs/:id',    auth, ctrl.deleteLog)

module.exports = router
