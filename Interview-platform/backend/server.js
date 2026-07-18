const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express")
const connect = require("./database/db.js")
const Router = require("./components/auth.routes.js")
const arenaRouter = require("./components/arena.routes.js")
const app = express()

connect()

// Parse JSON and URL encoded request bodies
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Enable CORS for cross-port communication from Frontend
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use("/auth", Router);
app.use("/api/arena", arenaRouter);
app.use("/", Router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
//google auth routes