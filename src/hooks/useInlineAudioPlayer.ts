import { useEffect, useRef, useState } from 'react';

export function useInlineAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopById, setLoopById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const audio = new Audio();
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
      setActiveId(id);
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error('Unable to play audio:', error);
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
