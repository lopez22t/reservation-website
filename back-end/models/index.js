/**
 * Central export file for all database models
 * Allows easy import of models throughout the application
 * Example: const { User, Room, Reservation } = require('./models');
 */
module.exports = {
    User: require('./User'),
    Building: require('./Building'),
    Room: require('./Room'),
    Reservation: require('./Reservation'),
    SignIn: require('./SignIn')
};
