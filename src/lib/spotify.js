// lib/spotify.js

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let spotifyToken = null;
let tokenExpiry = 0;

export const getSpotifyToken = async () => {
  // Check if token is still valid
  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    spotifyToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return spotifyToken;
  } catch (error) {
    console.error('Spotify token error:', error);
    return null;
  }
};

export const searchArtist = async (artistName) => {
  try {
    const token = await getSpotifyToken();
    if (!token) return null;
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const data = await response.json();
    const artist = data.artists?.items[0];
    
    if (!artist) return null;
    
    return {
      name: artist.name,
      image: artist.images[0]?.url || null,
      followers: artist.followers.total,
      genres: artist.genres,
      spotifyUrl: artist.external_urls.spotify
    };
  } catch (error) {
    console.error('Spotify artist search error:', error);
    return null;
  }
};

export const getArtistTopTracks = async (artistId) => {
  try {
    const token = await getSpotifyToken();
    if (!token) return [];
    
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=KE`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Spotify top tracks error:', error);
    return [];
  }
};