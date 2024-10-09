const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const winston = require('winston');
const https = require('https');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const zlib = require('zlib');

puppeteer.use(stealth());

const proxies = 
[
    "https://warm-mochi-51a181.netlify.app/",
    "https://sage-blancmange-6a0895.netlify.app/",
    "https://phenomenal-scone-6bd47d.netlify.app/",
    "https://comfy-cuchufli-e74cd6.netlify.app/",
    "https://inquisitive-kitsune-d53ca9.netlify.app/",
    "https://snazzy-smakager-c6bb85.netlify.app/",
    "https://gilded-daffodil-b5db6d.netlify.app/",
    "https://slumberwatch-proxy.netlify.app/",
    "https://65f5c6ebdb1002d995898f24--stalwart-selkie-de9825.netlify.app/",
    "https://benevolent-capybara-b116e6.netlify.app/",
    "https://alex-web-proxy.netlify.app/",
    "https://brilliant-bombolone-49d690.netlify.app/",
    "https://my-proxy.netlify.app/",
    "https://fabulous-praline-8641d8.netlify.app/",
    "https://freestreamemelio.netlify.app/",
    "https://tourmaline-salmiakki-d067e7.netlify.app/",
    "https://quiet-meringue-a55b67.netlify.app/",
    "https://eclectic-biscotti-713e68.netlify.app/",
    "https://csp-encore.netlify.app/",
    "https://papaya-llama-e31eb6.netlify.app/",
    "https://amazing-kataifi-18a2ad.netlify.app/",
    "https://incandescent-semolina-07183f.netlify.app/",
    "https://thriving-semolina-cfa630.netlify.app/",
    "https://friendly-dango-ab3817.netlify.app/",
    "https://funny-muffin-ba5d59.netlify.app/",
    "https://tranquil-pixie-417ed2.netlify.app/",
    "https://startling-klepon-57e000.netlify.app/",
    "https://reactor-movies.netlify.app/",
    "https://prismatic-profiterole-fb2963.netlify.app/",
    "https://lachy.netlify.app/",
    "https://dev--merry-blancmange-67b7a0.netlify.app/",
    "https://dev--profound-bublanina-abf811.netlify.app/",
    "https://dreamy-rolypoly-a31090.netlify.app/",
    "https://stellar-meringue-ccf5ba.netlify.app/",
    "https://glittery-jalebi-e8e03a.netlify.app/",
    "https://magnificent-crostata-fbf6ca.netlify.app/",
    "https://chipper-semolina-38ebf9.netlify.app/",
    "https://dev--jovial-gelato-09dbf6.netlify.app/",
    "https://imaginative-lebkuchen-7a1d56.netlify.app/",
    "https://cool-churros-6e56a8.netlify.app/",
    "https://peppy-sunburst-fb0881.netlify.app/",
    "https://musical-melomakarona-d0f8ab.netlify.app/",
    "https://strong-selkie-b9ea9e.netlify.app/",
    "https://venerable-lily-a6cddd.netlify.app/",
    "https://sudo-proxy.vercel.app/",
    "https://65be69990fe811a96f6d64b9--lively-lamington-eaaaa9.netlify.app/",
    "https://vihasflix.netlify.app/",
    "https://torn-unicorn.fly.dev/",
    "https://resplendent-buttercream-8d2bff.netlify.app/",
    "https://lovely-fenglisu-8574dc.netlify.app/",
    "https://lachy.netlify.app/",
    "https://courageous-gelato-c226ab.netlify.app/",
    "https://dainty-jalebi-2ca016.netlify.app/",
    "https://flixy-proxy.netlify.app/",
    "https://peppy-halva-64762b.netlify.app/",
    "https://lucent-caramel-6657a0.netlify.app/",
    "https://frolicking-basbousa-9bb7ec.netlify.app/",
    "https://mellow-rabanadas-82614d.netlify.app/",
    "https://beamish-malasada-f06c7b.netlify.app/",
    "https://admirable-frangollo-f0b6d6.netlify.app/",
    "https://663a74597b66d23f6f353d48--cosmic-panda-7e8904.netlify.app/",
    "https://silver-pithivier-1cc5ee.netlify.app/",
    "https://exquisite-zuccutto-d6e3b7.netlify.app/",
    "https://profound-brioche-b36c12.netlify.app/",
    "https://effortless-gumdrop-ad7b16.netlify.app/",
    "https://unfeathered.netlify.app/",
    "https://illustrious-heliotrope-ff7cf1.netlify.app/",
    "https://drunk-pussy-fainted-iguess.netlify.app/",
    "https://chipper-biscotti-5c3dfb.netlify.app/",
    "https://grand-lollipop-23451b.netlify.app/",
    "https://65ca72aaa9fc2103a99d9705--cosmic-dragon-830a5f.netlify.app/",
    "https://visionary-valkyrie-5577a4.netlify.app/",
    "https://effulgent-dasik-c6839f.netlify.app/",
    "https://ollys-movies.netlify.app/",
    "https://creative-sherbet-6f51fc.netlify.app/",
    "https://cheerful-banoffee-e9e723.netlify.app/",
    "https://667c8a4d4d57c9107aa71c73--rococo-madeleine-35cc03.netlify.app/",
    "https://celebrated-fairy-8a32f7.netlify.app/",
    "https://fancy-baklava-167ec0.netlify.app/",
    "https://visionary-capybara-dde054.netlify.app/",
    "https://flixy-proxy.netlify.app/",
    "https://bright-khapse-58c7ae.netlify.app/",
    "https://cosmic-dolphin-c327e5.netlify.app/",
    "https://cozy-buttercream-ab852d.netlify.app/",
    "https://mproxy.amrmzkr.com/",
    "https://fascinating-peony-f555de.netlify.app/",
    "https://gregarious-empanada-74238c.netlify.app/",
    "https://jocular-semifreddo-814a27.netlify.app/",
    "https://simple-proxy-production-c9e1.up.railway.app/",
    "https://roaring-pastelito-f6098c.netlify.app/",
    "https://cheerful-stardust-87220f.netlify.app/",
    "https://snazzy-sawine-c716df.netlify.app/",
    "https://neon-phoenix-dd09d8.netlify.app/",
    "https://exquisite-pithivier-01447c.netlify.app/",
    "https://preeminent-gelato-8af7be.netlify.app/",
    "https://mattmovieweb.netlify.app/",
    "https://moonlit-nougat-383187.netlify.app/",
    "https://bespoke-rolypoly-e1f32c.netlify.app/",
    "https://jazzy-caramel-681016.netlify.app/",
    "https://lambent-swan-6985c1.netlify.app/",
    "https://wonderful-truffle-4a4941.netlify.app/",
    "https://luxury-tarsier-0b8ef2.netlify.app/",
    "https://marvelous-dolphin-916e53.netlify.app/",
    "https://lambent-alpaca-ec62a4.netlify.app/",
    "https://sudo-proxy-production.up.railway.app/",
    "https://stalwart-heliotrope-59d588.netlify.app/",
    "https://dev--inspiring-begonia-6d2cbd.netlify.app/",
    "https://symphonious-trifle-fe1f3b.netlify.app/",
    "https://lighthearted-pika-36717c.netlify.app/",
    "https://bejewelled-speculoos-0b061c.netlify.app/",
    "https://melodious-crisp-aa4083.netlify.app/",
    "https://stunning-capybara-95e35b.netlify.app/",
    "https://merry-palmier-c18fee.netlify.app/",
    "https://remco0o-proxy2006.netlify.app/",
    "https://dev--magical-ganache-f0f3e1.netlify.app/",
    "https://fluffy-pothos-49ca7c.netlify.app/",
    "https://merry-cheesecake-13927c.netlify.app/",
    "https://sparkling-fudge-91570f.netlify.app/",
    "https://levrx-proxy.netlify.app/",
    "https://aesthetic-nasturtium-8ddfca.netlify.app/",
    "https://teal-chimera-1747c3.netlify.app/",
    "https://relaxed-mousse-d937ce.netlify.app/",
    "https://jocular-semifreddo-814a27.netlify.app/",
    "https://vermillion-gelato-76d104.netlify.app/",
    "https://bare-kessia-fmeee-fc3d6526.koyeb.app/",
    "https://dev--capable-babka-d949f0.netlify.app/",
    "https://curious-sprite-2c1df7.netlify.app/",
    "https://deft-starship-0785d5.netlify.app/",
    "https://fancy-bubblegum-5a304c.netlify.app/",
    "https://662e6b076f5eaccdec88bbbe--wondrous-peony-81193e.netlify.app/",
    "https://heroic-choux-9154e6.netlify.app/",
    "https://ubiquitous-salamander-2f227f.netlify.app/",
    "https://mellifluous-tanuki-fa701e.netlify.app/",
    "https://cheerful-meringue-e5ddad.netlify.app/",
    "https://red-awesome-proxy.netlify.app/",
    "https://funny-phoenix-f7e4d9.netlify.app/",
    "https://preeminent-fudge-2849a2.netlify.app/",
    "https://funny-llama-3b375f.netlify.app/",
    "https://669ac87b9dd1e0a736104bf8--graceful-gumdrop-cd98a8.netlify.app/",
    "https://65c07202f55590ef0148cbb9--cool-melba-7046c7.netlify.app/",
    "https://jolly-faloodeh-6f2169.netlify.app/",
    "https://sprightly-conkies-fb107d.netlify.app/",
    "https://dev--mellow-axolotl-db93d7.netlify.app/",
    "https://transcendent-hotteok-6c6f71.netlify.app/",
    "https://splendid-alpaca-fe6504.netlify.app/",
    "https://dev--reliable-cupcake-c7d07f.netlify.app/",
    "https://dev--prismatic-tarsier-91a237.netlify.app/",
    "https://starlit-pithivier-f1f505.netlify.app/",
    "https://frabjous-semifreddo-e3fbf0.netlify.app/",
    "https://roaring-tanuki-a435c3.netlify.app/",
    "https://stirring-toffee-e85aeb.netlify.app/",
    "https://wondrous-sherbet-0d5dd5.netlify.app/",
    "https://66726b3f70b58fb6819eb359--neon-centaur-1304b2.netlify.app/",
    "https://poetic-marshmallow-f33a51.netlify.app/",
    "https://warm-pastelito-5a7ad1.netlify.app/",
    "https://sensational-heliotrope-3569d8.netlify.app/",
    "https://levrx-proxy2.netlify.app/",
    "https://proxy.snooproxy.com/",
    "https://torn-unicorn.fly.dev/",
    "https://grand-sherbet-43d0d0.netlify.app/",
    "https://wonderful-pegasus-6ce77b.netlify.app/",
    "https://amazing-pothos-d4d717.netlify.app/",
    "https://jolly-cheesecake-e28873.netlify.app/",
    "https://classy-mousse-20507a.netlify.app/",
    "https://simple-proxy-zeta.vercel.app/",
    "https://amazing-scone-4e9d8f.netlify.app/",
    "https://clinquant-paprenjak-f8a0b7.netlify.app/",
    "https://master--imaginative-kataifi-afc45b.netlify.app/",
    "https://astra-proxy.netlify.app/",
    "https://dev--inspiring-begonia-6d2cbd.netlify.app/",
    "https://mellifluous-tanuki-fa701e.netlify.app/",
    "https://dainty-jalebi-2ca016.netlify.app/"
];

