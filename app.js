const config                = require('./config')
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
const hcaptcha              = require('express-hcaptcha');
const { RateLimiterMemory } = require('rate-limiter-flexible');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// CSRF Protection
const csrfProtection = csrf();

// Rate Limiter
const rateLimiter = new RateLimiterMemory({
  points: 6, // 6 points
  duration: 1, // per second
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip, 2)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      res.status(429).send('Too many requests. Please slow down.');
    });
};

// Web Server Settings
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // false
app.use(cookieParser());
app.use(session({ secret: config.web.sessionKey, resave: false, saveUninitialized: false }));

app.use(csrfProtection);

app.use('/convert', rateLimiterMiddleware);
app.use('/contact', rateLimiterMiddleware);
app.use('/videoinfo', rateLimiterMiddleware);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Functions & Settings
var statusCodes = {
  success: 'success',
  error: 'error',
  info: 'info'
}

function log(data) {
  console.log(data);
}

function randomStr(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function convertToValidFilename(str) {
  return (str.replace(/[\/|\\:*?"<>]/g, ' '));
}

async function getInfo(url, basic, callback) {
  if (!url || !ytdl.validateURL(url)) {
    callback(stautsCodes.error, 'Invalid YouTube Link.')
    return;
  }

  try {
    let info = (basic) ? await ytdl.getBasicInfo(url) : await ytdl.getInfo(url);
    callback(statusCodes.success, info);
  } catch (err) {
    callback(statusCodes.error, err.message);
  }
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

app.get('/generate', (req, res) => {
  res.status(200).send('wat');
  return;
});

app.post('/contact', hcaptcha.middleware.validate(config.captcha.secretKey), (req, res) => {
  //res.status(200).send('wat');
  //return;
  res.json({ message: 'verified!', hcaptcha: req.hcaptcha });
});

app.post('/convert', (req, res) => {
  var url = req.body.url;
  var quality = req.body.quality;
  var socketId = req.body.socketId;

  // Check for quality value
  var allowedQualities = ['mp3low', 'mp3best'/*, 'mp4best'*/];

  if (allowedQualities.indexOf(quality) == -1) { // index not found
    io.sockets.to(socketId).emit('send notification', statusCodes.error, 'Invalid quality value.');
    res.status(204).end();
  } else {
    // Get video info
    io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Getting video info...');

    getInfo(url, false, function (statusCode, info) {
      if (statusCode == statusCodes.error) {
        io.sockets.to(socketId).emit('send notification', statusCodes.error, info);
        res.status(204).end();
      } else {
        let title = convertToValidFilename(info.videoDetails.title) // .replace('|', '').toString('ascii');
        let videoLength = info.videoDetails.lengthSeconds;

        // check whether the video exceeds the maximum length
        if (videoLength > 1800) { // 600 seconds = 10 mins
          io.sockets.to(socketId).emit('send notification', statusCodes.error, 'Max video length is 30 minutes.');
          res.status(204).end();
        } else {
          // check if video or audio
          let isVideo = (quality.indexOf('mp4') !== -1);

          // variables for exporting
          let exportQuality = null;
          let contentType = (isVideo) ? 'video/mp4' : 'audio/mpeg3';
          let extension = (isVideo) ? '.mp4' : '.mp3';

          // set quality and audio bitrate
          let audioBitrate = null;

          // video variables
          let vidAudioOutput = null;
          let vidMainOutput = null;

          // create /tmp folder if it does't exist
          // also define audio & video output paths if it's a video
          if (isVideo) {
            let dir = 'tmp';
            if (!fs.existsSync(`./${dir}`)) {
              fs.mkdirSync(`./${dir}`);
            }

            let id = info.video_id;

            vidAudioOutput = path.resolve(__dirname, `${dir}/${id}_${randomStr(8)}_audio_${extension}`);
            vidMainOutput = path.resolve(__dirname, `${dir}/${id}_${randomStr(8)}_video_${extension}`);
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
          }

          io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Downloading...');

          // ytdl progress
          const onProgress = (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            readline.cursorTo(process.stdout, 0);

            // process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
            // process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`);

            let videoText = (isVideo) ? '<br><small class="text-muted">After that, we will convert it to a video!</small>' : null;

            io.sockets.to(socketId).emit('send downloadPercentage',
              `Your audio is downloading, do not close this window <i class="far fa-grin-beam"></i><br>Downloaded <b>${(percent * 100).toFixed(2)}%</b>`);
          };

          // only for video download
          const onProgressVideo = (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            readline.cursorTo(process.stdout, 0);

            io.sockets.to(socketId).emit('send downloadPercentage',
              `Converting... Do not close this window <i class="far fa-grin-beam"></i><br>Downloaded <b>${(percent * 100).toFixed(2)}%</b> (${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)`);
          };

          console.log(`[socket: ${socketId}]: STARTED DOWNLOAD`);

          // set headers
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', contentDisposition(title + extension, { fallback: false }));

          if (isVideo) {
            // make video download
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
                io.sockets.to(socketId).emit('send notification', statusCodes.error, `[audio] ffmpeg conversion stream closed: ${err.message}`);
                log(`[socket: ${socketId}] AUDIO: user stopped conversion`);
                stream.destroy(); // stop ytdl from keeping on downloading
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
