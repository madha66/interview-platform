const express = require("express")
const { googleloginpage, googlecallbackpage } = require("./authenticationcontroller")
const routes = express.Router()
routes.get("/google", googleloginpage)
routes.get("/google/callback", googlecallbackpage)
module.exports = routes;