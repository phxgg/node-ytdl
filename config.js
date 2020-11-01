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
config.web.sessionKey           = 'sessionKeyChangeThis';

// Secret
config.secret.generateKey       = 'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOMGxxxD1!';

// hCaptcha
config.captcha.secretKey        = 'hCaptchaKey';

module.exports = config;