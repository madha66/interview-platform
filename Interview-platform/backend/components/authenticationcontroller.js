const { generateCodeVerifier, generateState, decodeIdToken } = require("arctic");
const { google } = require("../lib/oauth/google");
const { getUserwithOauthid, linkuserwithoauth, createUserwithOauth } = require("../Models/authentication")

// In-memory store to bypass cookie blocking (e.g. Brave Shields, Incognito mode)
const codeVerifierMap = new Map();

const googleloginpage = async (req, res) => {
    if (req.user) return res.redirect("/")
    const state = generateState()
    const codeverifier = generateCodeVerifier();

    // Save to server-side memory mapped by state
    codeVerifierMap.set(state, codeverifier);

    // Cap memory map size to avoid growth leaks
    if (codeVerifierMap.size > 1000) {
        const firstKey = codeVerifierMap.keys().next().value;
        codeVerifierMap.delete(firstKey);
    }

    const url = google.createAuthorizationURL(state, codeverifier, [
        "openid",
        "profile",
        "email"
    ])
    const getcookie = {
        secure: false, // set to false in localhost
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10, // 10 min
        sameSite: "lax"
    }
    res.cookie("state", state, getcookie)
    res.cookie("codeVerifier", codeverifier, getcookie)
    return res.redirect(url.toString())
}

const parseCookies = (cookieHeader) => {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(";").forEach(cookie => {
        let [name, ...rest] = cookie.split("=");
        name = name.trim();
        if (!name) return;
        const value = rest.join("=").trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });
    return list;
};

const googlecallbackpage = async (req, res) => {
    const { code, state } = req.query;
    console.log("[OAuth Callback] Raw Cookie Header:", req.headers.cookie);

    // 1. First try to get codeVerifier from our server-side memory map
    let codes = codeVerifierMap.get(state);
    let storestate = codes ? state : null;

    if (codes) {
        console.log("[OAuth Callback] Found state/codeVerifier in memory map.");
        // Consume the state token to prevent replay
        codeVerifierMap.delete(state);
    } else {
        console.log("[OAuth Callback] Memory map lookup failed. Falling back to cookies...");
        const cookies = req.cookies || parseCookies(req.headers.cookie);
        storestate = cookies.state;
        codes = cookies.codeVerifier;
    }

    console.log("[OAuth Callback] Resolved state & codeVerifier:", {
        state,
        storestate,
        hasCodes: !!codes,
        stateMatch: state === storestate
    });

    if (!code || !state || !storestate || !codes || state !== storestate) {
        console.log("[OAuth Callback] Validation failed (missing state/code or mismatch).");
        if (typeof req.flash === "function") {
            req.flash("errors", "couldnt login due to invalid login attempt. Please login again!")
        }
        return res.redirect("https://interview-platform-nine.vercel.app/login")
    }
    let tokens;
    try {
        console.log("[OAuth Callback] Validating authorization code...");
        tokens = await google.validateAuthorizationCode(code, codes)
        console.log("[OAuth Callback] Code validation successful!");
    } catch (e) {
        console.error("[OAuth Callback] Error validating authorization code:", e);
        if (typeof req.flash === "function") {
            req.flash("errors", "couldnt login due to invalid login attempt. Please login again!")
        }
        return res.redirect("https://interview-platform-nine.vercel.app/login")
    }
    const claims = decodeIdToken(tokens.idToken())
    const { sub: googleUserid, name, email } = claims;
    console.log("[OAuth Callback] Decoded claims:", { googleUserid, name, email });

    //User already exist with google oauth id
    console.log("[OAuth Callback] Checking if user exists in db...");
    let user = await getUserwithOauthid({
        provider: "google",
        email,
    })
    console.log("[OAuth Callback] Database lookup result:", user);

    //User Logged in our webpage but not registered in google oauth 
    if (user && !user.providerAccountId) {
        console.log("[OAuth Callback] Linking existing user account with Google...");
        await linkuserwithoauth({
            userId: user.id || user._id,
            provider: "google",
            providerAccountId: googleUserid
        })
    }
    //First time logging in then
    if (!user) {
        console.log("[OAuth Callback] Creating new user with Google...");
        user = await createUserwithOauth({
            name,
            email,
            provider: "google",
            providerAccountId: googleUserid
        })
        console.log("[OAuth Callback] Created user:", user);
    }
    console.log("[OAuth Callback] Redirecting to frontend homepage.");
    res.redirect("https://interview-platform-nine.vercel.app/landings")
}
module.exports = { googleloginpage, googlecallbackpage };