import React, { useState } from "react";

// 시간(초) → 00:00:00.000 포맷
function formatTimeFull(sec) {
  if (isNaN(sec) || sec == null) return "00:00:00.000";
  const ms = Math.floor((sec % 1) * 1000);
  const totalSec = Math.floor(sec);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(":") + "." + ms.toString().padStart(3, '0');
}
// 00:00:00.000 → 초 변환
function parseTimeFull(str) {
  if (!str) return 0;
  // 밀리초가 1~2자리면 3자리로 패딩
  const padded = str.replace(/\.(\d{1,2})$/, (m, ms) => '.' + ms.padEnd(3, '0'));
  const match = padded.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return NaN;
  const [, h, m, s, ms] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

export default function RegionList({
  regions = [],
  selectedRegionId,
  onSelect,
  onDelete,
  onEditSave,
  speakerColors = {},
  defaultSpeakerColor = {},
  hideTitle = false,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editStart, setEditStart] = useState(0);
  const [editEnd, setEditEnd] = useState(0);
  const [editStartStr, setEditStartStr] = useState("");
  const [editEndStr, setEditEndStr] = useState("");

  const handleEditClick = (region) => {
    setEditingId(region.id);
    setEditStart(region.start);
    setEditEnd(region.end);
    setEditStartStr(formatTimeFull(region.start));
    setEditEndStr(formatTimeFull(region.end));
  };

  const handleEditSave = (region) => {
    const startSec = parseTimeFull(editStartStr);
    const endSec = parseTimeFull(editEndStr);
    if (isNaN(startSec) || isNaN(endSec) || startSec >= endSec) {
      alert("시간 형식이 올바르지 않거나 시작이 끝보다 크거나 같습니다.\n예시: 00:01:23.456");
      return;
    }
    if (onEditSave) {
      onEditSave(region.id, startSec, endSec);
    }
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  return (
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
        padding: '20px 36px 20px 24px', // 오른쪽 padding 충분히
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          fontSize: 22,
          color: '#888',
          cursor: 'pointer',
          zIndex: 10,
          padding: 0,
          lineHeight: 1,
        }}
        aria-label="닫기"
      >×</button>
      {!hideTitle && (
        <div style={{
          fontWeight: 700,
          fontSize: 15,
          color: '#1976d2',
          marginBottom: 8,
          paddingLeft: 16,
        }}>구간 목록</div>
      )}
      {regions.length === 0 ? (
        <div style={{ color: '#aaa', fontSize: 14, padding: '8px 16px' }}>
          구간이 없습니다.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[...regions].sort((a, b) => a.start - b.start).map(region => {
            const isSelected = region.id === selectedRegionId;
            const color = (region.speaker && speakerColors[region.speaker]?.default?.color) || defaultSpeakerColor?.default?.color || '#b0b7c3';
            const isEditing = editingId === region.id;
            return (
              <li
                key={region.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px', // 여백을 약간 늘림
                  background: isSelected ? '#e3f2fd' : 'transparent',
                  borderRadius: 4,
                  marginBottom: 2,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #1976d2' : '1px solid #eee',
                  transition: 'background 0.15s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onClick={() => onSelect(region.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: color,
                    marginRight: 10,
                    border: '1px solid #bbb',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600 }}>{region.speaker || '미지정'}</span>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8, minWidth: 0 }}>
                      <input
                        type="text"
                        value={editStartStr}
                        onChange={e => setEditStartStr(e.target.value)}
                        style={{ width: 110, fontFamily: 'monospace', fontSize: 14, padding: '2px 6px', flex: 'none' }}
                        placeholder="00:00:00.000"
                        maxLength={12}
                      />
                      <span style={{ fontWeight: 600, color: '#888' }}>~</span>
                      <input
                        type="text"
                        value={editEndStr}
                        onChange={e => setEditEndStr(e.target.value)}
                        style={{ width: 110, fontFamily: 'monospace', fontSize: 14, padding: '2px 6px', flex: 'none' }}
                        placeholder="00:00:00.000"
                        maxLength={12}
                      />
                    </div>
                  ) : (
                    <span style={{ marginLeft: 10, color: '#888', fontFamily: 'monospace' }}>
                      {formatTimeFull(region.start)} ~ {formatTimeFull(region.end)}
                    </span>
                  )}
                </div>
                {/* 버튼 그룹: 항상 오른쪽 끝에 정렬 */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); handleEditSave(region); }}
                        style={{ color: '#1976d2', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, marginLeft: 0 }}
                        title="저장"
                      >save</button>
                      <button
                        onClick={e => { e.stopPropagation(); handleEditCancel(); }}
                        style={{ color: '#888', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, marginLeft: 0 }}
                        title="취소"
                      >cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); handleEditClick(region); }}
                        style={{ marginLeft: 0, color: '#1976d2', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
                        title="시간 편집"
                      >edit</button>
                    </>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(region.id); }}
                    style={{
                      marginLeft: 0,
                      background: 'none',
                      border: 'none',
                      color: '#d32f2f',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                    title="구간 삭제"
                  >delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 