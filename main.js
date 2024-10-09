const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const zlib = require('zlib');

const app = express();
const port = 3000;

app.use(express.json());

let consecutive1080pMisses = 0;
let notificationSent = false;

// Your actual cookie value
const cookieValue = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjgzNjM2NjgsIm5iZiI6MTcyODM2MzY2OCwiZXhwIjoxNzU5NDY3Njg4LCJkYXRhIjp7InVpZCI6NDY0NzUzLCJ0b2tlbiI6IjRhMWQzYmFmMGFjNWNhYTIyNDMzYjBiMmU0NzcxZjYxIn19.sGoXoIwOZfAyL6WHcRh34cA9hiwaYobmEg99FARe1fM';

const ENCRYPTION_KEY = '7f8d4a5954419824ea70b60d25115a4a3ada34dd0af2f473ace6147ed4dfce6b'; // Must be 256 bits (32 bytes)



function getRandomProxy() {
  const proxyUrls = Object.keys(proxies);
  return proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
}

async function getNextCookie() {
  return cookieValue;
}

function mapQuality(quality) {
  switch (quality) {
    case '240p': return '240';
    case '360p': return '360';
    case '480p': return '480';
    case '720p': return '720';
    case '1080p': return '1080';
    case 'ORG': return 'ORG';
    default: return null;
  }
}

