const express = require("express");
const router = express.Router();

// Importando o Controller
const controller = require("./controller");

// @route    POST /crawler/olx
// @desc     Realizar a raspagem de dados (advindos da OLX), separar os campos que são importantese armazenar no banco de dados
// @acess    Private
router.post("/", controller.thgCrawler);

module.exports = router;
