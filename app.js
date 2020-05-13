const config                = require('./config')
const Discord               = require('discord.js');
const express               = require('express');
const ytdl                  = require('ytdl-core');
const path                  = require('path');
const contentDisposition    = require('content-disposition');
const cors                  = require('cors');
const csrf                  = require('csurf');
const cookieParser          = require('cookie-parser');
const bodyParser            = require('body-parser');
const session               = require('express-session');
const ffmpegPath            = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg                = require('fluent-ffmpeg');
const fs                    = require('fs');
const readline              = require('readline');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const http = require('http').createServer(app);
const io  = require('socket.io')(http);

/*
********************************
** Discord Bot code goes here **
********************************
*/

if (config.discord.enableBot)
{
    // Discord Bot
    //-----------------------------------

    const discord = new Discord.Client();

    discord.on('ready', () => {
        console.log(`discord.js client ready. Logged in as: ${discord.user.tag}`);
    });

    let dispatcher = null;
    let isPlaying = false;

    discord.on('message', async message => {
        if (!message.content.startsWith(config.discord.prefix) || message.author.bot) return;

        const args = message.content.slice(config.discord.prefix.length).split(' ');
        const command = args.shift().toLowerCase();

        // get youtube link from arguments
        let ytlink = args[0];

        switch (command)
        {
            case 'download':
                if(!ytdl.validateURL(ytlink))
                    return message.reply('This is not a YouTube link.');


                // 
                message.reply(`${config.web.site}/?url=${ytlink}`);
                break;




                /*message.reply('Converting to MP3, please wait...');

                // other download method goes here???

                try {
                    let streamFile = `${config.web.site}/generate?url=${ytlink}&secretKey=${config.secret.generateKey}`;
                    let title = 'track.mp3';

                    const attachment = new Discord.MessageAttachment(streamFile, title);
                    await message.reply('Here is your track!', attachment);
                } catch (err) {
                    console.error(`[discord bot] download(): Something went wrong: ${err}`);
                    message.reply(`There was an error. The file may be too big, so you might want to use the web version here: ${config.web.site}.\nERROR: ${err}`);
                }*/

                break;
            case 'play':
                // to use the 'play' command:
                // npm install @discordjs/opus
                // also uninstall opusscript

                message.reply('Under construction.');
                break;

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
                message.reply(`Check out: ${config.web.site}/discord for the bot's commands.`);
                break;
        }
    });

    discord.login(config.discord.token);

    //-----------------------------------
    // End Discord Bot   
}

// Web Server
const csrfProtection = csrf();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // false
app.use(cookieParser());
app.use(session({ secret: config.web.sessionKey, resave: false, saveUninitialized: false }));
app.use(csrfProtection);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Functions & Settings
var statusCodes =  {
    success: 'success',
    error: 'error',
    info: 'info'
}

function log(data) {
    console.log(data);
}

function randomStr(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getInfo(socketId, url, callback) {
    if(!url || !ytdl.validateURL(url)) {
        callback(statusCodes.error, 'Invalid YouTube Link.');
        return;
    }

    let videoID = ytdl.getURLVideoID(url);

    io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Grabbing video info...');

    ytdl.getInfo(videoID, (err, info) => {
//        if (err) throw err;
        if (err)
            callback(statusCodes.error, err.message);
        else        
            callback(statusCodes.success, info);
    });
}

//-----------------------------------
//pages
app.get('/', (req, res) => {
    res.render('index', {
        url: req.query.url,
        err: req.query.err,
        csrfToken: req.csrfToken()
    });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/discord', (req, res) => {
    res.render('discord');
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        csrfToken: req.csrfToken()
    });
})

app.get('/getinfo', (req, res) => {
    res.status(200).send('Not much to see here :|');
    return;

    /*var url = req.query.url;
    var socketId = (req.query.socketId) ? req.query.socketId : 'undefined';

    res.setHeader('Content-Type', 'application/json');

    getInfo(socketId, url, function(statusCode, info) {
        return res.send(JSON.stringify( {statusCode: statusCode, info: info }, null, 2 ));
    });*/
});

app.get('/generate', (req, res) => {
    res.status(200).send('wat');
    return;
});

app.post('/contact', (req, res) => {
    res.status(200).send('wat');
    return;
});

