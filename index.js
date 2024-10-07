const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const winston = require('winston');
const https = require('https');
const express = require('express');

puppeteer.use(stealth());

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
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Navigate to the share info page
        await page.goto(`https://www.febbox.com/file/share_info?key=${uniqueId}`, { waitUntil: 'networkidle0' });

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
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('Opening new page...');
        page = await browser.newPage();

        // Set user-agent to mimic the mobile browser
        console.log('Setting user-agent...');
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36');

        // Set cookies for the Febbox session
        const cookies = [
            { name: 'ui', value: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjczOTc3MjgsIm5iZiI6MTcyNzM5NzcyOCwiZXhwIjoxNzU4NTAxNzQ4LCJkYXRhIjp7InVpZCI6NDY0NzUzLCJ0b2tlbiI6IjU3YjFkN2E3NGJjZTZmNWVkM2Q2MzdkNTc1NTI5ZDdiIn19.ZeqsJc3efUuEE9PcX-a6nZbwySY5n8Me5hUgaT1qB6w', domain: 'www.febbox.com' },
        ];

        console.log('Setting cookies...');
        await page.setCookie(...cookies);

        await page.goto(`https://www.febbox.com/file/share_info?key=${uniqueId}`, { waitUntil: 'networkidle0' });

        // Execute the POST request in the same page context using page.evaluate
        console.log('Executing POST request...');
        const postResponse = await page.evaluate(async ({ fid, uniqueId }) => {
            try {
                const result = await fetch('/file/player', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Content-Length': '30',
                        'DNT': '1',
                        'Origin': 'https://www.febbox.com',
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


function formatResponse(data) {
    let responseJson = {
        fileId: data.fileId,
        videoSources: []
    };

    if (data.postResponse && data.postResponse.indexOf('var sources =') !== -1) {
        let sourcesMatch = data.postResponse.match(/var sources = (\[.*?\]);/s);
        if (sourcesMatch && sourcesMatch[1]) {
            let sources;
            try {
                sources = JSON.parse(sourcesMatch[1]);
                sources.forEach(source => {
                    responseJson.videoSources.push({
                        source: source.source,
                        type: source.type,
                        label: source.label,
                        file: source.file
                    });
                });
            } catch (e) {
                console.error('Error parsing sources:', e);
            }
        }
    }

    return responseJson; // Return the object instead of a string
}

// Set up Express server
const app = express();
const port = 1000;

app.get('/:tmdbid', async (req, res) => {
    const tmdbId = req.params.tmdbid;
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

        // Format the response
        const formattedResponse = formatResponse({
            fileId: fid,
            postResponse: postResponse
        });

        // Send the formatted JSON response
        res.json(formattedResponse); // Use res.json() to send JSON response
    } catch (error) {
        console.error('Error in processing:', error.message);
        res.status(500).json({ error: error.message }); // Send error as JSON
    }
});

app.listen('0.0.0.0', port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
