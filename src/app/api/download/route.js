import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request) {
  try {
    const { videoId, startTime, endTime, title } = await request.json();

    // Validate inputs
    if (!videoId || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const duration = endTime - startTime;
    if (duration > 45) {
      return NextResponse.json(
        { error: 'Loop duration cannot exceed 45 seconds' },
        { status: 400 }
      );
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const safeTitle = (title || 'loop').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputFileName = `${safeTitle}_${Date.now()}.mp3`;
    const outputPath = path.join(tempDir, outputFileName);

    // Download and extract audio using yt-dlp (better than youtube-dl)
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Command to download audio and cut to specific time range
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 --external-downloader ffmpeg --external-downloader-args "ffmpeg_i:-ss ${startTime} -to ${endTime}" -o "${outputPath}" "${youtubeUrl}"`;

    console.log('Executing:', command);
    
    await execPromise(command, { timeout: 60000 }); // 60 second timeout

    // Check if file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create audio file');
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(outputPath);

    // Delete temp file
    fs.unlinkSync(outputPath);

    // Return audio file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download audio', details: error.message },
      { status: 500 }
    );
  }
}