// Corrected getRandomProxy function
function getRandomProxy() {
    return proxies[Math.floor(Math.random() * proxies.length)];
}

// Encryption key for AES-256 (ensure it's 32 bytes)
const ENCRYPTION_KEY = '7f8d4a5954419824ea70b60d25115a4a3ada34dd0af2f473ace6147ed4dfce6b'; // 64 hex characters = 32 bytes

// URL encryption and compression

  function compressAndEncrypt(text) {
    const buffer = Buffer.from(text);
    const compressed = zlib.deflateSync(buffer); // Compress the data first
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(compressed); // Encrypt the compressed data
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
  }

  function encryptUrl(url) {
    // Remove specific query parameters
    url = url
      .replace(/&KEY3=[^&]*/g, '')
      .replace(/&KEY4=[^&]*/g, '')
      .replace(/&KEY5=[^&]*/g, '');
    const compressedEncrypted = compressAndEncrypt(url);
    const base64Encoded = Buffer.from(compressedEncrypted).toString('base64');
    const encryptedUrl = `https://mp4.whvx.net/mp4/${base64Encoded}`;
    return encryptedUrl;
  }
  

// TMDB API key (replace with your key)
const tmdbApiKey = '5b9790d9305dca8713b9a0afad42ea8d';

// Logger setup
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console()
    ],
});

