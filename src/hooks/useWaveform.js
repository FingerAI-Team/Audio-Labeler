import { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";

export default function useWaveform({
  audioUrl,
  showSample = false,
  minPxPerSec = 2,
  WAVEFORM_HEIGHT = 100,
  onReady,
  onError,
  onTimeUpdate,
  setIsLoading,
  setCurrentTime: setCurrentTimeProp,
}) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    if (!audioUrl && !showSample) {
      setIsLoading && setIsLoading(false);
      return;
    }
    setIsLoading && setIsLoading(true);
    if (!containerRef.current) return;
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch (e) {}
      wavesurferRef.current = null;
    }
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#b0b7c3",
      progressColor: "#b0b7c3",
      height: WAVEFORM_HEIGHT,
      minPxPerSec,
      scrollParent: false,
      fetchParams: { signal: abortController.signal },
    });
    const regionsPlugin = RegionsPlugin.create({ dragSelection: false });
    ws.registerPlugin(regionsPlugin);
    regionsPluginRef.current = regionsPlugin;
    const url = showSample ? "/sample.wav" : audioUrl;
    if (url) {
      try {
        ws.load(url).catch((error) => {
          if (error.name === "AbortError") {
            // 무시
          } else {
            onError && onError(error);
          }
        });
      } catch (error) {
        onError && onError(error);
      }
    }
    wavesurferRef.current = ws;
    const handleReady = () => {
      if (isMounted && wavesurferRef.current === ws) {
        setIsLoading && setIsLoading(false);
        onReady && onReady(ws);
      }
    };
    ws.once("ready", handleReady);
    const handleTimeUpdate = () => {
      setCurrentTime(ws.getCurrentTime());
      setCurrentTimeProp && setCurrentTimeProp(ws.getCurrentTime());
      onTimeUpdate && onTimeUpdate(ws.getCurrentTime());
    };
    ws.on("timeupdate", handleTimeUpdate);
    const handleError = (error) => {
      setIsLoading && setIsLoading(false);
      onError && onError(error);
    };
    ws.on("error", handleError);
    return () => {
      isMounted = false;
      abortController.abort();
      try { ws.un("ready", handleReady); } catch (e) {}
      try { ws.un("timeupdate", handleTimeUpdate); } catch (e) {}
      try { ws.un("error", handleError); } catch (e) {}
      try { ws.destroy(); } catch (e) {}
      if (wavesurferRef.current === ws) {
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, showSample, minPxPerSec, WAVEFORM_HEIGHT]);

  return {
    containerRef,
    wavesurferRef,
    regionsPluginRef,
    currentTime,
  };
} 