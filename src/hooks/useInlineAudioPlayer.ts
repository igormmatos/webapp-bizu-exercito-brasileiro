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
  const [loopById, setLoopById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (!audio.loop) {
        setActiveId(null);
      }
      setIsPlaying(false);
    };
    const handleError = () => {
      console.error('Audio element error:', getMediaErrorDetails(audio));
      setIsPlaying(false);
      setActiveId(null);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
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
        if (!isCurrentTrack) {
          setActiveId(null);
        }
      }
    } else {
      audio.pause();
    }
  };

  return {
    activeId,
    isPlaying,
    isLoopEnabled,
    toggleLoop,
    togglePlay,
  };
}
