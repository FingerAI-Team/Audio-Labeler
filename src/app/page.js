"use client";
import React, { useRef, useState, useEffect } from "react";
import WaveformLabeler from "./WaveformLabeler";
import FileMetaPanel from "./FileMetaPanel";

export default function Home() {
  const [files, setFiles] = useState([]); // [{file, url, meta: {purpose, desc, participants}}]
  const [selectedIdx, setSelectedIdx] = useState(null);
  const fileInputRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const showGuide = files.length === 0 || selectedIdx == null;

  // 파일 업로드 핸들러
  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      meta: { purpose: '', desc: '', participants: 1 }
    }));
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      setSelectedIdx(updated.length - 1);
      return updated;
    });
    e.target.value = '';
  };

  // 메타데이터 변경 핸들러
  const handleMetaChange = (idx, key, value) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, meta: { ...f.meta, [key]: value } } : f));
  };

  // 파일 삭제
  const handleDelete = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    if (selectedIdx === idx) setSelectedIdx(null);
  };

  // 저장/다운로드 (예: JSON)
  const handleDownload = () => {
    if (selectedIdx == null) return;
    const data = files[selectedIdx];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.file.name}_meta.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
        <input
          type="file"
          accept="audio/*"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>
      <FileMetaPanel
        file={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].file : undefined}
        description={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].meta.desc : ''}
        onDescriptionChange={desc => handleMetaChange(selectedIdx, 'desc', desc)}
        onDelete={() => handleDelete(selectedIdx)}
        onUpload={() => fileInputRef.current && fileInputRef.current.click()}
        onSave={() => {}}
        onDownload={handleDownload}
        showGuide={showGuide}
        fileInputRef={fileInputRef}
        onPrev={() => setSelectedIdx(idx => (idx > 0 ? idx - 1 : idx))}
        onNext={() => setSelectedIdx(idx => (idx < files.length - 1 ? idx + 1 : idx))}
        disablePrev={selectedIdx == null || selectedIdx <= 0}
        disableNext={selectedIdx == null || selectedIdx >= files.length - 1}
      />
      <WaveformLabeler
        key={selectedIdx}
        audioUrl={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].url : undefined}
        audioFile={selectedIdx != null && files[selectedIdx] ? files[selectedIdx].file : undefined}
        showSample={false}
        showGuide={showGuide}
        onPlayingChange={setIsPlaying}
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
