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

ffmpeg.setFfmpegPath(ffmpegPath);

const port = process.env.PORT || 4000;
const app = express();
const http = require('http').createServer(app);
const io  = require('socket.io')(http);

/*
********************************
** Discord Bot code goes here **
********************************
*/

var enableDiscordBot = true;
if (enableDiscordBot)
{
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




                /*message.reply('Converting to MP3, please wait...');

                // other download method goes here???

                try {
                    let streamFile = `${mySite}/generate?url=${ytlink}&secretKey=${generateDownloadSecretKey}`;
                    let title = 'track.mp3';

                    const attachment = new Discord.MessageAttachment(streamFile, title);
                    await message.reply('Here is your track!', attachment);
                } catch (err) {
                    console.error(`[discord bot] download(): Something went wrong: ${err}`);
                    message.reply(`There was an error. The file may be too big, so you might want to use the web version here: ${mySite}.\nERROR: ${err}`);
                }*/

                break;
            case 'play':
                // to use the 'play' command:
                // npm install @discordjs/opus
                // also uninstall node-opus/opusscript or whatever opus we're currently using

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
                message.reply(`Check out: ${mySite}/discord for the bot's commands.`);
                break;
        }
    });

    discord.login(discordToken);

    //-----------------------------------
    // End Discord Bot   
}

// Web server
const csrfProtection = csrf();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // false
app.use(cookieParser());
app.use(session({ secret: 'Dbb1Qp8HiS56Rwlj8jpJ', resave: false, saveUninitialized: false }));
app.use(csrfProtection);

/*const whitelist = ['http://127.0.0.1:4000', 'http://example2.com']
const corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}*/

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

app.get('/getinfo', (req, res) => {
    res.send('Not much to see here :|');
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

app.post('/convert', /*cors(corsOptions),*/ (req, res) => {
    var url = req.body.url;
    var quality = req.body.quality;
    var socketId = req.body.socketId;

    // Check for quality value
    var allowedQualities = ['mp3regular', 'mp3best'];
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
                    // set quality and audio bitrate
                    let audioBitrate = null;
                    if (quality == 'mp3best') {
                        quality = 'highestaudio';
                        audioBitrate = 320;
                    } else {
                        quality = 'lowestaudio';
                        audioBitrate = 128;
                    }

                    io.sockets.to(socketId).emit('send notification', statusCodes.info, `Quality: ${quality}`);
                    let stream = ytdl.downloadFromInfo(info, { quality: quality });

                    io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Converting to mp3...');

                    // set headers for audio download        
                    res.setHeader('Content-Type', 'audio/mpeg3');
                    //var disposition = `attachment; filename="${title}.mp3"; filename*=UTF-8''${ encodeURIComponent(title + '.mp3') }`;
                    res.setHeader('Content-Disposition', contentDisposition(title + '.mp3'));

                    // FIX JUNK SHIT THAT GETS RESPONDED WHEN USING AJAX

                    // mp3 conversion using ffmpeg
                    ffmpeg()
                        .input(stream)
                        .toFormat('mp3')
                        .audioBitrate(audioBitrate)
                        .on('error', (err, stdout, stderr) => {
                            io.sockets.to(socketId).emit('send notification', statusCodes.error, `ffmpeg conversion stream closed: ${err.message}`);
                            log(`[socket: ${socketId}] user stopped conversion`);
                        })
                        .on('progress', (p) => {
                            log(`[socket: ${socketId}] ${p.targetSize}kb downloaded`);
                        })
                        .on('end', () => {
                            log(`[socket: ${socketId}] DOWNLOAD FINISHED!`);
                            io.sockets.to(socketId).emit('send notification', statusCodes.success, 'Successfully downloaded!');
                        })
                        .pipe(res, { end: true });
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

http.listen(port, () => {
    log(`[node-ytdl webserver] Listening on port ${port}`);
});
