// src/lib/spotifyUtils.js
let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  // Check if token is still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    return null;
  }
};

export const searchArtistImage = async (artistName) => {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    // Clean artist name (remove "(Official Video)", "ft.", etc.)
    const cleanName = artistName
      .replace(/\(.*?\)/g, '')
      .replace(/ft\.|feat\.|featuring/gi, '')
      .split('-')[0]
      .split('x')[0]
      .trim();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanName)}&type=artist&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (data.artists?.items?.[0]?.images?.[0]?.url) {
      return data.artists.items[0].images[0].url;
    }

    return null;
  } catch (error) {
    console.error('Spotify search failed:', error);
    return null;
  }
};

// Cache artist images to avoid repeated API calls
const imageCache = new Map();

export const getArtistImageWithCache = async (artistName) => {
  if (imageCache.has(artistName)) {
    return imageCache.get(artistName);
  }

  const imageUrl = await searchArtistImage(artistName);
  imageCache.set(artistName, imageUrl);
  
  return imageUrl;
};

export const extractArtistFromTitle = (title) => {
  // Extract artist from common YouTube title formats:
  // "Artist - Song Title"
  // "Artist - Song Title (Official Video)"
  // "Song Title by Artist"
  
  let artist = 'Unknown Artist';
  
  if (title.includes(' - ')) {
    artist = title.split(' - ')[0].trim();
  } else if (title.toLowerCase().includes(' by ')) {
    const parts = title.toLowerCase().split(' by ');
    artist = parts[parts.length - 1].trim();
  }
  
  // Remove common suffixes
  artist = artist
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/official/gi, '')
    .replace(/video/gi, '')
    .replace(/audio/gi, '')
    .trim();
  
  return artist;
};