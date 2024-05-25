const User = require("../models/user");
const crypto = require("crypto");

module.exports = async function findOrCreateGoogleUser(profile) {
  try {
    if (!profile || !profile.emails) {
      throw new Error("Profile or profile emails is undefined");
    }

    const email = profile.emails[0].value;

    let user = await User.findOne({ where: { email: email } });

    if (user) {
      user.googleId = profile.id;
      await user.save();
    } else {
      let result = await User.findOrCreate({
        where: { googleId: profile.id },
        defaults: {
          email: email,
          password: crypto.randomBytes(16).toString("hex"),
        },
      });
      user = result[0];
    }
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
