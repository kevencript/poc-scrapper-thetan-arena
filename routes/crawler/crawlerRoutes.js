const express = require("express");
const router = express.Router();

// Importando Módulos
const thg = require("./thg");

// Routes
router.use("/thg", thg);


module.exports = router;
