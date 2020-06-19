ytdlWrapper.getInfo(url, (err, info) => {
    'use strict'
    if (err) {
        io.sockets.to(socketId).emit('send notification', statusCodes.error, err.message);
        res.status(204).end();
    } else {
        let title = info._filename;
        console.log(title);
        let videoLength = info._duration_raw;

        if (videoLength > 600) { // 600 seconds = 10 mins
            io.sockets.to(socketId).emit('send notification', statusCodes.error, 'Max video length is 10 minutes.');
            res.status(204).end();
        } else {
            let args = [];
            switch (quality) {
                case 'mp3low':
                    args = [
                        '--extract-audio',
                        '--audio-format', 'mp3'
                    ];
                    break;
                case 'mp3best':
                    args = [
                        '-f', 'bestaudio',
                        '--extract-audio',
                        '--audio-format', 'mp3',
                        '--audio-quality', '0'
                    ];
                    break;
                case 'mp4best':
                    args = [
                        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4'
                    ];
                    break;;
            }

            ytdlWrapper.exec(url, args, { cwd: 'tmp' }, (err, output) => {
                'use strict'
                if (err) {
                    console.log(err.message);

                    io.sockets.to(socketId).emit('send notification', statusCodes.error, err.message);
                    res.status(204).end();
                } else {
                    var isVideo = (quality.indexOf('mp4') !== -1);
                    var contentType = (isVideo) ? 'video/mp4' : 'audio/mpeg3';
                    //var extension = (isVideo) ? '.mp4' : '.mp3';

                    var filepath = path.join(__dirname, 'tmp', title)

                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Disposition', contentDisposition(title));

                    try {
                        var stream = fs.createReadStream(filepath);

                        stream.once('end', () => {
                            stream.destroy();
                            fs.unlink(filepath);
                        }).pipe(res);
                    } catch (ex) {
                        console.log(ex.message);
                        
                        io.sockets.to(socketId).emit('send notification', statusCodes.error, ex.message);
                        res.status(204).end();
                    }
                }
            });
        }
    }
});