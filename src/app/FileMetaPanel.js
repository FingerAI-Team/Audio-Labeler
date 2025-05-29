import React from "react";

export default function FileMetaPanel({
  file,
  description,
  onDescriptionChange,
  onDelete,
  onUpload,
  onSave,
  onDownload,
  showGuide,
  fileInputRef,
  onPrev,
  onNext,
  disablePrev,
  disableNext
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 0,
      marginBottom: 24,
      background: '#fafbfc',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      padding: 0,
      position: 'relative',
      minHeight: 140
    }}>
      {/* 왼쪽: 파일 정보/설명 (오버레이 포함) */}
      <div style={{ flex: 1, padding: '12px 24px 24px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', minHeight: 120 }}>
        <div style={{ opacity: showGuide ? 0.3 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, marginBottom: 8, color: '#555', fontWeight: 500 }}>
            Filename:
            <div style={{
              width: 420,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              background: '#fafbfc',
              color: '#444',
              borderRadius: 5,
              padding: '0 12px',
              fontWeight: 400,
              fontSize: 15,
              boxSizing: 'border-box',
              border: 'none',
              lineHeight: 1.5
            }}>{file?.name || ''}</div>
          </div>
          <div style={{ fontSize: 15, marginBottom: 10, color: '#555', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            Description:
            <textarea
              value={description}
              onChange={e => onDescriptionChange?.(e.target.value)}
              placeholder="ex) 2025-01-01 meeting with company A"
              style={{
                width: 420,
                height: 40,
                fontSize: 15,
                border: '1px solid #ccc',
                borderRadius: 5,
                marginTop: 0,
                padding: '8px 12px',
                resize: 'none',
                fontFamily: 'inherit',
                background: '#fafbfc',
                color: '#444',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
            />
          </div>
        </div>
        {/* 좌우 화살표 버튼 */}
        <div style={{ position: 'absolute', right: 24, bottom: 18, display: 'flex', gap: 8, zIndex: 20 }}>
          <button
            onClick={onPrev}
            disabled={disablePrev}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1.2px solid #b0b7c3',
              background: '#fff',
              color: disablePrev ? '#bbb' : '#1976d2',
              fontSize: 20,
              fontWeight: 700,
              cursor: disablePrev ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              opacity: disablePrev ? 0.5 : 1
            }}
            aria-label="이전 파일"
          >&#x25C0;</button>
          <button
            onClick={onNext}
            disabled={disableNext}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1.2px solid #b0b7c3',
              background: '#fff',
              color: disableNext ? '#bbb' : '#1976d2',
              fontSize: 20,
              fontWeight: 700,
              cursor: disableNext ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              opacity: disableNext ? 0.5 : 1
            }}
            aria-label="다음 파일"
          >&#x25B6;</button>
        </div>
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
            fontSize: 22,
            fontWeight: 500,
            background: '#fff',
            zIndex: 10,
            pointerEvents: 'none',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8
          }}>
            Welcome to Audio Labeler !! Please Upload audio file
          </div>
        )}
      </div>
      {/* 오른쪽: 버튼 그룹 (항상 보임) */}
      <div style={{
        minWidth: 140,
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 18px 18px 18px',
        gap: 12,
        position: 'relative'
      }}>
        <button
          onClick={() => fileInputRef?.current?.click()}
          style={{
            width: 110,
            fontSize: 17,
            borderRadius: 7,
            border: '1.2px solid #b0b7c3',
            background: '#f7f7f7',
            color: '#1976d2',
            fontWeight: 600,
            padding: '7px 0',
            cursor: 'pointer',
            marginBottom: 2
          }}
        >upload</button>
        <button
          onClick={onSave}
          disabled={showGuide}
          style={{
            width: 110,
            fontSize: 17,
            borderRadius: 7,
            border: '1.2px solid #b0b7c3',
            background: '#f7f7f7',
            color: '#444',
            fontWeight: 500,
            padding: '7px 0',
            cursor: showGuide ? 'not-allowed' : 'pointer',
            opacity: showGuide ? 0.5 : 1
          }}
        >save</button>
        <button
          onClick={onDownload}
          disabled={showGuide}
          style={{
            width: 110,
            fontSize: 17,
            borderRadius: 7,
            border: '1.2px solid #b0b7c3',
            background: '#f7f7f7',
            color: '#444',
            fontWeight: 500,
            padding: '7px 0',
            cursor: showGuide ? 'not-allowed' : 'pointer',
            opacity: showGuide ? 0.5 : 1
          }}
        >download</button>
        <button
          onClick={onDelete}
          disabled={showGuide}
          style={{
            width: 110,
            fontSize: 17,
            borderRadius: 7,
            border: '1.2px solid #b0b7c3',
            background: '#f7f7f7',
            color: '#444',
            fontWeight: 500,
            padding: '7px 0',
            cursor: showGuide ? 'not-allowed' : 'pointer',
            opacity: showGuide ? 0.5 : 1
          }}
        >delete</button>
      </div>
    </div>
  );
} 