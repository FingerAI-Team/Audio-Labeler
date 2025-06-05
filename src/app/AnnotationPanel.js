import React from 'react';

export default function AnnotationPanel({
  selectedRegion,
  selectedSpeaker,
  speakers,
  onSpeakerChange,
  annotation,
  onAnnotationChange,
  onSave,
  onCancel,
  disabled
}) {
  if (!selectedRegion) return null;

  return (
    <div style={{
      padding: '16px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      marginTop: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <label style={{ fontWeight: 600, fontSize: '14px', minWidth: '60px' }}>화자:</label>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {speakers.map((speaker) => (
            <button
              key={speaker}
              onClick={() => onSpeakerChange(speaker)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1.5px solid',
                borderColor: selectedSpeaker === speaker ? '#1976d2' : '#e0e0e0',
                background: selectedSpeaker === speaker ? '#1976d2' : '#fff',
                color: selectedSpeaker === speaker ? '#fff' : '#222',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
              disabled={disabled}
            >
              {speaker}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          fontWeight: 600, 
          fontSize: '14px',
          marginBottom: '8px'
        }}>
          주석:
        </label>
        <textarea
          value={annotation}
          onChange={(e) => onAnnotationChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1.5px solid #e0e0e0',
            fontSize: '14px',
            resize: 'vertical'
          }}
          placeholder="주석을 입력하세요..."
          disabled={disabled}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 16px',
            borderRadius: '4px',
            border: '1.5px solid #e0e0e0',
            background: '#fff',
            color: '#666',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
          disabled={disabled}
        >
          취소
        </button>
        <button
          onClick={onSave}
          style={{
            padding: '6px 16px',
            borderRadius: '4px',
            border: '1.5px solid #1976d2',
            background: '#1976d2',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
          disabled={disabled || !annotation.trim()}
        >
          저장
        </button>
      </div>
    </div>
  );
} 