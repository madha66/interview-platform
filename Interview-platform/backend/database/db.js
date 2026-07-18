const mongoose = require("mongoose");
const dns = require("dns");

const connect = async () => {
    // 1. Override DNS servers to Google DNS for resolving SRV records
    try {
        console.log("Setting DNS servers to Google DNS (8.8.8.8, 8.8.4.4)...");
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
    } catch (dnsErr) {
        console.warn("Could not set custom DNS servers. Proceeding with default:", dnsErr.message);
    }

    const cloudUri = "mongodb+srv://madhanyuvi2009_db_user:CRMsuY8V3ZkQMny4@cluster0.saosb9k.mongodb.net/";
    const localUri = "mongodb://127.0.0.1:27017/interview-platform";

    // Try Cloud MongoDB Atlas
    try {
        console.log("Attempting to connect to MongoDB Atlas...");
        await mongoose.connect(cloudUri, { serverSelectionTimeoutMS: 5000 });
        console.log("Database connected successfully to MongoDB Atlas!");
        return;
    } catch (cloudErr) {
        console.warn("Failed to connect to MongoDB Atlas (e.g. IP Whitelist issue or offline):", cloudErr.message);
    }

    // Try Local MongoDB
    try {
        console.log(`Attempting to connect to local MongoDB at ${localUri}...`);
        await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
        console.log("Database connected successfully to local MongoDB!");
        return;
    } catch (localErr) {
        console.warn("Failed to connect to local MongoDB:", localErr.message);
    }

    // Try In-Memory MongoDB Fallback
    try {
        console.log("Spinning up local In-Memory MongoDB Server...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        console.log(`In-Memory MongoDB Server started at: ${mongoUri}`);

        await mongoose.connect(mongoUri);
        console.log("Database connected successfully to In-Memory MongoDB!");
    } catch (memErr) {
        console.error("Critical: All MongoDB connection attempts failed:", memErr);
        process.exit(1);
    }
};

module.exports = connect;