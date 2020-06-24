
const stream = ytdl.downloadFromInfo(info, { filter: format => format.container === 'mp4' && !format.qualityLabel })
.on('error', () => {
    // When a user closes their tab, find how to destroy the stream. This code wont work
    console.log('stopped');
    stream.destroy();
})
.on('progress', onProgress)
.pipe(fs.createWriteStream(vidAudioOutput))
.on('finish', () => {
    console.log('\ndownloading video');
    const video = ytdl.downloadFromInfo(info, {
        filter: format => format.container === 'mp4' && !format.audioEncoding,
    });
    video.on('progress', onProgressVideo);

    io.sockets.to(socketId).emit('send notification', statusCodes.info, 'Converting to MP4...');

    // combine video & audio files to one single video file
    ffmpeg()
        .input(video)
        .videoCodec('copy')
        .input(vidAudioOutput)
        .audioCodec('copy')
        .save(vidMainOutput)
        .on('error', (err, stdout, stderro) => {
            io.sockets.to(socketId).emit('send notification', statusCodes.error, `[video] ffmpeg conversion stream closed: ${err.message}`);
            log(`[socket: ${socketId}] VIDEO: user stopped conversion`);
            video.destroy(); // stop ytdl from keeping on downloading
        })
        .on('end', () => {
            // delete audio file
            fs.unlink(vidAudioOutput, err => {
                if (err) console.error(err);
                else {
                    console.log(`\nfinished downloading, saved to ${vidMainOutput}`)

                    log(`[socket: ${socketId}] VIDEO: DOWNLOAD FINISHED!`);
                    io.sockets.to(socketId).emit('send notification', statusCodes.success, 'Successfully downloaded!');

                    // read the final video file and pipe it
                    var fileStream = fs.createReadStream(vidMainOutput);
                    fileStream.pipe(res, { end: true });

                    // delete final video file
                    fs.unlink(vidMainOutput, err => {
                        if (err) console.error(err);
                    });
                    
                    return;
                }
            });
        });
});