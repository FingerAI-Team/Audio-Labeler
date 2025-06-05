import React, { useState, useEffect } from "react";

export default function RegionEditor({
  region,
  speakers = [],
  onChange,
  onDelete,
  onSpeakerChange,
  onStartChange,
  onEndChange,
}) {
  const [start, setStart] = useState(region?.start || 0);
  const [end, setEnd] = useState(region?.end || 0);
  const [speaker, setSpeaker] = useState(region?.speaker || speakers[0] || "");

  useEffect(() => {
    setStart(region?.start || 0);
    setEnd(region?.end || 0);
    setSpeaker(region?.speaker || speakers[0] || "");
  }, [region, speakers]);

  if (!region) return null;

  const handleSave = () => {
    if (onChange) {
      onChange({ ...region, start, end, speaker });
    }
  };

  return (
    <div style={{
      margin: '18px 0',
      padding: '16px',
      background: '#f8f9fa',
      borderRadius: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      maxWidth: 400,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', marginBottom: 10 }}>구간 편집</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13, color: '#555' }}>
          시작 시간
          <input
            type="number"
            step="0.001"
            min={0}
            value={start}
            onChange={e => {
              setStart(Number(e.target.value));
              if (onStartChange) onStartChange(Number(e.target.value));
            }}
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>
        <label style={{ fontSize: 13, color: '#555' }}>
          끝 시간
          <input
            type="number"
            step="0.001"
            min={start}
            value={end}
            onChange={e => {
              setEnd(Number(e.target.value));
              if (onEndChange) onEndChange(Number(e.target.value));
            }}
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>
        <label style={{ fontSize: 13, color: '#555' }}>
          화자
          <select
            value={speaker}
            onChange={e => {
              setSpeaker(e.target.value);
              if (onSpeakerChange) onSpeakerChange(e.target.value);
            }}
            style={{ marginLeft: 8 }}
          >
            {speakers.map(spk => (
              <option key={spk} value={spk}>{spk}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 18px',
              borderRadius: 6,
              border: '1.5px solid #1976d2',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            저장
          </button>
          <button
            onClick={() => onDelete && onDelete(region.id)}
            style={{
              padding: '6px 18px',
              borderRadius: 6,
              border: '1.5px solid #d32f2f',
              background: '#fff',
              color: '#d32f2f',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
} 