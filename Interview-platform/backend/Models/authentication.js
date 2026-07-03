const mongoose = require("mongoose")
const authenticationSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserTable",
        required: true
    },
    provider: {
        type: String,
        enum: ["google", "Google"],
        required: true
    },
    providerAccountid: {
        type: String,
        required: true,
        maxlength: 255
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: "oauth_tables" })

const userTable = new mongoose.Schema({
    id: {
        type: Number,
    },
    name: {
        type: String,
        required: true,
        maxlength: 255
    },
    email: {
        type: String,
        required: true,
        maxlength: 255
    },
    password: {
        type: String,
        maxlength: 255
    },
    isEmailValid: {
        type: Boolean,
        default: false,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updateAt: {
        type: Date,
        default: Date.now
    }
}, { collection: "usertables" })

const OAuth_table = mongoose.model("OAuth_table", authenticationSchema);
const user_table = mongoose.model("UserTable", userTable)

async function getUserwithOauthid({ provider, email }) {
    try {
        const user = await user_table.aggregate([
            {
                $match: {
                    email: email
                }
            },
            {
                $lookup: {
                    from: "oauth_tables", // collection name
                    let: {
                        userId: "$_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", "$$userId"] },
                                        { $eq: [ { $toLower: "$provider" }, provider.toLowerCase() ] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "oauth"
                }
            },
            {
                $unwind: {
                    path: "$oauth",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    email: 1,
                    isEmailValid: 1,
                    providerAccountId: "$oauth.providerAccountid",
                    provider: "$oauth.provider"
                }
            }
        ]);
        if (user && user.length > 0) {
            return user[0];
        }
        return null;
    } catch (err) {
        console.error("Error in getUserwithOauthid:", err);
        return null;
    }
}

async function linkuserwithoauth({ userId, provider, providerAccountId }) {
    try {
        const oauth_table = new OAuth_table({
            userId: userId,
            provider: provider,
            providerAccountid: providerAccountId
        })
        await oauth_table.save();
    } catch (err) {
        console.error("Error in linkuserwithoauth:", err);
    }
}

async function createUserwithOauth({ name, email, provider, providerAccountId }) {
    try {
        const user1 = new user_table({
            email: email,
            name: name,
            isEmailValid: true
        })
        await user1.save();

        const user2 = new OAuth_table({
            userId: user1._id,
            provider: provider,
            providerAccountid: providerAccountId
        })
        await user2.save();

        const user = await getUserwithOauthid({
            provider: provider,
            email: email
        })
        return user;
    } catch (err) {
        console.error("Error in createUserwithOauth:", err);
    }
}

module.exports = { getUserwithOauthid, linkuserwithoauth, createUserwithOauth };