function extractQualityFromFilename(filename) {
  const qualityRegex = /(\d{3,4})p/;
  const match = filename.match(qualityRegex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
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

function compressAndEncrypt(text) {
  const buffer = Buffer.from(text);
  const compressed = zlib.deflateSync(buffer); // Compress the data first
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(compressed); // Encrypt the compressed data
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
}

async function getSeasonDataId(proxy, id, season, febboxHeaders) {
  try {
    // Initial call to get the parent folder ID (firstFID)
    let url = `https://www.febbox.com/file/file_share_list?page=1&share_key=${id}&pwd=&parent_id=0&is_html=0`;
    let proxiedUrl = `${proxy}?destination=${encodeURIComponent(url)}`;
    console.log(proxiedUrl);
    let response = await axios.get(proxiedUrl, { headers: febboxHeaders });
    if (response.data.code !== 1) {
      throw new Error('Failed to retrieve the initial file list');
    }

    const firstFID = response.data.data.file_list[0]?.fid;
    if (!firstFID) {
      return null; // Early exit if no firstFID found
    }

    // Iterate over a maximum of 2 pages to find the season data ID
    for (let page = 1; page <= 2; page++) {
      url = `https://www.febbox.com/file/file_share_list?page=${page}&share_key=${id}&pwd=&parent_id=${firstFID}&is_html=0`;
      proxiedUrl = `${proxy}?destination=${encodeURIComponent(url)}`;
      response = await axios.get(proxiedUrl, { headers: febboxHeaders });

      if (response.data.code !== 1) {
        continue; // Skip to the next page if the current one fails
      }

      // Search for the season folder
      const seasonFolder = response.data.data.file_list.find(file => file.file_name.toLowerCase() === `season ${season}`);
      if (seasonFolder) {
        return seasonFolder.fid; // Return the fid of the season
      }
    }

    return null; // Return null if no season data ID found after 2 pages
  } catch (error) {
    console.error('Error in getSeasonDataId:', error.message);
    return null;
  }
}

function findEpisodeFid(fileShareListData, season, episode) {
  // Implement your logic to find the episode FID based on the season and episode
  // Placeholder implementation
  return 'episodeFid_placeholder';
}

async function fetchPlayerData(fid, proxy) {
  // Implement your logic to fetch player data
  // Placeholder implementation
  return {};
}

function extractCaptionsFromPlayerData(playerData) {
  // Implement your logic to extract captions from player data
  // Placeholder implementation
  return [];
}

async function extractLargestFileDataId(shareInfoData) {
  // Implement your logic to extract the largest file data ID
  // Placeholder implementation
  return 'largestFileId_placeholder';
}

async function fetchAndAddQualities(proxy, fid, shareKey, qualities) {
  let currentCookie = await getNextCookie();
  const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    
    "Referer": "https://febbox.com/",
    "Cookie": `ui=${currentCookie};`
  };
  const url = `https://www.febbox.com/file/file_download?fid=${fid}&share_key=${shareKey}`;
  const proxyUrl = `${proxy}?destination=${encodeURIComponent(url)}`;
  try {
    const response = await axios.get(proxyUrl, { headers });
    const data = response.data.data[0].quality_list;
    let has1080p = false;
    let hasSources = data.length > 0;

    data.forEach((source) => {
      const mappedQuality = mapQuality(source.quality);
      if (mappedQuality && mappedQuality !== 'ORG') {
        if (source.download_url && source.download_url.trim() !== '') {
          qualities[mappedQuality] = {
            type: 'mp4',
            url: encryptUrl(source.download_url)
          };
          if (mappedQuality === '1080') {
            has1080p = true;
          }
        }
      } else if (source.quality === 'ORG') {
        const urlParams = new URLSearchParams(source.download_url);
        const fileName = urlParams.get('KEY5');

        if (fileName && fileName.endsWith('.mp4')) {
          const fileQuality = extractQualityFromFilename(fileName);

          if (fileQuality && !qualities[fileQuality]) {
            if (source.download_url && source.download_url.trim() !== '') {
              qualities[fileQuality] = {
                type: 'mp4',
                url: encryptUrl(source.download_url)
              };
              if (fileQuality === '1080') {
                has1080p = true;
              }
            }
          }
        }
      }
    });

    if (!has1080p || !hasSources) {
      consecutive1080pMisses++;
    } else {
      consecutive1080pMisses = 0;
      notificationSent = false;
    }
  } catch (error) {
    console.error('Error fetching quality data:', error);
  }
}

const febboxHeaders = {
  'Referer': 'https://febbox.com/',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
  'Cookie': `ui=${cookieValue};`
};

app.post('/test', async (req, res) => {
  const id = req.body.id || req.query.id;
  const season = req.body.season || req.query.season;
  const episode = req.body.episode || req.query.episode;
  let proxy = req.body.proxy || req.query.proxy;

  if (!proxy) {
    proxy = getRandomProxy();
  }

  const qualities = {};
  let captions = [];

  const febboxBase = 'https://www.febbox.com';

  const newFebboxHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Pragma": "no-cache",
    "Referer": "https://www.febbox.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    "Cookie": `ui=${cookieValue};`
  };

  try {
    if (season && episode && season.trim() !== '' && episode.trim() !== '') {
      let seasonDataId = await getSeasonDataId(proxy, id, season, febboxHeaders);
      if (!seasonDataId) {
        return res.status(404).json({ error: 'Season data-id not found' });
      }

      if (id === 'R6JYAeL9' && season === '9') {
        seasonDataId = '11636324';
      }
      const fileShareListUrl = `${febboxBase}/file/file_share_list?share_key=${id}&pwd=&parent_id=${seasonDataId}&is_html=0`;
      const proxiedFileShareListUrl = `${proxy}?destination=${encodeURIComponent(fileShareListUrl)}`;
      const fileShareListResponse = await axios.get(proxiedFileShareListUrl, { headers: newFebboxHeaders });
      const fileShareListData = fileShareListResponse.data;
      if (!fileShareListData || fileShareListData.code !== 1) {
        return res.status(500).json({ error: 'Failed to retrieve file share list' });
      }

      let episodeFid = findEpisodeFid(fileShareListData, season, episode);
      if (id === 'R6JYAeL9' && season === '9') {
        episodeFid = findEpisodeFid(fileShareListData, '12', episode);
      }
      if (!episodeFid) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      const filePlayerResponse = await fetchPlayerData(episodeFid, proxy);
      captions = extractCaptionsFromPlayerData(filePlayerResponse);
      await fetchAndAddQualities(proxy, episodeFid, id, qualities);
    } else {
      const shareInfoUrl = `${febboxBase}/file/file_share_list?share_key=${id}&is_html=0`;
      const proxiedShareInfoUrl = `${proxy}?destination=${encodeURIComponent(shareInfoUrl)}`;
      const shareInfoResponse = await axios.get(proxiedShareInfoUrl, { headers: newFebboxHeaders });
      const shareInfoData = shareInfoResponse.data;
      let apiCall = await extractLargestFileDataId(shareInfoData);
      const getFileId = `${febboxBase}/file/file_share_list?share_key=${id}&parent_id=${apiCall}&is_html=0`;
      const proxiedGetFileId = `${proxy}?destination=${encodeURIComponent(getFileId)}`;
      const getFileIdResponse = await axios.get(proxiedGetFileId, { headers: newFebboxHeaders });
      const getFileIdData = getFileIdResponse.data;
      let largestFileId = await extractLargestFileDataId(getFileIdData);
      if (id === 'JPuUHSBZ') {
        largestFileId = '6188496';
      }
      if (id === 'F37i6Kx7') {
        largestFileId = '6319922';
      }
      if (!largestFileId) {
        return res.status(404).json({ error: 'No files found' });
      }

      const filePlayerResponse = await fetchPlayerData(largestFileId, proxy);
      await fetchAndAddQualities(proxy, largestFileId, id, qualities);
      captions = extractCaptionsFromPlayerData(filePlayerResponse);
    }

    res.json({
      qualities,
      captions
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});