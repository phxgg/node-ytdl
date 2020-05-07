// these constants have already been defined in app.js
const Discord = require('discord.js');
const ytdl = require('ytdl-core');

// Discord Bot
//-----------------------------------

const discordPrefix = '++';
const discordToken = 'Njg0NzQ0MDk2OTM3NDEwNjE1.Xl-kEA.kGDDt2XagSXXxsrSCsR_p7WHb4k';
const discord = new Discord.Client();

const mySite = 'https://node-ytdl.herokuapp.com';
//const mySite = 'http://localhost:4000';

const generateDownloadSecretKey = 'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOMGxxxD1!';

discord.on('ready', () => {
    console.log(`discord.js client ready. Logged in as: ${discord.user.tag}`);
});

var dispatcher = null;
var isPlaying = false;

discord.on('message', async message => {
    if (!message.content.startsWith(discordPrefix) || message.author.bot) return;

    const args = message.content.slice(discordPrefix.length).split(' ');
    const command = args.shift().toLowerCase();

    // get youtube link from arguments
    var ytlink = args[0];

    switch (command)
    {
        case 'download':
            if(!ytdl.validateURL(ytlink))
                return message.reply('This is not a YouTube link.');


            // 
            message.reply(`${mySite}/?url=${ytlink}`);
            break;




            message.reply('Converting to MP3, please wait...');

            // other download method goes here???

            try {
                message.reply('Converting to MP3, please wait...');
                let streamFile = `${mySite}/generate?url=${ytlink}&secretKey=${generateDownloadSecretKey}`;
                let title = 'track.mp3';

                const attachment = new Discord.MessageAttachment(streamFile, title);
                await message.reply('Here is your track!', attachment);
            } catch (err) {
                console.error(`[discord bot] download(): Something went wrong: ${err}`);
                message.reply(`There was an error. The file may be too big, so you might want to use the web version here: ${mySite}.\nERROR: ${err}`);
            }

            break;
        case 'play':
            return message.reply('Under construction.');

            // Voice only works in guilds, if the message does not come from a guild,
            // we ignore it
            if (!message.guild) return;

            // validate youtube link
            if (!ytdl.validateURL(ytlink))
                return message.reply('This is not a YouTube link.');

            if(isPlaying)
                return message.reply('Already playing a song! Use ++stop to stop playing.');

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                return message.reply('Please be in a voice channel first!');
            }

            const songInfo = await ytdl.getInfo(ytlink.replace(/<(.+)>/g, '$1'));

            const song = {
                title: songInfo.title,
                url: songInfo.url
            }

            try {
                await voiceChannel.join()
                .then(connection => {
                    try {
                        const stream = ytdl(ytlink, { filter: 'audioonly' });
                        dispatcher = connection.play(stream);
    
                        dispatcher
                            .on('end', () => {
                                voiceChannel.leave();
                            })
                            .on('finish', () => {
                                voiceChannel.leave();
                            })
                            .on('error', error => console.error(error));
    
                        message.channel.send(`🎶 Start playing: **${song.title}**. Song request by ${message.member.user}`);

                        isPlaying = true;
                    } catch (err) {
                        isPlaying = false;
                        console.error(`[discord bot] play(): Something went wrong: ${err}`);
                        voiceChannel.leave();
                        return message.reply(`Something went wrong: ${err}`);
                    }
                });
            } catch (err) {
                isPlaying = false;
                console.error(`[discord bot] play(): I could not join the voice channel: ${err}`);
                voiceChannel.leave();
                return message.reply(`I could not join the voice channel: ${err}`);
            }

            break;
        case 'stop':
            if(!isPlaying)
                return;

            try {
                const voiceChannel = message.member.voice.channel;
                if(!voiceChannel)
                    return;
                
                dispatcher.end();
                isPlaying = false;
            } catch (err) {
                isPlaying = false;
                console.error(`[discord bot] stop(): Something went wrong: ${err}`);
            }
            break;
        case 'help':
            message.reply(`Check out: ${mySite}/discord for the bot's commands.`);
            break;
    }
});

discord.login(discordToken);

//-----------------------------------
// End Discord Bot