const MIN_SECTION_SECONDS = 1;
const MAX_SECTION_SECONDS = 45;

export function getChorusSuggestion(duration) {
  const length = Math.floor(duration);
  if (!Number.isFinite(length) || length < MIN_SECTION_SECONDS) return null;
  const start = Math.floor(length / 4);
  return { start, end: Math.min(length, start + 30) };
}

export function matchesPlaybackTarget(target, player) {
  if (player.getVideoData?.()?.video_id !== target.id) return false;
  if (!target.section) return true;
  const time = player.getCurrentTime?.();
  return Number.isFinite(time) && time >= target.section.start - 0.35 && time < target.section.end;
}

export function getSectionTime(section, time) {
  return Number.isFinite(time) ? Math.min(section.end, Math.max(section.start, time)) : section.start;
}

export function restoreStudioCheckpoint(checkpoint, sections) {
  if (!Number.isInteger(checkpoint?.index) || !Number.isFinite(checkpoint.time)) return null;
  const section = sections[checkpoint.index];
  if (!section) return null;
  return {
    index: checkpoint.index,
    time: getSectionTime(section, checkpoint.time),
    iteration: Number.isInteger(checkpoint.iteration) ? Math.max(0, checkpoint.iteration) : 0,
    selection: checkpoint.selection === checkpoint.index ? checkpoint.index : null
  };
}

export function trimSection(section, boundary, value, duration) {
  if (value === '' || !Number.isFinite(Number(value))) return section;

  const max = Math.max(MIN_SECTION_SECONDS, Math.floor(duration));
  const clamp = (time, min, limit) => Math.min(limit, Math.max(min, time));
  const start = clamp(section.start, 0, max - MIN_SECTION_SECONDS);
  const end = clamp(section.end, start + MIN_SECTION_SECONDS, Math.min(max, start + MAX_SECTION_SECONDS));
  const time = Math.round(Number(value));

  return boundary === 'start'
    ? { ...section, start: clamp(time, Math.max(0, end - MAX_SECTION_SECONDS), end - MIN_SECTION_SECONDS), end }
    : { ...section, start, end: clamp(time, start + MIN_SECTION_SECONDS, Math.min(max, start + MAX_SECTION_SECONDS)) };
}

let youtubeRequest;

export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  youtubeRequest ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(fail, 10000);
    function fail() {
      clearTimeout(timeout);
      script.remove();
      delete window.onYouTubeIframeAPIReady;
      youtubeRequest = undefined;
      reject(new Error('YouTube could not load'));
    }
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve(window.YT);
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return youtubeRequest;
}
