"use client";
import React, { useEffect } from "react";
import WaveformLabeler from "./WaveformLabeler";
import FileMetaPanel from "./FileMetaPanel";
import AudioUploader from "./components/AudioUploader";
import useAudioFiles from "./hooks/useAudioFiles";

export default function Home() {
  const {
    files,
    selectedIdx,
    setSelectedIdx,
    showGuide,
    savedStates,
    handleUpload,
    handleMetaChange,
    handleLabelsChange,
    handleDelete,
    handleSave,
    handleDownload
  } = useAudioFiles();
  const [isPlaying, setIsPlaying] = React.useState(false);

  // AudioUploader에서 발생시키는 커스텀 이벤트를 구독하여 handleUpload 실행
  useEffect(() => {
    const onAudioUpload = (e) => {
      if (e.files) {
        handleUpload({ target: { files: e.files, value: '' } });
      }
    };
    window.addEventListener('audio-upload', onAudioUpload);
    return () => window.removeEventListener('audio-upload', onAudioUpload);
  }, [handleUpload]);

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 0 }}>
        <FileMetaPanel
          file={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].file : undefined}
          description={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].meta.desc : ''}
          onDescriptionChange={desc => handleMetaChange(selectedIdx, 'desc', desc)}
          showGuide={showGuide}
        />
        <AudioUploader
          onSave={handleSave}
          onDownload={handleDownload}
          onDelete={() => handleDelete(selectedIdx)}
          showGuide={showGuide}
          isSaved={selectedIdx != null ? savedStates[selectedIdx] : false}
        />
      </div>
      <WaveformLabeler
        key={selectedIdx}
        audioUrl={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].url : undefined}
        audioFile={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].file : undefined}
        showSample={false}
        showGuide={showGuide}
        onPlayingChange={setIsPlaying}
        onLabelsChange={handleLabelsChange}
      />

      <style jsx global>{`
        body {
          font-family: 'Noto Sans KR', sans-serif;
          margin: 0; padding: 0;
          background: #f4f4f6;
          font-size: 1.03em;
          overflow-x: hidden;
        }
        .container {
          max-width: 1150px;
          width: 95%;
          margin: 18px auto 18px auto;
          background: #fff;
          padding: 22px 26px 18px 26px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          background: #fff;
          font-size: 1em;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 10px 7px;
          text-align: center;
        }
        th {
          background: #f3f4f6;
          color: #1a237e;
          font-weight: 700;
        }
        tr:nth-child(even) td {
          background: #f8f9fa;
        }
        tr:hover td {
          background: #f0f4f8;
          transition: background 0.2s;
        }
        .actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
        }
        button {
          padding: 8px 16px;
          border-radius: 5px;
          border: 1.2px solid #b0b7c3;
          background: #f3f4f6;
          color: #1a237e;
          font-weight: 700;
          font-size: 1em;
          cursor: pointer;
          box-shadow: none;
          transition: background 0.2s, color 0.2s, border 0.2s, transform 0.1s;
        }
        button:hover:not(:disabled) {
          background: #e3e7ef;
          color: #0d47a1;
          border: 1.5px solid #1a237e;
          transform: translateY(-2px) scale(1.03);
        }
        button:disabled {
          background: #e0e0e0;
          color: #a0a0a0;
          border: 1.2px solid #b0b7c3;
          cursor: not-allowed;
        }
        .actions button, td button {
          background: #1976d2;
          color: #fff;
          border: 1.2px solid #1976d2;
        }
        .actions button:hover, td button:hover {
          background: #0d47a1;
          color: #fff;
          border: 1.5px solid #0d47a1;
        }
        @media (max-width: 700px) {
          .container { padding: 0 3vw; margin: 8px auto 8px auto; width: 98%; font-size: 0.98em; }
          table, th, td { font-size: 0.97em; }
        }
        textarea::-webkit-scrollbar { display: none; }
        textarea.centered-placeholder::placeholder {
          text-align: center;
          vertical-align: middle;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