// Rate Limiter - Limit to 100 requests per minute
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

// Random IPv4 generator
function getRandomIPv4() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// HTTPS agent setup (optional)
const agent = new https.Agent({
    keepAlive: true,
});

const movieboxBase = 'http://156.242.65.22';
const movieboxHeaders = {
    Host: 's.movieboxpro.app',
    Referer: 'https://showbox.media/',
    'X-Forwarded-For': getRandomIPv4(),
    'X-Real-IP': getRandomIPv4(),
    'HTTP_X_REAL_IP': getRandomIPv4(),
    'User-Agent': 'Mozilla/5.0'
};

// Function to fetch TID from the API
async function fetchDataTidFromAPI(title, imdbId) {
    const url = `${movieboxBase}/api/api/index.html?child_mode=0&srchtxt=${encodeURIComponent(title)}&srchmod=42&page=1&page_size=50&filter=&srchsort=&qf=1&language=en`;

    try {
        const response = await axios.get(url, { headers: movieboxHeaders }, { httpsAgent: agent });
        const data = response.data;

        if (data.success && data.data && data.data.docs) {
            const matchingDoc = data.data.docs.find(doc => doc.imdb === imdbId);
            if (matchingDoc) {
                return matchingDoc.solr_gid; // Return solr_gid (TID)
            }
        }
        throw new Error('No matching TID found.');
    } catch (error) {
        logger.error(`Error fetching data TID: ${error.message}`);
        throw new Error('Failed to fetch data TID: ' + error.message);
    }
}

