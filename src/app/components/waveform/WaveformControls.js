import React from "react";
import RewindIcon from '../../icons/backward.svg';
import PlayIcon from '../../icons/play.svg';
import ForwardIcon from '../../icons/forward.svg';
import PauseIcon from '../../icons/pause.svg';
import SettingIcon from '../../icons/setting.svg';

export default function WaveformControls({
  isPlaying,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  showSpeedSetting,
  setShowSpeedSetting,
  playbackRate,
  onPlaybackRateChange,
  showGuide,
  wavesurferRef,
  containerRef,
  currentTime
}) {
  return (
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
                onChange={e => onPlaybackRateChange(Number(e.target.value))}
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
          onClick={onSkipBackward}
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
          onClick={onPlayPause}
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
          onClick={onSkipForward}
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
        {(!showGuide && wavesurferRef.current) ? (currentTime ? currentTime.toFixed(3) : '00:00:00.000') : '00:00:00.000'}
      </div>
    </div>
  );
} 