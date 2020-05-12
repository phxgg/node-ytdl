// Define empty arrays
var config          = {};
config.discord      = {};
config.web          = {};
config.secret       = {};

// Discord Settings
config.discord.enableBot        = true;
config.discord.prefix           = '++';
config.discord.token            = 'Njg0NzQ0MDk2OTM3NDEwNjE1.Xl-kEA.kGDDt2XagSXXxsrSCsR_p7WHb4k';

// Web Settings
config.web.site                 = 'https://node-ytdl.herokuapp.com'; // http://localhost:4000
config.web.port                 = process.env.PORT || 4000;
config.web.sessionKey           = 'Dbb1Qp8HiS56Rwlj8jpJ';

// Secret
config.secret.generateKey       = 'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOMGxxxD1!';

module.exports = config;