// Function to fetch IMDb ID from TMDB API
async function getIMDBIdFromTMDB(tmdbId) {
    const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}`;
    
    try {
        const response = await axios.get(tmdbUrl);
        const imdbId = response.data.imdb_id;
        const title = response.data.title;
        return { imdbId, title };
    } catch (error) {
        console.error(`Error fetching IMDb ID from TMDB: ${error.message}`);
        throw new Error('Failed to fetch IMDb ID: ' + error.message);
    }
}

// Function to extract the unique ID from the share link using Puppeteer
async function fetchUniqueIdFromShareLink(tid) {
    const browser = await puppeteer.launch({ 
        headless: true,
        executablePath: process.env.CHROME_BIN || null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set user-agent to mimic the mobile browser
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36');

    const destinationUrl = `https://www.showbox.media/`;
    await page.goto(destinationUrl, { waitUntil: 'networkidle0' });

    // Execute the AJAX request in the page's context using page.evaluate
    const response = await page.evaluate(async (tid) => {
        const result = await fetch(`/index/share_link?id=${tid}&type=1`, {
            method: 'GET',
            headers: {
                'x-requested-with': 'XMLHttpRequest',
                'accept': 'application/json, text/javascript, */*; q=0.01',
            }
        });
        const textResult = await result.text(); // Get raw text response
        return textResult; // Return raw text for debugging
    }, tid);

    await browser.close();

    try {
        const jsonResponse = JSON.parse(response); // Parse the JSON response
        if (jsonResponse && jsonResponse.data && jsonResponse.data.link) {
            const uniqueId = jsonResponse.data.link.split('/share/')[1]; // Extract the unique ID
            return uniqueId;
        } else {
            throw new Error('Failed to extract unique ID from the share link.');
        }
    } catch (err) {
        console.error('Error parsing JSON:', err.message);
        throw new Error('The response was not valid JSON. Check for HTML or other errors.');
    }
}

// Function to fetch file details from Febbox
async function fetchFileDetails(uniqueId) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROME_BIN || null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Navigate to the share info page using a random proxy
        const url = `https://www.febbox.com/file/share_info?key=${uniqueId}`;
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Extract the data-id from the first file element
        const fid = await page.evaluate(() => {
            const firstFileDiv = document.querySelector('div.file');
            return firstFileDiv ? firstFileDiv.getAttribute('data-id') : null;
        });

        if (!fid) {
            throw new Error('No file found with data-id attribute.');
        }

        return fid; // Return the extracted data-id as the fid
    } catch (error) {
        console.error(`Error fetching file details: ${error.message}`);
        throw new Error('Failed to fetch file details.');
    } finally {
        await browser.close();
    }
}

