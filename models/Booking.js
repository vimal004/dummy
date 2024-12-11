const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");
const SpeakerProfile = require("./Speaker");

// Define the Booking model
const Booking = sequelize.define("Booking", {
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
    onUpdate: "CASCADE",
  },
  speakerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: SpeakerProfile,
      key: "userId",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  timeSlot: {
    type: DataTypes.ENUM(
      "9:00 AM - 10:00 AM",
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "12:00 PM - 1:00 PM",
      "1:00 PM - 2:00 PM",
      "2:00 PM - 3:00 PM",
      "3:00 PM - 4:00 PM"
    ),
    allowNull: false,
  },
});

module.exports = Booking;
