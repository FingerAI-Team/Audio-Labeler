"use client";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from 'wavesurfer.js/plugins/regions';

function formatTimeFull(t) {
  const hours = String(Math.floor(t / 3600)).padStart(2, '0');
  const min = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(t % 60)).padStart(2, '0');
  const ms = String(Math.floor((t % 1) * 1000)).padStart(3, '0');
  return `${hours}:${min}:${sec}.${ms}`;
}

export default function WaveformLabeler() {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 화자 관련 상태
  const [speakers, setSpeakers] = useState(['Speaker A', 'Speaker B']);
  const [selectedSpeaker, setSelectedSpeaker] = useState('Speaker A');

  const minRegionLength = 1.0;

  const [selectedRegionId, setSelectedRegionId] = useState(null);

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
    if (!containerRef.current) return;
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#b0b7c3",
      progressColor: "#b0b7c3",
      height: 120,
    });
    const regionsPlugin = RegionsPlugin.create({
      dragSelection: false,
    });
    ws.registerPlugin(regionsPlugin);
    regionsPluginRef.current = regionsPlugin;
    ws.load("/sample.wav");
    wavesurferRef.current = ws;
    return () => ws.destroy();
  }, []);

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

  // 팝업 렌더링
  let popup = null;
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
  let dragBox = null;
  if (isDragging && dragStart && hover) {
    const left = Math.min(dragStart.x, hover.x);
    const width = Math.abs(dragStart.x - hover.x);
    dragBox = (
      <div style={{
        position: 'absolute',
        left,
        top: 0,
        width,
        height: 120,
        background: 'rgba(120, 120, 120, 0.08)',
        border: '1.5px solid #1976d2',
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 10,
      }} />
    );
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

  return (
    <div style={{ background: "#fafbfc", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24, position: 'relative' }}>
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
      {/* 파형 컨테이너 */}
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
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: 120,
          cursor: 'pointer',
          position: 'relative',
          // outline: 'none', // 이 줄은 CSS로 대체
        }}
      >
        {dragBox}
      </div>
      {popup}
    </div>
  );
}
