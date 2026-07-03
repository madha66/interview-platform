const mongoose = require("mongoose")
const connect = async () => {
    try {
        await mongoose.connect("mongodb+srv://madhanyuvi2009_db_user:CRMsuY8V3ZkQMny4@cluster0.saosb9k.mongodb.net/")
        console.log("Database connected successfully");
    } catch (e) {
        console.log("There is an error with the server", e);
    }
}
module.exports = connect;