// Function to download file with POST request using Puppeteer
async function downloadFileWithPost(uniqueId, fid) {
    let browser, page;
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.CHROME_BIN || null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('Opening new page...');
        page = await browser.newPage();

        // Set user-agent to mimic the mobile browser
        console.log('Setting user-agent...');
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36');

        // Set cookies for the Febbox session
        const cookies = [
            { 
                name: 'ui', 
                value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjgzNjM2NjgsIm5iZiI6MTcyODM2MzY2OCwiZXhwIjoxNzU5NDY3Njg4LCJkYXRhIjp7InVpZCI6NDY0NzUzLCJ0b2tlbiI6IjRhMWQzYmFmMGFjNWNhYTIyNDMzYjBiMmU0NzcxZjYxIn19.sGoXoIwOZfAyL6WHcRh34cA9hiwaYobmEg99FARe1fM', 
                domain: 'www.febbox.com' 
            },
        ];

        console.log('Setting cookies...');
        await page.setCookie(...cookies);

        const destinationUrl = `https://www.febbox.com/file/share_info?key=${uniqueId}`;

        await page.goto(destinationUrl, { waitUntil: 'networkidle0' });

        // Execute the POST request in the page context using page.evaluate
        console.log('Executing POST request...');
        const postResponse = await page.evaluate(async ({ fid, uniqueId }) => {
            try {
                const result = await fetch(`/file/file_download`, { 
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Content-Length': '31',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'DNT': '1',
                        'Origin': 'https://www.febbox.com',
                        'Pragma': 'no-cache',
                        'Priority': 'u=1, i',
                        'Referer': `https://www.febbox.com/share/${uniqueId}`,
                        'Sec-CH-UA': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                        'Sec-CH-UA-Mobile': '?1',
                        'Sec-CH-UA-Platform': '"Android"',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: `fid=${fid}&share_key=${uniqueId}`,
                });
        
                const textResult = await result.text(); // Get raw text response
                try {
                    return JSON.parse(textResult); // Attempt to parse as JSON
                } catch (error) {
                    return textResult; // If parsing fails, return raw text
                }
            } catch (error) {
                console.error('Error during POST request evaluation:', error);
                return { error: `POST request failed: ${error.message}` };
            }
        }, { fid, uniqueId }); 

        return postResponse; // Return the response
    } catch (error) {
        console.error('Error occurred:', error); // Log errors if any part fails
        throw error;
    } finally {
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
        }
    }
}

// Function to process and encrypt URLs in the movie data
// function processMovieData(movieData) {
//     if (movieData && movieData.data && Array.isArray(movieData.data)) {
//         movieData.data.forEach(movie => {
//             if (movie.quality_list && Array.isArray(movie.quality_list)) {
//                 movie.quality_list.forEach(quality => {
//                     if (quality.download_url) {
//                         quality.download_url = encryptUrl(quality.download_url);
//                     }
//                 });
//             }
//             // Optionally, encrypt the main download_url as well
//             if (movie.download_url) {
//                 movie.download_url = encryptUrl(movie.download_url);
//             }
//         });
//     }
//     return movieData;
// }

const app = express();
const port = process.env.PORT || 1000;
app.use(cors());
app.use(limiter); // Apply rate limiter globally


// Queue each request
app.get('/movie/:tmdbid', async (req, res) => {
    const tmdbId = req.params.tmdbid;

    const { default: PQueue } = await import('p-queue');

    // Initialize queue with concurrency of 1
    const queue = new PQueue({ concurrency: 1 });

    // Add the request to the queue and process sequentially
    queue.add(async () => {
        try {
            // Step 1: Get IMDb ID and Title from TMDB
            const { imdbId, title } = await getIMDBIdFromTMDB(tmdbId);
            console.log('IMDb ID:', imdbId);
            console.log('Title:', title);

            // Step 2: Fetch TID using Title and IMDb ID
            const tid = await fetchDataTidFromAPI(title, imdbId);

            // Step 3: Fetch Unique ID from Share Link
            const uniqueId = await fetchUniqueIdFromShareLink(tid);

            // Step 4: Fetch File ID (fid) from Febbox
            const fid = await fetchFileDetails(uniqueId);

            // Step 5: Download File with POST request
            const postResponse = await downloadFileWithPost(uniqueId, fid);

            // Assuming postResponse is in the Cinescrape format
            // Encrypt the URLs in the response data
            // const encryptedMovieData = processMovieData(postResponse);

            // Send the encrypted movie data back as a response
            res.json(postResponse);
        } catch (error) {
            console.error('Error in processing:', error.message);
            res.status(500).json({ error: error.message });
        }
    }).catch(err => {
        console.error('Queue error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
});
