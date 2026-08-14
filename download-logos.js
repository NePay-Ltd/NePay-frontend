const https = require('https');
const fs = require('fs');

const logos = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_2022_logo.svg', name: 'mtn.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Globacom_Limited_Logo.svg', name: 'glo.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Airtel_logo.svg', name: 'airtel.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/DStv_Logo_2012.svg', name: 'dstv.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/en/2/23/GOtv_logo.png', name: 'gotv.png' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/StarTimes_logo.svg', name: 'startimes.svg' }
];

logos.forEach(logo => {
  const file = fs.createWriteStream(`apps/web/public/images/providers/${logo.name}`);
  https.get(logo.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
    response.pipe(file);
  }).on('error', (err) => {
    console.error(`Error downloading ${logo.name}: ${err.message}`);
  });
});
