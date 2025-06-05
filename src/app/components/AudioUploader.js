import React, { useRef } from "react";

export default function AudioUploader({
  onSave,
  onDownload,
  onDelete,
  showGuide,
  isSaved
}) {
  const fileInputRef = useRef();

  // 파일 업로드 핸들러
  const handleUpload = (e) => {
    const event = new Event('audio-upload', { bubbles: true });
    event.files = e.target.files;
    window.dispatchEvent(event);
    e.target.value = '';
  };

  // 외부에서 커스텀 이벤트를 받아서 처리하도록 함 (page.js에서 useAudioFiles의 handleUpload가 이 이벤트를 구독)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      position: 'relative',
      minWidth: 140,
      padding: '24px 18px 18px 18px',
      borderLeft: '1px solid #e0e0e0',
    }}>
      <input
        type="file"
        accept="audio/*"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
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
        disabled={showGuide || isSaved}
        style={{
          width: 110,
          fontSize: 17,
          borderRadius: 7,
          border: '1.2px solid',
          borderColor: isSaved ? '#4caf50' : '#b0b7c3',
          background: isSaved ? '#e8f5e9' : '#f7f7f7',
          color: isSaved ? '#2e7d32' : '#444',
          fontWeight: 500,
          padding: '7px 0',
          cursor: showGuide || isSaved ? 'not-allowed' : 'pointer',
          opacity: showGuide ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}
      >{isSaved ? '✓ saved' : 'save'}</button>
      <button
        onClick={onDownload}
        disabled={showGuide || !isSaved}
        style={{
          width: 110,
          fontSize: 17,
          borderRadius: 7,
          border: '1.2px solid #b0b7c3',
          background: '#f7f7f7',
          color: '#444',
          fontWeight: 500,
          padding: '7px 0',
          cursor: showGuide || !isSaved ? 'not-allowed' : 'pointer',
          opacity: showGuide || !isSaved ? 0.5 : 1
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
  );
} 