// Define empty arrays
var config          = {};
config.discord      = {};
config.web          = {};
config.secret       = {};
config.captcha      = {};

/**
 * I was about to code a discord bot that would download mp3s
 * via discord commands and upload them as attachments.
 * However, that was not finished and those settings are not used.
 */
// Discord Settings (not used, don't have to configure)
config.discord.enableBot        = false;
config.discord.prefix           = '++';
config.discord.token            = '<Your_Bot_Token>';

// Web Settings
// config.web.site                 = 'https://node-ytdl.herokuapp.com';
config.web.site                 = 'http://localhost:4000';
config.web.port                 = process.env.PORT || 4000;
config.web.sessionKey           = 'Generate_A_Random_Secret_Key';

// Meant to be used by the discord bot as a secret key.
// Secret (not used, don't have to configure)
config.secret.generateKey       = 'Generate_Another_Random_Secret_Key';

// Meant to be used for the contact page
// hCaptcha (not used, don't have to configure)
config.captcha.secretKey        = 'hCaptcha_Secret_Key';

module.exports = config;