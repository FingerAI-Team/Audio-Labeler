"use client";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import RewindIcon from './icons/backward.svg';
import PlayIcon from './icons/play.svg';
import ForwardIcon from './icons/forward.svg';
import PauseIcon from './icons/pause.svg';
import SettingIcon from './icons/setting.svg';

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

function formatTimeFull(t) {
  const hours = String(Math.floor(t / 3600)).padStart(2, '0');
  const min = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(t % 60)).padStart(2, '0');
  const ms = String(Math.floor((t % 1) * 1000)).padStart(3, '0');
  return `${hours}:${min}:${sec}.${ms}`;
}

const WAVEFORM_HEIGHT = 100; // 원하는 값으로 한 번에 관리

export default function WaveformLabeler({ audioUrl, audioFile, showSample, showGuide, onPlayingChange, fileInputRef }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [minPxPerSec, setMinPxPerSec] = useState(2); // 동적 minPxPerSec

  // 화자 관련 상태
  const [speakers, setSpeakers] = useState(['Speaker A', 'Speaker B']);
  const [selectedSpeaker, setSelectedSpeaker] = useState('Speaker A');

  const minRegionLength = 1.0;

  const [selectedRegionId, setSelectedRegionId] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);

  const [showSpeedSetting, setShowSpeedSetting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 설명 상태 (상위에서 prop으로 받지 않는 경우 내부에서 관리)
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);

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

  // WaveSurfer 초기화
  useEffect(() => {
    let isMounted = true; // 이 인스턴스가 유효한지 추적
    setIsLoading(true);
    if (!containerRef.current) return;
    if (wavesurferRef.current) {
      try { wavesurferRef.current.destroy(); } catch (e) {}
      wavesurferRef.current = null;
    }

    // minPxPerSec은 최초에는 2로, 오디오 ready 후 동적으로 재설정
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#b0b7c3",
      progressColor: "#b0b7c3",
      height: WAVEFORM_HEIGHT,
      minPxPerSec,
      scrollParent: false,
    });
    const regionsPlugin = RegionsPlugin.create({
      dragSelection: false,
    });
    ws.registerPlugin(regionsPlugin);
    regionsPluginRef.current = regionsPlugin;

    // 오디오 소스 결정
    const url = showSample ? "/sample.wav" : audioUrl;
    if (url) {
      ws.load(url);
    }
    wavesurferRef.current = ws;

    // ready 이벤트 핸들러
    const handleReady = () => {
      // 이 인스턴스가 여전히 유효할 때만 로딩 해제
      if (isMounted && wavesurferRef.current === ws) {
        setIsLoading(false);
      }
      const duration = ws.getDuration();
      const width = containerRef.current?.offsetWidth || 800;
      let pxPerSec = Math.max(0.05, width / duration);
      if (!isFinite(pxPerSec) || pxPerSec > 10) pxPerSec = 2;
      setMinPxPerSec(pxPerSec);
    };
    ws.once('ready', handleReady);

    // WaveSurfer 초기화 후, 재생 위치 업데이트 이벤트 등록
    const onTimeUpdate = () => setCurrentTime(ws.getCurrentTime());
    ws.on('timeupdate', onTimeUpdate);

    return () => {
      isMounted = false; // cleanup 시 이 인스턴스는 더 이상 유효하지 않음
      try { ws.un('ready', handleReady); } catch (e) {}
      try { ws.un('timeupdate', onTimeUpdate); } catch (e) {}
      try { ws.destroy(); } catch (e) {}
      if (wavesurferRef.current === ws) {
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, showSample, minPxPerSec]);

  // 드래그 중 마우스 이동
  const handleWindowMouseMove = (e) => {
    const { time, x, y, globalX, globalY } = getTimeFromMouseEvent(e);
    setHover({ time, x, y, globalX, globalY });
  };

  // 드래그 끝
  const handleWindowMouseUp = (e) => {
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
          const region = regionsPluginRef.current.addRegion({
            start,
            end,
            drag: true,
            resize: true,
            color: 'rgba(120, 120, 120, 0.18)',
            interactive: true,
          });
          region.on('click', (e) => {
            e.stopPropagation();
            console.log('Region clicked (direct):', region.id, region);
            setSelectedRegionId(region.id);
          });
          // region 삭제 이벤트 직접 등록 (중복 방지 위해 항상 추가)
          region.on('remove', () => {
            console.log('Region removed (direct on region):', region.id);
            setSelectedRegionId(null);
          });
          console.log('Region created:', region);
          Object.keys(region.listeners).forEach(eventName => {
            region.on(eventName, (...args) => {
              console.log('Region event:', eventName, ...args);
            });
          });
        } catch (err) {
          // ignore
        }
      }
    }
    setDragStart(null);
  };

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

  // region 클릭 시 선택 상태 관리 및 색상 변경
  useEffect(() => {
    if (!wavesurferRef.current || !regionsPluginRef.current) return;
    const regionsPlugin = regionsPluginRef.current;
    const handleRegionClick = (region, e) => {
      e.stopPropagation();
      setSelectedRegionId(region.id);
      // region 클릭 시 파형 컨테이너에 포커스 주기
      if (containerRef.current) {
        containerRef.current.focus();
      }
    };
    regionsPlugin.on('region-click', handleRegionClick);
    return () => {
      regionsPlugin.un('region-click', handleRegionClick);
    };
  }, []);

  useEffect(() => {
    if (!regionsPluginRef.current) return;
    console.log('Selected region:', selectedRegionId, regionsPluginRef.current.regions);
    Object.values(regionsPluginRef.current.regions).forEach(r => {
      r.setOptions({
        color: r.id === selectedRegionId
          ? 'rgba(25, 118, 210, 0.25)'
          : 'rgba(120, 120, 120, 0.18)'
      });
    });
  }, [selectedRegionId, regionsPluginRef.current && Object.keys(regionsPluginRef.current.regions).length]);

  useEffect(() => {
    if (!regionsPluginRef.current) return;
    const onRegionRemoved = (region) => {
      console.log('Region removed:', region.id);
      setSelectedRegionId(null);
    };
    regionsPluginRef.current.on('region-removed', onRegionRemoved);
    return () => {
      regionsPluginRef.current.un('region-removed', onRegionRemoved);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedRegionId &&
        regionsPluginRef.current &&
        regionsPluginRef.current.regions[selectedRegionId]
      ) {
        e.preventDefault();
        console.log('Trying to remove region:', selectedRegionId);
        // v7 방식으로 region 삭제
        regionsPluginRef.current.removeRegion(selectedRegionId);
        setSelectedRegionId(null);
        setTimeout(() => {
          console.log('After remove:', regionsPluginRef.current.regions);
        }, 200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRegionId]);

  useEffect(() => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.on('*', (...args) => {
        console.log('RegionsPlugin event:', ...args);
      });
    }
  }, []);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      if (wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
        if (onPlayingChange) onPlayingChange(false);
      } else {
        wavesurferRef.current.play().catch(() => {});
        setIsPlaying(true);
        if (onPlayingChange) onPlayingChange(true);
      }
    }
  };

  const handleSkipBackward = () => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      wavesurferRef.current.setTime(Math.max(0, current - 10));
    }
  };

  const handleSkipForward = () => {
    if (wavesurferRef.current) {
      const current = wavesurferRef.current.getCurrentTime();
      const duration = wavesurferRef.current.getDuration();
      wavesurferRef.current.setTime(Math.min(duration, current + 10));
    }
  };

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

  const duration = wavesurferRef.current?.getDuration?.() || 1;
  const leftPercent = (currentTime / duration) * 100;

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

  return (
    <>
      {/* 상단 화자 선택 및 추가/삭제 버튼 */}
      <div style={{
        marginBottom: 32,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        {/* 버튼 그룹 */}
        <div style={{
          flexGrow: 1,
          flexBasis: 0,
          maxWidth: 'calc(100% - 120px)',
          height: 75,
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignContent: 'flex-start',
          borderRight: '1px solid #e0e0e0',
          paddingRight: 12,
          boxSizing: 'border-box',
        }}>
          {speakers.map((spk, idx) => (
            <label
              key={spk}
              style={{
                background: selectedSpeaker === spk ? '#1976d2' : '#e3e7ef',
                color: selectedSpeaker === spk ? '#fff' : '#222',
                borderRadius: 4,
                padding: '4px 10px',
                fontWeight: 700,
                fontSize: 13,
                minWidth: 60,
                border: selectedSpeaker === spk ? '1.5px solid #1976d2' : '1.2px solid #b0b7c3',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s',
                textAlign: 'center',
                marginBottom: 2,
              }}
            >
              <input
                type="radio"
                name="speaker"
                value={spk}
                checked={selectedSpeaker === spk}
                onChange={() => setSelectedSpeaker(spk)}
                style={{ display: 'none' }}
              />
              {spk}
            </label>
          ))}
        </div>
        {/* 조작 버튼: 한 행(가로)로 배치 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 4, minWidth: 190, paddingLeft: 12 }}>
          <button
            style={{
              padding: '3px 0',
              borderRadius: 4,
              border: '1.2px solid #1976d2',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              height: 28,
              minWidth: 60,
            }}
            onClick={() => {
              const nextChar = String.fromCharCode(65 + speakers.length);
              setSpeakers([...speakers, `Speaker ${nextChar}`]);
            }}
          >Add</button>
          <button
            style={{
              padding: '3px 0',
              borderRadius: 4,
              border: '1.2px solid #b0b7c3',
              background: '#e3e7ef',
              color: '#222',
              fontWeight: 700,
              fontSize: 12,
              cursor: speakers.length > 2 ? 'pointer' : 'not-allowed',
              height: 28,
              minWidth: 60,
            }}
            onClick={() => {
              if (speakers.length > 2) {
                setSpeakers(speakers.slice(0, -1));
                if (selectedSpeaker === speakers[speakers.length - 1]) {
                  setSelectedSpeaker(speakers[0]);
                }
              }
            }}
            disabled={speakers.length <= 2}
          >Delete</button>
          <button
            style={{
              padding: '3px 0',
              borderRadius: 4,
              border: '1.2px solid #b0b7c3',
              background: '#fff',
              color: '#1976d2',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              height: 28,
              minWidth: 60,
            }}
            onClick={() => { /* TODO: Hide 동작 구현 */ }}
          >Hide</button>
        </div>
      </div>
      {/* 경계선 */}
      <div style={{
        width: '100%',
        height: 1,
        background: '#e0e0e0',
        margin: '0 0 18px 0'
      }} />
      {/* 파형 및 오디오 컨트롤 영역 (기존 코드 유지) */}
      <div
        ref={containerRef}
        tabIndex={0}
        className="waveform-container"
        onClick={() => containerRef.current && containerRef.current.focus()}
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
          height: WAVEFORM_HEIGHT,
          cursor: 'pointer',
          position: 'relative',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading && (
          <div style={{
            position: 'absolute',
            left: 0, top: 0, width: '100%', height: '100%',
            background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
            fontSize: 18, color: '#1976d2', fontWeight: 600,
            pointerEvents: 'none'
          }}>
            Loading...
          </div>
        )}
        {showGuide && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: 18,
            zIndex: 30,
            background: 'rgba(248,249,250,0.92)',
            pointerEvents: 'none',
            fontWeight: 500,
          }}>
            Please upload audio file first
          </div>
        )}
        {/* 커스텀 재생 커서 오버레이 */}
        {duration > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${leftPercent}%`,
              width: 3,
              height: '100%',
              background: '#222',
              zIndex: 20,
              borderRadius: 2,
              pointerEvents: 'none',
              transform: 'translateX(-50%)',
              display: 'block',
            }}
          >
            {/* 위쪽 역삼각형 SVG 도형 */}
            <svg
              width="14" height="8" viewBox="0 0 14 8"
              style={{
                position: 'absolute',
                top: -8, // 세로선과 딱 붙게
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                display: 'block',
              }}
            >
              <polygon
                points="7,7 1,1 13,1"
                fill="transparent"
                stroke="#222"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
        {dragBox}
        {popup}
      </div>
      {/* 오디오 컨트롤 영역 (기존 코드 유지) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        {/* 왼쪽: 설정 버튼 */}
        <div style={{ position: 'relative', marginRight: 16 }}>
          <button
            onClick={() => setShowSpeedSetting((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="설정"
          >
            <SettingIcon width={22} height={22} />
          </button>
          {showSpeedSetting && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '110%', // 버튼 바로 아래에 뜨도록
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
            onClick={showGuide ? undefined : () => {
              handleSkipBackward();
              if (containerRef.current) containerRef.current.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: showGuide ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showGuide ? 0.5 : 1,
            }}
            aria-label="뒤로 10초"
            disabled={showGuide}
          >
            <RewindIcon width={18} height={18} />
          </button>
          <button
            onClick={showGuide ? undefined : () => {
              handlePlayPause();
              if (containerRef.current) containerRef.current.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: showGuide ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showGuide ? 0.5 : 1,
            }}
            aria-label="재생/일시정지"
            disabled={showGuide}
          >
            {isPlaying ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
          </button>
          <button
            onClick={showGuide ? undefined : () => {
              handleSkipForward();
              if (containerRef.current) containerRef.current.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
              cursor: showGuide ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showGuide ? 0.5 : 1,
            }}
            aria-label="앞으로 10초"
            disabled={showGuide}
          >
            <ForwardIcon width={18} height={18} />
          </button>
        </div>
        {/* 오른쪽: 현재 재생 위치 표시 */}
        <div style={{ minWidth: 110, textAlign: 'right', fontFamily: 'monospace', fontSize: 15, color: '#8a8a8a', fontWeight: 500 }}>
          {showGuide ? '00:00:00.000' : formatTimeFull(currentTime)}
        </div>
      </div>
    </>
  );
}
