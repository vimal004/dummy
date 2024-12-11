const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User"); // Import the User model

const SpeakerProfile = sequelize.define(
  "SpeakerProfile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    expertise: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pricePerSession: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        fields: ["userId"],
        unique: true, // Add unique index on userId
      },
    ],
  }
);

module.exports = SpeakerProfile;
