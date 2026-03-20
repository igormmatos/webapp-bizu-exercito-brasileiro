import { useEffect, useRef, useState } from 'react';

function getMediaErrorDetails(audio: HTMLAudioElement, playError?: unknown): string {
  if (audio.error) {
    switch (audio.error.code) {
      case 1:
        return 'media aborted by user';
      case 2:
        return 'network error while fetching media';
      case 3:
        return 'media decode error';
      case 4:
        return 'media source not supported';
      default:
        return 'unknown media error';
    }
  }

  if (playError instanceof Error) return playError.message;
  if (typeof playError === 'string') return playError;
  return 'unknown audio playback error';
}

export function useInlineAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopById, setLoopById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audioRef.current = audio;

    const handleLoadStart = () => {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };
    const handleDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleEnded = () => {
      if (!audio.loop) {
        setActiveId(null);
      }
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
    };
    const handleError = () => {
      console.error('Audio element error:', getMediaErrorDetails(audio));
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
      setActiveId(null);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  const isLoopEnabled = (id: string) => Boolean(loopById[id]);

  const toggleLoop = (id: string) => {
    setLoopById((prev) => {
      const nextLoopValue = !prev[id];
      const next = { ...prev, [id]: nextLoopValue };

      if (audioRef.current && activeId === id) {
        audioRef.current.loop = nextLoopValue;
      }

      return next;
    });
  };

  const togglePlay = async (id: string, sourceUrl: string) => {
    const audio = audioRef.current;
    if (!audio || !sourceUrl) return;

    const isCurrentTrack = activeId === id;

    if (!isCurrentTrack) {
      audio.pause();
      audio.src = sourceUrl;
      audio.loop = isLoopEnabled(id);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      audio.load();
      setActiveId(id);
    } else {
      audio.loop = isLoopEnabled(id);
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        const details = getMediaErrorDetails(audio, error);
        console.error('Unable to play audio:', details, { id, sourceUrl });
        setIsPlaying(false);
        setIsLoading(false);
        if (!isCurrentTrack) {
          setCurrentTime(0);
          setDuration(0);
          setActiveId(null);
        }
      }
    } else {
      audio.pause();
    }
  };

  const seekToFraction = (fraction: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const clampedFraction = Math.max(0, Math.min(fraction, 1));
    const nextTime = duration * clampedFraction;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return {
    activeId,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    isLoopEnabled,
    seekToFraction,
    toggleLoop,
    togglePlay,
  };
}
