'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pin: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('SUPER_ADMIN', 'USER'),
        defaultValue: 'USER',
        allowNull: false,
      },
      profileImage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'PIN_CREATED', 'ACTIVE', 'SUSPENDED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isPinCreated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      wrongPinAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      failedLoginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      pinLockedUntil: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastPasswordChangedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notificationEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      updatedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  }
};
