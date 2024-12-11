const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  userType: { type: DataTypes.ENUM("user", "speaker"), allowNull: false },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp: { type: DataTypes.STRING, allowNull: true }, // Store OTP temporarily
  otpExpiration: { type: DataTypes.DATE, allowNull: true }, // Store OTP expiration time
});

module.exports = User;
