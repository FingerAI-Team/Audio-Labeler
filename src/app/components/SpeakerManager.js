import React from "react";

export default function SpeakerManager({
  speakers = [],
  selectedSpeaker,
  highlightedSpeaker,
  onSelect,
  onHighlight,
  onAdd,
  onDelete,
  minSpeakers = 2,
  speakerColors = {},
  defaultSpeakerColor = {},
  showGuide = false,
  onShowRegionList,
  onHide = () => {},
}) {
  return (
    <div style={{
      marginBottom: 12,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      opacity: showGuide ? 0.5 : 1,
    }}>
      <div style={{
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: 'calc(100% - 120px)',
        height: 90,
        overflowY: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignContent: 'flex-start',
        borderRight: '1px solid #e0e0e0',
        padding: '4px 12px',
        boxSizing: 'border-box',
      }}>
        {speakers.map((spk) => (
          <button
            key={spk}
            onClick={() => onSelect?.(spk)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1.5px solid',
              borderColor: speakerColors[spk]?.default.borderColor || '#e0e0e0',
              background: (highlightedSpeaker === spk || selectedSpeaker === spk)
                ? (speakerColors[spk]?.default.color || defaultSpeakerColor.default?.color)
                : 'rgba(255, 255, 255, 0.8)',
              color: speakerColors[spk]?.default.borderColor || '#222',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              minWidth: 60,
              height: 28,
              flexShrink: 0,
              boxSizing: 'border-box',
              margin: '2px 0 4px 0',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              position: 'relative',
              zIndex: (highlightedSpeaker === spk || selectedSpeaker === spk) ? 1 : 'auto',
              opacity: showGuide ? 0.5 : 1,
            }}
            onMouseEnter={e => onHighlight?.(spk)}
            onMouseLeave={e => onHighlight?.(null)}
            disabled={showGuide}
          >
            {spk}
          </button>
        ))}
      </div>
      {/* 버튼 영역을 flex column으로 묶고, 2행으로 분리 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 80 }}>
        <div style={{ display: 'flex', gap: 8 }}>
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
            onClick={onAdd}
            disabled={showGuide}
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
              cursor: speakers.length > minSpeakers ? 'pointer' : 'not-allowed',
              height: 28,
              minWidth: 60,
            }}
            onClick={onDelete}
            disabled={speakers.length <= minSpeakers || showGuide}
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
            onClick={onHide}
            disabled={showGuide}
          >Hide</button>
          <button
            style={{
              padding: '3px 16px',
              borderRadius: 4,
              border: '1.2px solid #1976d2',
              background: '#fff',
              color: '#1976d2',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              height: 28,
              minWidth: 100,
            }}
            onClick={onShowRegionList}
            disabled={showGuide}
          >Tagged List</button>
        </div>
      </div>
    </div>
  );
} 