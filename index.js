const express = require('express');
const app = express();
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/download', async (req, res) => {
    const url = req.body.url;
    const format = req.body.format;

    try {
        if (ytdl.validateURL(url)) {
            const info = await ytdl.getInfo(url);
            let filename = info.videoDetails.title.replace(/[^\w\s]/gi, '') + (format === 'mp3' ? '.mp3' : '.mp4');
            filename = path.join(__dirname, 'downloads', filename);

            const videoStream = ytdl(url, { filter: format === 'mp3' ? 'audioonly' : 'videoandaudio' });
            videoStream.pipe(fs.createWriteStream(filename));

            videoStream.on('end', () => {
                res.download(filename, (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error downloading the file.');
                    }
                    fs.unlinkSync(filename); // Delete the file after download
                });
            });
        } else {
            res.status(400).send('Invalid YouTube URL');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing the request.');
    }
});

const PORT = process
