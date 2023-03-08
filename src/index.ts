import fs from 'fs';
import crypto from 'crypto';
import https from 'https';
import Axios from 'axios';
import cron from 'node-cron';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const imageURL = 'https://www.lusoponte.pt/assets/cam1_P25_00001.jpg';
let lastKnownHash: string | null = null;

const downloadImage = async (
  url: string,
  filepath: string,
): Promise<string> => {
  const response = await Axios({
    httpsAgent,
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on('error', reject)
      .once('close', () => resolve(filepath));
  });
};

const getHashForImage = (imagePath: string): string => {
  const fileBuffer = fs.readFileSync(imagePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

const main = async () => {
  cron.schedule('*/30 * * * * *', async () => {
    console.log('>>>>>>>>>>>>>>', new Date().getSeconds());
    const newlyDownloadedImage = await downloadImage(
      imageURL,
      `./images/${new Date().getTime()}.jpg`,
    );
    const imageHash = getHashForImage(newlyDownloadedImage);

    if (lastKnownHash === imageHash) {
      fs.rmSync(newlyDownloadedImage);
    }

    lastKnownHash = imageHash;
  });
};

main();
