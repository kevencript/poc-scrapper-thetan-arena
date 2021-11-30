/**
 * routes/Router.js
 *
 * @description: Esse é o roteador principal da aplicação, isto é, contem os
 * principais módulos macro.
 *
 */

const express = require("express");
const router = express.Router();

// Importando Módulos
const puppeRouter = require("./crawler/crawlerRoutes.js");

// Definindo Rotas
router.use("/crawler", puppeRouter);

module.exports = router;
