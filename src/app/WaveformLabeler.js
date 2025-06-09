"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import RewindIcon from './icons/backward.svg';
import PlayIcon from './icons/play.svg';
import ForwardIcon from './icons/forward.svg';
import PauseIcon from './icons/pause.svg';
import SettingIcon from './icons/setting.svg';
import LoadingIcon from './icons/loading.svg';
import AnnotationPanel from './AnnotationPanel';
import SpeakerManager from './components/SpeakerManager';
import { speakerColors, defaultSpeakerColor } from "../constants/waveformColors";
import { regionStyles } from "../constants/waveformStyles";
import { formatTimeFull } from "../utils/timeFormat";
import useWaveform from "../hooks/useWaveform";
import useRegions from "../hooks/useRegions";
import RegionList from "../components/RegionList";
import RegionEditor from "../components/RegionEditor";

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(e) {
    if (
      e.reason?.name === 'AbortError' ||
      (typeof e.reason?.message === 'string' && e.reason.message.includes('aborted'))
    ) {
      e.preventDefault(); // 콘솔에 안 뜨게 함
    }
  });
}

const WAVEFORM_HEIGHT = 100; // 원하는 값으로 한 번에 관리
export default function WaveformLabeler(props) {
  // 기존 props 분해
  const { audioUrl, showSample, showGuide, onPlayingChange, onLabelsChange } = props;

  // 파형 관련 훅 사용
  const [isLoading, setIsLoading] = useState(false);
  const {
    containerRef,
    wavesurferRef,
    regionsPluginRef,
    currentTime,
    setCurrentTime,
  } = useWaveform({
    audioUrl,
    showSample,
    WAVEFORM_HEIGHT,
    setIsLoading,
  });

  // 1. 먼저 상태 선언
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [highlightedSpeaker, setHighlightedSpeaker] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 2. getRegionStyle 선언 (이 상태들을 의존성으로)
  const [hiddenSpeakers, setHiddenSpeakers] = useState(new Set());
  const getRegionStyle = useCallback((regionId, speaker) => {
    const isSelected = regionId === selectedRegionId;
    const isHighlighted = speaker === highlightedSpeaker;
    let style;
    if (!speaker) {
      style = {
        ...regionStyles.default,
        ...(isSelected ? regionStyles.selected : {}),
        opacity: highlightedSpeaker ? 0.3 : 1
      };
    } else {
      const speakerColor = speakerColors[speaker] || defaultSpeakerColor;
      const baseStyle = isSelected ? speakerColor.selected : speakerColor.default;
      const rgbaMatch = baseStyle.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      let borderColor = baseStyle.color;
      if (rgbaMatch) {
        const [_, r, g, b] = rgbaMatch;
        borderColor = `rgba(${r}, ${g}, ${b}, 0.35)`;
      }
      style = {
        color: baseStyle.color,
        borderColor: borderColor,
        borderWidth: 2,
        opacity: highlightedSpeaker ? (isHighlighted ? 1 : 0.3) : 1,
        handleStyle: {
          left: {
            backgroundColor: borderColor,
            width: '4px',
            height: '100%',
            cursor: 'ew-resize'
          },
          right: {
            backgroundColor: borderColor,
            width: '4px',
            height: '100%',
            cursor: 'ew-resize'
          }
        }
      };
    }
    // 숨김 처리
    if (speaker && hiddenSpeakers.has(speaker)) {
      style = { ...style, opacity: 0, pointerEvents: 'none' };
    }
    return style;
  }, [selectedRegionId, highlightedSpeaker, hiddenSpeakers]);

  // 3. useRegions에 상태와 set함수, getRegionStyle을 모두 넘김
  const {
    speakerRegions,
    setSpeakerRegions,
    handleRegionClick,
    handleRegionRemoved,
    updateAllRegionStyles,
  } = useRegions({
    regionsPluginRef,
    wavesurferRef,
    getRegionStyle,
    selectedRegionId,
    setSelectedRegionId,
    highlightedSpeaker,
    setHighlightedSpeaker,
  });

  const [hover, setHover] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [minPxPerSec, setMinPxPerSec] = useState(2);

  // 화자 관련 상태
  const [speakers, setSpeakers] = useState(['Speaker A', 'Speaker B']);
  const [selectedSpeaker, setSelectedSpeaker] = useState('Speaker A');
  const [isInitialized, setIsInitialized] = useState(false);

  const minRegionLength = 1.0;

  const [showSpeedSetting, setShowSpeedSetting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [playingRegion, setPlayingRegion] = useState(null);
  // 구간 스타일 적용 함수 수정
  

  // 마우스 위치 → 시간 변환 함수
  const getTimeFromMouseEvent = (e) => {
    if (!containerRef.current || !wavesurferRef.current) return { time: 0, x: 0, y: 0, globalX: 0, globalY: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const duration = wavesurferRef.current.getDuration?.() || 0;
    const width = rect.width;
    const time = Math.max(0, Math.min(duration, (x / width) * duration));
    return { time, x, y, globalX: e.clientX, globalY: e.clientY };
  };

  // 구간 재생 함수 수정
  const playRegion = useCallback((region) => {
    if (!wavesurferRef.current || !region) {
      console.log('No wavesurfer or region');
      return;
    }
    
    const ws = wavesurferRef.current;
    
    try {
      // 현재 재생 중이면 정지
      if (ws.isPlaying()) {
        console.log('Stopping current playback');
        ws.pause();
        setIsPlaying(false);
        setPlayingRegion(null);
        if (onPlayingChange) onPlayingChange(false);
        return;
      }

      // 재생 전 상태 초기화
      setIsPlaying(false);
      setPlayingRegion(null);
      if (onPlayingChange) onPlayingChange(false);

      // 약간의 지연 후 재생 시작
      setTimeout(() => {
        if (!ws.isPlaying()) {  // 재생 중이 아닐 때만 시작
          console.log('Starting playback');
          ws.play().catch(error => {
            console.error('Playback error:', error);
            setIsPlaying(false);
            setPlayingRegion(null);
            if (onPlayingChange) onPlayingChange(false);
          });
          setIsPlaying(true);
          setPlayingRegion(region.id);
          if (onPlayingChange) onPlayingChange(true);
        }
      }, 100);

    } catch (error) {
      console.error('Error playing region:', error);
      setIsPlaying(false);
      setPlayingRegion(null);
      if (onPlayingChange) onPlayingChange(false);
    }
  }, [onPlayingChange]);

  // 재생/일시정지 함수를 두 번째로 정의
  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current) return;
    
    if (wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
      setIsPlaying(false);
      setPlayingRegion(null);
      if (onPlayingChange) onPlayingChange(false);
    } else {
      // 선택된 구간이 있으면 해당 구간 재생
      if (selectedRegionId && regionsPluginRef.current) {
        const region = regionsPluginRef.current.getRegions().find(r => r.id === selectedRegionId);
        if (region) {
          playRegion(region);
          return;
        }
      }
      
      // 없으면 현재 위치에서 일반 재생
      const currentTime = wavesurferRef.current.getCurrentTime();
      setTimeout(() => {
        wavesurferRef.current.play(currentTime).catch(error => {
          console.error('Playback error:', error);
          setIsPlaying(false);
          if (onPlayingChange) onPlayingChange(false);
        });
        setIsPlaying(true);
        if (onPlayingChange) onPlayingChange(true);
      }, 50);
    }
  }, [selectedRegionId, onPlayingChange, playRegion]);

  // 구간 이동 함수들을 마지막으로 정의
  const handleSkipBackward = useCallback(() => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      const newTime = Math.max(0, current - 10);
      
      // 현재 재생 상태와 구간 정보 저장
      const wasPlaying = wavesurferRef.current.isPlaying();
      const currentRegion = playingRegion ? regionsPluginRef.current?.getRegions().find(r => r.id === playingRegion) : null;
      
      // 재생 중이면 일시 정지
      if (wasPlaying) {
        wavesurferRef.current.pause();
      }
      
      // 새로운 위치로 이동
      wavesurferRef.current.setTime(newTime);
      
      // 재생 중이었다면 새로운 위치에서 재생 시작
      if (wasPlaying) {
        if (currentRegion && newTime >= currentRegion.start && newTime <= currentRegion.end) {
          // 구간 내부로 이동한 경우 해당 위치부터 구간 재생
          wavesurferRef.current.play(newTime);
          setIsPlaying(true);
          if (onPlayingChange) onPlayingChange(true);
        } else {
          // 구간 밖으로 이동한 경우 일반 재생으로 전환
          setPlayingRegion(null);
          wavesurferRef.current.play(newTime);
          setIsPlaying(true);
          if (onPlayingChange) onPlayingChange(true);
        }
      }
    }
  }, [onPlayingChange, playingRegion]);

  const handleSkipForward = useCallback(() => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      const duration = wavesurferRef.current.getDuration();
      const newTime = Math.min(duration, current + 10);
      
      // 현재 재생 상태와 구간 정보 저장
      const wasPlaying = wavesurferRef.current.isPlaying();
      const currentRegion = playingRegion ? regionsPluginRef.current?.getRegions().find(r => r.id === playingRegion) : null;
      
      // 재생 중이면 일시 정지
      if (wasPlaying) {
        wavesurferRef.current.pause();
      }
      
      // 새로운 위치로 이동
      wavesurferRef.current.setTime(newTime);
      
      // 재생 중이었다면 새로운 위치에서 재생 시작
      if (wasPlaying) {
        if (currentRegion && newTime >= currentRegion.start && newTime <= currentRegion.end) {
          // 구간 내부로 이동한 경우 해당 위치부터 구간 재생
          wavesurferRef.current.play(newTime);
          setIsPlaying(true);
          if (onPlayingChange) onPlayingChange(true);
        } else {
          // 구간 밖으로 이동한 경우 일반 재생으로 전환
          setPlayingRegion(null);
          wavesurferRef.current.play(newTime);
          setIsPlaying(true);
          if (onPlayingChange) onPlayingChange(true);
        }
      }
    }
  }, [onPlayingChange, playingRegion]);

  // 드래그 중 마우스 이동
  const handleWindowMouseMove = (e) => {
    const { time, x, y, globalX, globalY } = getTimeFromMouseEvent(e);
    setHover({ time, x, y, globalX, globalY });
  };

  // 드래그 끝
  const handleWindowMouseUp = useCallback((e) => {
    const { time } = getTimeFromMouseEvent(e);
    setIsDragging(false);
    if (dragStart) {
      const start = Math.min(dragStart.time, time);
      const end = Math.max(dragStart.time, time);
      const duration = end - start;
      if (duration < minRegionLength) {
        setDragStart(null);
        return;
      }
      if (wavesurferRef.current && regionsPluginRef.current) {
        try {
          console.log('Creating new region:', { start, end });
          
          // 기존 재생 중지 및 상태 초기화
          if (wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.pause();
          }
          setIsPlaying(false);
          setPlayingRegion(null);
          
          // 기존 선택된 구간의 스타일 초기화
          if (selectedRegionId && regionsPluginRef.current.getRegions) {
            const oldRegion = regionsPluginRef.current.getRegions().find(r => r.id === selectedRegionId);
            if (oldRegion) {
              const style = getRegionStyle(oldRegion.id, speakerRegions[oldRegion.id]);
              oldRegion.setOptions(style);
            }
          }

          // 새로운 구간 생성
          const region = regionsPluginRef.current.addRegion({
            start,
            end,
            drag: true,
            resize: true,
            ...regionStyles.selected, // 생성 시 선택된 스타일 적용
            handleStyle: {
              left: {
                backgroundColor: 'rgba(25, 118, 210, 0.45)',
                width: '4px',
                height: '100%',
                cursor: 'ew-resize'
              },
              right: {
                backgroundColor: 'rgba(25, 118, 210, 0.45)',
                width: '4px',
                height: '100%',
                cursor: 'ew-resize'
              }
            }
          });

          // region 생성 후 minPxPerSec 재설정
          if (wavesurferRef.current && containerRef.current) {
            const duration = wavesurferRef.current.getDuration();
            const width = containerRef.current.offsetWidth;
            const pxPerSec = duration > 0 ? width / duration : 0.5;
            wavesurferRef.current.setOptions({ minPxPerSec: pxPerSec });
          }

          // 구간 클릭 이벤트 핸들러
          region.on('click', (e) => {
            e.stopPropagation();
            
            // 기존 선택된 구간의 스타일 초기화
            if (selectedRegionId && regionsPluginRef.current) {
              const oldRegion = regionsPluginRef.current.getRegions().find(r => r.id === selectedRegionId);
              if (oldRegion) {
                const style = getRegionStyle(oldRegion.id, speakerRegions[oldRegion.id]);
                oldRegion.setOptions(style);
              }
            }
            
            // 새로 선택된 구간의 스타일 적용
            const style = getRegionStyle(region.id, speakerRegions[region.id]);
            region.setOptions(style);
            
            setSelectedRegionId(region.id);

            // 클릭 시 즉시 커서 이동
            if (wavesurferRef.current) {
              wavesurferRef.current.setTime(region.start);
            }
            
            // 재생
            playRegion(region);
          });

          // 구간 삭제 이벤트 핸들러
          region.on('remove', () => {
            if (selectedRegionId === region.id) {
              setSelectedRegionId(null);
            }
            if (playingRegion === region.id) {
              setPlayingRegion(null);
              if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
                wavesurferRef.current.pause();
              }
            }
            // region 삭제 후 minPxPerSec 재설정
            if (wavesurferRef.current && containerRef.current) {
              const duration = wavesurferRef.current.getDuration();
              const width = containerRef.current.offsetWidth;
              const pxPerSec = duration > 0 ? width / duration : 0.5;
              wavesurferRef.current.setOptions({ minPxPerSec: pxPerSec });
            }
          });

          // 새 구간 선택
          setSelectedRegionId(region.id);
          
          // 재생 위치를 구간 시작점으로 이동
          wavesurferRef.current.setTime(start);
          
          // 약간의 지연 후 재생 시작
          setTimeout(() => {
            if (wavesurferRef.current && !wavesurferRef.current.isPlaying()) {
              playRegion(region);
            }
          }, 100);

        } catch (err) {
          console.error('Error creating region:', err);
        }
      }
    }
    setDragStart(null);
  }, [dragStart, getTimeFromMouseEvent, minRegionLength, playRegion, selectedRegionId, playingRegion, speakerRegions]);

  // 드래그 중 이벤트 등록/해제
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }
  }, [isDragging]);

  // 드래그 시작
  const handleMouseDown = (e) => {
    const { time, x, y, globalX, globalY } = getTimeFromMouseEvent(e);
    setDragStart({ time, x, y, globalX, globalY });
    setIsDragging(true);
    setHover({ time, x, y, globalX, globalY });
  };

  // 일반 마우스 이동
  const handleMouseMove = (e) => {
    if (!isDragging) {
      const { time, x, y, globalX, globalY } = getTimeFromMouseEvent(e);
      setHover({ time, x, y, globalX, globalY });
    }
  };

  // 마우스가 파형 밖으로 나갈 때
  const handleMouseLeave = () => {
    setHover(null);
    setDragStart(null);
    setIsDragging(false);
  };

  // 팝업/드래그 박스: 오디오가 있을 때만 렌더링
  let popup = null;
  let dragBox = null;
  if (!showGuide) {
    if (isDragging && dragStart && hover) {
      const t1 = dragStart.time;
      const t2 = hover.time;
      popup = (
        <div style={{
          position: 'fixed',
          left: hover.globalX,
          top: hover.globalY + 10,
          background: '#222',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 7,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 20,
          pointerEvents: 'none',
          transform: 'translate(-50%, 0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 12, color: '#b3e5fc' }}>
            {formatTimeFull(Math.min(t1, t2))} ~ {formatTimeFull(Math.max(t1, t2))}
          </span>
        </div>
      );
    } else if (hover) {
      popup = (
        <div style={{
          position: 'fixed',
          left: hover.globalX,
          top: hover.globalY + 10,
          background: '#222',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 7,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 20,
          pointerEvents: 'none',
          transform: 'translate(-50%, 0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 12, color: '#b3e5fc' }}>
            {formatTimeFull(hover.time)}
          </span>
        </div>
      );
    }
    // 드래그 중 영역 표시
    if (isDragging && dragStart && hover) {
      const left = Math.min(dragStart.x, hover.x);
      const width = Math.abs(dragStart.x - hover.x);
      dragBox = (
        <div style={{
          position: 'absolute',
          left,
          top: 0,
          width,
          height: WAVEFORM_HEIGHT,
          background: 'rgba(120, 120, 120, 0.08)',
          border: '1.5px solid #1976d2',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 10,
        }} />
      );
    }
  }

  // 재생 위치 모니터링
  useEffect(() => {
    if (!wavesurferRef.current || !playingRegion || !regionsPluginRef.current) return;

    const ws = wavesurferRef.current;
    const region = regionsPluginRef.current.getRegions().find(r => r.id === playingRegion);
    
    if (!region) {
      console.log('No region found for playback monitoring');
      setPlayingRegion(null);
      return;
    }

    console.log('Setting up playback monitoring for region:', region.id);
    const checkTime = () => {
      if (!ws.isPlaying()) return; // 재생 중이 아니면 체크하지 않음
      
      const currentTime = ws.getCurrentTime();
      if (currentTime >= region.end) {
        console.log('Reached region end, stopping playback');
        ws.pause();
        ws.setTime(region.start); // 구간 끝에서 다시 시작 위치로 이동
        setIsPlaying(false);
        if (onPlayingChange) onPlayingChange(false);
      }
    };

    const intervalId = setInterval(checkTime, 10); // 더 정확한 체크를 위해 간격 줄임
    
    return () => {
      clearInterval(intervalId);
    };
  }, [playingRegion, onPlayingChange]);

  // 구간 선택 해제
  const handleContainerClick = (e) => {
    if (!e.target.classList.contains('wavesurfer-region')) {
      e.preventDefault();
      e.stopPropagation();
      
      setSelectedRegionId(null);
      setPlayingRegion(null);
      setHighlightedSpeaker(null); // 구간 선택 해제 시 하이라이트도 해제
      
      if (regionsPluginRef.current) {
        regionsPluginRef.current.getRegions().forEach(region => {
          const style = getRegionStyle(region.id, speakerRegions[region.id]);
          region.setOptions(style);
        });
      }
      
      if (wavesurferRef.current) {
        const { time } = getTimeFromMouseEvent(e);
        wavesurferRef.current.setTime(time);
        
        if (wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
          setIsPlaying(false);
          if (onPlayingChange) onPlayingChange(false);
        }
      }
    }
    
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  // 구간 클릭 핸들러
  useEffect(() => {
    if (!wavesurferRef.current || !regionsPluginRef.current) return;
    
    const handleRegionClick = (region, e) => {
      e.stopPropagation();
      setSelectedRegionId(region.id);
      playRegion(region);
    };
    
    regionsPluginRef.current.on('region-click', handleRegionClick);
    return () => {
      if (regionsPluginRef.current) {
        regionsPluginRef.current.un('region-click', handleRegionClick);
      }
    };
  }, [playRegion]);

  // 구간 색상 업데이트
  useEffect(() => {
    if (!regionsPluginRef.current) return;
    
    regionsPluginRef.current.getRegions().forEach(r => {
      const style = getRegionStyle(r.id, speakerRegions[r.id]);
      r.setOptions(style);
    });
  }, [selectedRegionId, speakerRegions]);

  useEffect(() => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.on('*', (...args) => {
        console.log('RegionsPlugin event:', ...args);
      });
    }
  }, []);

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate);
    }
  };

  const buttonStyle = {
    padding: '8px 18px',
    borderRadius: 6,
    border: '1.5px solid #1976d2',
    background: '#fff',
    color: '#1976d2',
    fontWeight: 700,
    fontSize: 18,
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'all 0.15s',
  };

  // 재생 위치 표시 및 재생바 위치 계산
  const duration = wavesurferRef.current?.getDuration?.() || 1;
  const leftPercent = (isFinite(currentTime) && isFinite(duration) && duration > 0)
    ? (currentTime / duration) * 100
    : 0;

  // 재생 상태가 바뀔 때 상위에 알림 (외부에서 재생/일시정지될 수도 있으므로)
  useEffect(() => {
    if (!wavesurferRef.current) return;
    const ws = wavesurferRef.current;
    const onPlay = () => { setIsPlaying(true); if (onPlayingChange) onPlayingChange(true); };
    const onPause = () => { setIsPlaying(false); if (onPlayingChange) onPlayingChange(false); };
    ws.on('play', onPlay);
    ws.on('pause', onPause);
    return () => {
      ws.un('play', onPlay);
      ws.un('pause', onPause);
    };
  }, [onPlayingChange]);

  useEffect(() => {
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.setTime(0);
      } catch (e) {}
    }
  }, [audioUrl]);

  // 화자 선택 핸들러
  const handleSpeakerSelect = (speaker) => {
    if (selectedRegionId && regionsPluginRef.current) {
      // 구간이 선택된 상태면 해당 구간의 화자 지정
      const region = regionsPluginRef.current.getRegions().find(r => r.id === selectedRegionId);
      if (region) {
        setSpeakerRegions(prev => ({
          ...prev,
          [selectedRegionId]: speaker
        }));
        
        const style = getRegionStyle(selectedRegionId, speaker);
        region.setOptions(style);
      }
    }

    // 선택된 화자 상태 업데이트
    if (highlightedSpeaker === speaker) {
      setHighlightedSpeaker(null); // 같은 화자를 다시 클릭하면 하이라이트 해제
    } else {
      setHighlightedSpeaker(speaker); // 다른 화자를 클릭하면 하이라이트
      setSelectedSpeaker(speaker);
    }

    // 모든 구간의 스타일 업데이트
    if (regionsPluginRef.current) {
      regionsPluginRef.current.getRegions().forEach(r => {
        const regionSpeaker = speakerRegions[r.id];
        const isHighlighted = regionSpeaker === speaker;
        r.setOptions({
          ...getRegionStyle(r.id, regionSpeaker),
          opacity: isHighlighted || !speaker ? 1 : 0.3
        });
      });
    }
  };

  // 구간 삭제 시 화자 정보도 함께 삭제
  useEffect(() => {
    if (regionsPluginRef.current) {
      const handleRegionRemoved = (region) => {
        setSpeakerRegions(prev => {
          const newSpeakerRegions = { ...prev };
          delete newSpeakerRegions[region.id];
          return newSpeakerRegions;
        });
      };
      regionsPluginRef.current.on('region-removed', handleRegionRemoved);
      return () => {
        if (regionsPluginRef.current) {
          regionsPluginRef.current.un('region-removed', handleRegionRemoved);
        }
      };
    }
  }, []);

  // 레이블링 데이터 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (!regionsPluginRef.current || !onLabelsChange || !isInitialized) return;

    const regions = regionsPluginRef.current.getRegions();
    const labelData = {
      speakers,
      regions: regions.map(region => ({
        id: region.id,
        start: region.start,
        end: region.end,
        speaker: speakerRegions[region.id] || null
      }))
    };

    // 이전 데이터와 비교하여 실제 변경이 있을 때만 콜백 호출
    const labelDataString = JSON.stringify(labelData);
    if (labelDataString !== lastLabelDataRef.current) {
      lastLabelDataRef.current = labelDataString;
      onLabelsChange(labelData);
    }
  }, [speakers, speakerRegions, onLabelsChange, isInitialized]);

  // 이전 레이블 데이터를 저장하기 위한 ref
  const lastLabelDataRef = useRef('');

  // 컴포넌트 마운트 시 초기화 완료 표시
  useEffect(() => {
    setIsInitialized(true);
    return () => setIsInitialized(false);
  }, []);

  // 화자 추가/삭제/선택/강조 핸들러
  const handleAddSpeaker = () => {
    const nextChar = String.fromCharCode(65 + speakers.length);
    setSpeakers([...speakers, `Speaker ${nextChar}`]);
  };
  const handleDeleteSpeaker = () => {
    if (speakers.length > 2) {
      const removedSpeaker = speakers[speakers.length - 1];
      setSpeakers(speakers.slice(0, -1));
      if (selectedSpeaker === removedSpeaker) setSelectedSpeaker(speakers[0]);
      if (highlightedSpeaker === removedSpeaker) setHighlightedSpeaker(null);
      if (regionsPluginRef.current) {
        const updatedSpeakerRegions = { ...speakerRegions };
        let hasUpdates = false;
        regionsPluginRef.current.getRegions().forEach(region => {
          if (speakerRegions[region.id] === removedSpeaker) {
            delete updatedSpeakerRegions[region.id];
            hasUpdates = true;
            const style = getRegionStyle(region.id, null);
            region.setOptions(style);
          }
        });
        if (hasUpdates) setSpeakerRegions(updatedSpeakerRegions);
      }
    }
  };
  const handleSelectSpeaker = (spk) => {
    handleSpeakerSelect(spk);
  };
  const handleHighlightSpeaker = (spk) => {
    setHighlightedSpeaker(spk);
  };

  // wavesurfer ready 이벤트에서 한 화면에 전체 파형이 보이도록 minPxPerSec를 동적으로 계산해 적용
  useEffect(() => {
    if (!wavesurferRef.current || !containerRef.current) return;
    const ws = wavesurferRef.current;
    const onReady = () => {
      const duration = ws.getDuration();
      const width = containerRef.current.offsetWidth;
      const pxPerSec = duration > 0 ? width / duration : 0.5;
      ws.setOptions({ minPxPerSec: pxPerSec });
    };
    ws.on('ready', onReady);
    return () => {
      ws.un('ready', onReady);
    };
  }, [wavesurferRef.current, containerRef.current]);

  const [showRegionList, setShowRegionList] = useState(false);

  const handleHideSpeaker = useCallback(() => {
    setHiddenSpeakers(prev => {
      const next = new Set(prev);
      if (selectedSpeaker && next.has(selectedSpeaker)) {
        next.delete(selectedSpeaker);
      } else if (selectedSpeaker) {
        next.add(selectedSpeaker);
      }
      return next;
    });
  }, [selectedSpeaker]);

  // HIDE된 화자의 region을 완전히 숨김 처리
  useEffect(() => {
    if (!regionsPluginRef.current) return;
    regionsPluginRef.current.getRegions().forEach(region => {
      const speaker = speakerRegions[region.id];
      if (region.element) {
        if (speaker && hiddenSpeakers.has(speaker)) {
          region.element.style.display = 'none';
        } else {
          region.element.style.display = '';
        }
      }
    });
  }, [hiddenSpeakers, speakerRegions]);

  useEffect(() => {
    setIsLoading(true);
  }, [audioUrl]);

  return (
    <>
      {/* 상단 화자 선택 버튼 */}
      <SpeakerManager
        speakers={speakers}
        selectedSpeaker={selectedSpeaker}
        highlightedSpeaker={highlightedSpeaker}
        onSelect={handleSelectSpeaker}
        onHighlight={handleHighlightSpeaker}
        onAdd={handleAddSpeaker}
        onDelete={handleDeleteSpeaker}
        minSpeakers={2}
        speakerColors={speakerColors}
        defaultSpeakerColor={defaultSpeakerColor}
        showGuide={showGuide}
        onShowRegionList={() => setShowRegionList(true)}
        onHide={handleHideSpeaker}
      />
      {/* RegionList 모달 */}
      {showRegionList && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setShowRegionList(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              minWidth: 380,
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <RegionList
              hideTitle={true}
              regions={regionsPluginRef.current ? regionsPluginRef.current.getRegions().map(r => ({
                id: r.id,
                start: r.start,
                end: r.end,
                speaker: speakerRegions[r.id] || null
              })) : []}
              selectedRegionId={selectedRegionId}
              onSelect={id => {
                setSelectedRegionId(id);
                if (regionsPluginRef.current) {
                  const region = regionsPluginRef.current.getRegions().find(r => r.id === id);
                  if (region) {
                    wavesurferRef.current && wavesurferRef.current.setTime(region.start);
                    playRegion(region);
                  }
                }
              }}
              onDelete={id => {
                if (regionsPluginRef.current) {
                  const region = regionsPluginRef.current.getRegions().find(r => r.id === id);
                  if (region) {
                    region.remove();
                  }
                }
              }}
              onEditSave={(id, start, end) => {
                if (regionsPluginRef.current) {
                  const region = regionsPluginRef.current.getRegions().find(r => r.id === id);
                  if (region) {
                    region.setOptions({ start, end });
                  }
                }
              }}
              speakerColors={speakerColors}
              defaultSpeakerColor={defaultSpeakerColor}
              onClose={() => setShowRegionList(false)}
            />
          </div>
        </div>
      )}
      {/* 경계선 */}
      <div style={{
        width: '100%',
        height: 1,
        background: '#e0e0e0',
        margin: '0 0 18px 0'
      }} />
      {/* 파형 컨테이너 래퍼 */}
      <div style={{
        width: '100%',
        height: WAVEFORM_HEIGHT,
        position: 'relative',
        background: '#f8f9fa',
        borderRadius: 4,
      }}>
        {/* 로딩 또는 가이드 메시지 */}
        {(isLoading || showGuide) && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            fontSize: 18,
            color: '#1976d2',
            fontWeight: 600,
          }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.8 }}>
                <LoadingIcon width={28} height={28} />
              </div>
            ) : (
              'Please upload audio file first'
            )}
          </div>
        )}
        {/* 실제 파형 컨테이너: 항상 렌더링 */}
        <div
          ref={containerRef}
          tabIndex={0}
          className="waveform-container"
          onClick={handleContainerClick}
          onKeyDown={(e) => {
            console.log('Any key pressed:', e.key, e.target);
            // 디버깅을 위한 상태 출력
            console.log('Current selectedRegionId:', selectedRegionId);
            const regions = regionsPluginRef.current?.getRegions();
            console.log('Available regions:', regions);
            
            if (
              (e.key === 'Delete' || e.key === 'Backspace') &&
              selectedRegionId &&
              regionsPluginRef.current
            ) {
              e.preventDefault();
              console.log('Trying to remove region:', selectedRegionId);
              // v7 방식으로 region 삭제
              try {
                const regionToRemove = regions.find(r => r.id === selectedRegionId);
                if (regionToRemove) {
                  console.log('Found region to remove:', regionToRemove);
                  regionToRemove.remove();
                  console.log('Region removal attempted');
                }
              } catch (error) {
                console.error('Error removing region:', error);
              }
              setSelectedRegionId(null);
              setTimeout(() => {
                console.log('After remove:', regionsPluginRef.current.getRegions());
              }, 200);
            }

            // ▶️ 스페이스: 재생/일시정지
            if (e.key === ' ' || e.key === 'Spacebar') {
              e.preventDefault();
              handlePlayPause();
              return;
            }

            // ▶️ 오른쪽 화살표: 앞으로 가기
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleSkipForward();
              return;
            }

            // ▶️ 왼쪽 화살표: 뒤로 가기
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handleSkipBackward();
              return;
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'visible',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease',
            background: showGuide ? '#fafbfc' : 'transparent',
          }}
        >
          {dragBox}
          {popup}
          {/* 커스텀 재생 커서 오버레이 */}
          {(audioUrl && duration > 0 && isFinite(currentTime) && !showGuide && !isLoading) && (
            <>
              {/* 세로선 */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${leftPercent}%`,
                  width: 2,
                  height: '100%',
                  background: '#111',
                  zIndex: 15,
                  transform: 'translateX(-1px)',
                  pointerEvents: 'none',
                }}
              />
              {/* 역삼각형 (SVG, 흰색 내부 + 검정 테두리, 작은 크기) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: -9, // 삼각형 높이에 맞게 조정
                  width: 12,
                  height: 8,
                  zIndex: 16,
                  transform: 'translateX(-6px)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="8">
                  <polygon
                    points="6,7 2,2 10,2"
                    fill="#fff"
                    stroke="#111"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>
      {/* 오디오 컨트롤 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 8,
      }}>
        {/* 왼쪽: 설정 버튼 */}
        <div style={{ position: 'relative', marginRight: 16 }}>
          <button
            onClick={() => setShowSpeedSetting((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: (!showGuide && wavesurferRef.current) ? 'pointer' : 'not-allowed',
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!showGuide && wavesurferRef.current) ? 1 : 0.5,
            }}
            aria-label="설정"
            disabled={showGuide || !wavesurferRef.current}
          >
            <SettingIcon width={22} height={22} />
          </button>
          {showSpeedSetting && !showGuide && wavesurferRef.current && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '110%',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                padding: 10,
                zIndex: 100,
                minWidth: 140,
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                Playback speed
                <span style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1.2px solid #bbb',
                  fontSize: 11,
                  textAlign: 'center',
                  lineHeight: '13px',
                  color: '#888',
                  marginLeft: 2,
                }}>i</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={playbackRate}
                  onChange={e => handlePlaybackRateChange(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <div style={{
                  minWidth: 28,
                  textAlign: 'right',
                  fontWeight: 600,
                  fontSize: 13,
                  border: '1px solid #eee',
                  borderRadius: 4,
                  padding: '1px 4px',
                  background: '#fafbfc',
                  marginLeft: 2,
                }}>
                  {playbackRate.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* 가운데: 오디오 컨트롤 버튼들 */}
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => {
              if (!showGuide && wavesurferRef.current) {
                handleSkipBackward();
                if (containerRef.current) containerRef.current.focus();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: (!showGuide && wavesurferRef.current) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!showGuide && wavesurferRef.current) ? 1 : 0.5,
            }}
            aria-label="뒤로 10초"
            disabled={showGuide || !wavesurferRef.current}
          >
            <RewindIcon width={18} height={18} />
          </button>
          <button
            onClick={() => {
              if (!showGuide && wavesurferRef.current) {
                handlePlayPause();
                if (containerRef.current) containerRef.current.focus();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: (!showGuide && wavesurferRef.current) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!showGuide && wavesurferRef.current) ? 1 : 0.5,
            }}
            aria-label="재생/일시정지"
            disabled={showGuide || !wavesurferRef.current}
          >
            {isPlaying ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
          </button>
          <button
            onClick={() => {
              if (!showGuide && wavesurferRef.current) {
                handleSkipForward();
                if (containerRef.current) containerRef.current.focus();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: (!showGuide && wavesurferRef.current) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!showGuide && wavesurferRef.current) ? 1 : 0.5,
            }}
            aria-label="앞으로 10초"
            disabled={showGuide || !wavesurferRef.current}
          >
            <ForwardIcon width={18} height={18} />
          </button>
        </div>
        {/* 오른쪽: 현재 재생 위치 표시 */}
        <div style={{ 
          minWidth: 110, 
          textAlign: 'right', 
          fontFamily: 'monospace', 
          fontSize: 15, 
          color: '#8a8a8a', 
          fontWeight: 500,
          opacity: (!showGuide && wavesurferRef.current) ? 1 : 0.5,
        }}>
          {(!showGuide && wavesurferRef.current)
            ? (isFinite(currentTime) && !isNaN(currentTime)
                ? formatTimeFull(currentTime)
                : '00:00:00.000')
            : '00:00:00.000'}
        </div>
      </div>
    </>
  );
}
