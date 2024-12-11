const SpeakerProfile = require("./Speaker");
const User = require("./User");

// Define the associations
User.hasOne(SpeakerProfile, { foreignKey: "userId" });
SpeakerProfile.belongsTo(User, { foreignKey: "userId" });

module.exports = { User, SpeakerProfile };
