// Define empty arrays
var config          = {};
config.discord      = {};
config.web          = {};
config.secret       = {};
config.captcha      = {};

// Discord Settings
config.discord.enableBot        = false;
config.discord.prefix           = '++';
config.discord.token            = 'YourToken';

// Web Settings
config.web.site                 = 'https://node-ytdl.herokuapp.com'; // http://localhost:4000
config.web.port                 = process.env.PORT || 4000;
config.web.sessionKey           = 'Dbb1Qp8HiS56Rwlj8jpJ';

// Secret
config.secret.generateKey       = 'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOMGxxxD1!';

// hCaptcha
config.captcha.secretKey        = '0x4C58Aa477f35811884FA47493e0459393b856168';

module.exports = config;