const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const winston = require('winston');
const https = require('https');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

puppeteer.use(stealth());


const cookieOptions = [
    { 
        name: 'ui', 
        value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjgzNjM2NjgsIm5iZiI6MTcyODM2MzY2OCwiZXhwIjoxNzU5NDY3Njg4LCJkYXRhIjp7InVpZCI6NDY0NzUzLCJ0b2tlbiI6IjRhMWQzYmFmMGFjNWNhYTIyNDMzYjBiMmU0NzcxZjYxIn19.sGoXoIwOZfAyL6WHcRh34cA9hiwaYobmEg99FARe1fM', 
        domain: 'www.febbox.com' 
    },
    // { 
    //     name: 'ui', 
    //     value: 'another-cookie-value-1', 
    //     domain: 'www.febbox.com' 
    // },
    // { 
    //     name: 'ui', 
    //     value: 'another-cookie-value-2', 
    //     domain: 'www.febbox.com' 
    // }
];


function getRandomCookie() {
    const randomIndex = Math.floor(Math.random() * cookieOptions.length);
    return cookieOptions[randomIndex];
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
    rejectUnauthorized: false
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
    const url = `https://www.febbox.com/file/file_share_list?share_key=${uniqueId}`;

    try {
        // Send a GET request to the Febbox API
        const response = await axios.get(url);
        const data = response.data;

        // Check if the response is successful and contains file data
        if (data && data.code === 1 && data.data && data.data.file_list && data.data.file_list.length > 0) {
            // Extract the first file's fid
            const fid = data.data.file_list[0].fid;
            return fid;
        } else {
            throw new Error('No file found or API returned an unexpected response.');
        }
    } catch (error) {
        console.error(`Error fetching file details: ${error.message}`);
        throw new Error('Failed to fetch file details.');
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
        const selectedCookie = getRandomCookie();

        console.log('Setting cookies...');
        await page.setCookie(selectedCookie);

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