app.post('/convert', (req, res) => {
    var url = req.body.url;
    var quality = req.body.quality;
    var socketId = req.body.socketId;

    // Check for quality value
    var allowedQualities = ['mp3low', 'mp3best'/*, 'mp4video'*/];

    if(allowedQualities.indexOf(quality) == -1) { // index not found
        io.sockets.to(socketId).emit('send notification', statusCodes.error, 'Invalid quality value.');
        res.status(204).end();
    } else {
        // Grab video info
        getInfo(socketId, url, function(statusCode, info) {
            if(statusCode == statusCodes.error) {
                io.sockets.to(socketId).emit('send notification', statusCodes.error, info);
                res.status(204).end();
            } else {
                let title = info.title.replace('|','').toString('ascii');
                let videoLength = info.length_seconds;
                
                // check whether the video exceeds the maximum length
                if(videoLength > 600) { // 600 seconds = 10 mins
                    io.sockets.to(socketId).emit('send notification', statusCodes.error, 'Max video length is 10 minutes.');
                    res.status(204).end();
                } else {
                    // check if video or audio
                    let isVideo = (quality.indexOf('mp4') !== -1);

                    // variables for exporting
                    var exportQuality = null;
                    var contentType = (isVideo) ? 'video/mp4' : 'audio/mpeg3';
                    var extension = (isVideo) ? '.mp4' : '.mp3';

                    // set quality and audio bitrate
                    let audioBitrate = null;

                    // video variables
                    let vidAudioOutput = null;
                    let vidMainOutput = null;

                    if (isVideo) {
                        let dir = './tmp';
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }

                        vidAudioOutput = path.resolve(__dirname, 'tmp/' + randomStr(8) + extension);
                        vidMainOutput = path.resolve(__dirname, 'tmp/' + randomStr(8) + extension);
                    }

                    // for each quality value, do our stuff
                    switch (quality) {
                        case 'mp3low':
                            exportQuality = 'lowestaudio';
                            audioBitrate = 128;
                            break;
                        case 'mp3best':
                            exportQuality = 'highestaudio';
                            audioBitrate = 320;
                            break;
                        // not needed for now
                        /*case 'mp4video':
                            exportQuality = 'highestvideo';
                            audioBitrate = 320;
                            break;*/
                    }

                    io.sockets.to(socketId).emit('send notification', statusCodes.info, `Downloading...`);

                    const onProgress = (chunkLength, downloaded, total) => {
                        const percent = downloaded / total;
                        readline.cursorTo(process.stdout, 0);
                        process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
                        process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`);
                    };

                    // set headers for audio download
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Disposition', contentDisposition(title + extension));

                    console.log('downloading audio track');

                    if (isVideo) {
                        ytdl.downloadFromInfo(info, { filter: format => format.container === 'mp4' && !format.qualityLabel })
                            .on('error', console.error)
                            .on('progress', onProgress)

                            // Write audio to file since ffmpeg supports only one input stream.
                            .pipe(fs.createWriteStream(vidAudioOutput))
                            .on('finish', () => {
                                console.log('\ndownloading video');
                                const video = ytdl.downloadFromInfo(info, {
                                    filter: format => format.container === 'mp4' && !format.audioEncoding,
                                });
                                video.on('progress', onProgress);

                                io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Converting to MP4...');

                                ffmpeg()
                                    .input(video)
                                    .videoCodec('copy')
                                    .input(vidAudioOutput)
                                    .audioCodec('copy')
                                    .save(vidMainOutput)
                                    .on('error', (err, stdout, stderro) => {
                                        io.sockets.to(socketId).emit('send notification', statusCodes.error, `ffmpeg conversion stream closed: ${err.message}`);
                                        log(`[socket: ${socketId}] VIDEO: user stopped conversion`);
                                    })
                                    .on('end', () => {
                                        
                                        fs.unlink(vidAudioOutput, err => {
                                            if (err) console.error(err);
                                            else {
                                                console.log(`\nfinished downloading, saved to ${vidMainOutput}`)

                                                log(`[socket: ${socketId}] VIDEO: DOWNLOAD FINISHED!`);
                                                io.sockets.to(socketId).emit('send notification', statusCodes.success, 'Successfully downloaded!');

                                                var fileStream = fs.createReadStream(vidMainOutput);
                                                fileStream.pipe(res, { end: true });

                                                fs.unlink(vidMainOutput, err => {
                                                    if (err) console.error(err);
                                                });

                                                return;
                                            }
                                        });
                                    });
                                    // .pipe(res, { end: true });
                            });
                    } else {
                        // ytdl stream
                        const stream = ytdl.downloadFromInfo(info, { quality: exportQuality });
                        stream.on('progress', onProgress);

                        io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Converting to MP3...');

                        // mp3 conversion using ffmpeg
                        ffmpeg()
                            .input(stream)
                            .toFormat('mp3')
                            .audioBitrate(audioBitrate)
                            .on('error', (err, stdout, stderr) => {
                                io.sockets.to(socketId).emit('send notification', statusCodes.error, `ffmpeg conversion stream closed: ${err.message}`);
                                log(`[socket: ${socketId}] AUDIO: user stopped conversion`);
                            })
                            .on('end', () => {
                                log(`[socket: ${socketId}] AUDIO: DOWNLOAD FINISHED!`);
                                io.sockets.to(socketId).emit('send notification', statusCodes.success, 'Successfully downloaded!');
                            })
                            .pipe(res, { end: true });
                        
                        return;
                    }
                }
            }
        });
    }

});
//-----------------------------------

// 404 not found
app.use((req, res, next) => {
    res.status(404).render('404');
});

// 500 something broke
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500');
});

// socket.io
io.on('connection', (socket) => {
    // user connected
});

http.listen(config.web.port, () => {
    log(`[node-ytdl webserver] Listening on port ${config.web.port}`);
});
