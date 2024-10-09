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

const proxies = {
    "https://levrx-proxy2.netlify.app/": "44.219.53.183",
    "https://proxy.snooproxy.com/": "54.84.236.175",
    "https://torn-unicorn.fly.dev/": "66.241.125.132",
    "https://grand-sherbet-43d0d0.netlify.app/": "54.84.236.175",
    "http://129.153.48.23:3000/": "129.153.48.23",
    "https://wonderful-pegasus-6ce77b.netlify.app/": "54.161.234.33",
    "https://amazing-pothos-d4d717.netlify.app/": "44.219.53.183",
    "http://130.61.170.99:3000/": "130.61.170.99",
    "https://jolly-cheesecake-e28873.netlify.app/": "54.84.236.175",
    "http://139.59.140.80:3000/": "139.59.140.80",
    "https://classy-mousse-20507a.netlify.app/": "44.217.161.11",
    "http://207.244.233.58:3000/": "207.244.233.58",
    "https://simple-proxy-zeta.vercel.app/": "76.76.21.241",
    "http://104.245.107.79:4001/": "104.245.107.79",
    "https://amazing-scone-4e9d8f.netlify.app/": "54.161.234.33",
    "http://162.255.87.125:3000/": "162.255.87.125",
    "https://clinquant-paprenjak-f8a0b7.netlify.app/": "44.217.161.11",
    "https://master--imaginative-kataifi-afc45b.netlify.app/": "54.161.234.33",
    "https://astra-proxy.netlify.app/": "44.217.161.11",
    "https://dev--inspiring-begonia-6d2cbd.netlify.app/": "3.237.50.161",
    "https://mproxy.jawshoeadan.me/": "172.91.81.1",
    "http://vmi1936704.contaboserver.net:3000/": "207.244.233.58",
    "https://mellifluous-tanuki-fa701e.netlify.app/": "3.221.163.200",
    "https://dainty-jalebi-2ca016.netlify.app/": "44.204.107.157",
    "https://proxy.wafflehacker.io/": "66.241.125.132"
  };

// Encryption key for AES-256
const ENCRYPTION_KEY = '7f8d4a5954419824ea70b60d25115a4a3ada34dd0af2f473ace6147ed4dfce6b'; // 32 bytes

// Random proxy selection
function getRandomProxy() {
    const proxyUrls = Object.keys(proxies);
    return proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
}

// URL encryption and compression
function compressAndEncrypt(text) {
    const buffer = Buffer.from(text);
    const compressed = zlib.deflateSync(buffer);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(compressed);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
}

function encryptUrl(url) {
    url = url.replace(/&KEY3=[^&]*/g, '').replace(/&KEY4=[^&]*/g, '').replace(/&KEY5=[^&]*/g, '');
    const compressedEncrypted = compressAndEncrypt(url);
    const base64Encoded = Buffer.from(compressedEncrypted).toString('base64');
    return `https://mp4.whvx.net/mp4/${base64Encoded}`;
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
        const response = await axios.get(url, { headers: movieboxHeaders }, agent);
        const data = response.data;

        if (data.success && data.data && data.data.docs) {
            const matchingDoc = data.data.docs.find(doc => doc.imdb === imdbId);
            if (matchingDoc) {
                return matchingDoc.solr_gid; // Return solr_gid (TID)
            }
        }
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

    await page.goto(`https://www.showbox.media/`, { waitUntil: 'networkidle0' });

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
        // Navigate to the share info page
        const proxy = getRandomProxy();
        const url = `https://www.febbox.com/file/share_info?key=${uniqueId}`;
        const proxiedUrl = `${proxy}?destination=${encodeURIComponent(url)}`;
        await page.goto(proxiedUrl, { waitUntil: 'networkidle0' });

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
            { name: 'ui', value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjgzNjM2NjgsIm5iZiI6MTcyODM2MzY2OCwiZXhwIjoxNzU5NDY3Njg4LCJkYXRhIjp7InVpZCI6NDY0NzUzLCJ0b2tlbiI6IjRhMWQzYmFmMGFjNWNhYTIyNDMzYjBiMmU0NzcxZjYxIn19.sGoXoIwOZfAyL6WHcRh34cA9hiwaYobmEg99FARe1fM', domain: 'www.febbox.com' },
        ];

        console.log('Setting cookies...');
        await page.setCookie(...cookies);

        const proxy = getRandomProxy();
        const destinationUrl = `https://www.febbox.com/file/share_info?key=${uniqueId}`;
        const proxiedDestinationUrl = `${proxy}?destination=${encodeURIComponent(destinationUrl)}`;

        await page.goto(proxiedDestinationUrl, { waitUntil: 'networkidle0' });

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
const app = express();
const port = process.env.PORT || 1000;
app.use(cors());
app.use(limiter); // Apply rate limiter globally

// Queue each request
app.get('/movie/:tmdbid', async (req, res) => {
    const tmdbId = req.params.tmdbid;

    // Import p-queue dynamically within the route handler
    const { default: PQueue } = await import('p-queue');

    // Initialize queue with concurrency of 1
    const queue = new PQueue({ concurrency: 1 });

    // Add the request to the queue and process sequentially
    queue.add(async () => {
        try {
            const { imdbId, title } = await getIMDBIdFromTMDB(tmdbId);
            console.log('IMDb ID:', imdbId);
            const tid = await fetchDataTidFromAPI(title, imdbId);
            console.log('TID:', tid);
            const uniqueId = await fetchUniqueIdFromShareLink(tid);
            console.log('Unique ID:', uniqueId);
            const fid = await fetchFileDetails(uniqueId);
            console.log('File ID:', fid);
            const postResponse = await downloadFileWithPost(uniqueId, fid);

            res.json(postResponse);
        } catch (error) {
            console.error('Error in processing:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${port}`);
});