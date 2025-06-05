import { useRef, useState } from 'react';

export default function useAudioFiles() {
  const [files, setFiles] = useState([]); // [{file, url, meta, labels}]
  const [selectedIdx, setSelectedIdx] = useState(null);
  const fileInputRef = useRef();
  const [savedStates, setSavedStates] = useState({});
  const showGuide = files.length === 0 || selectedIdx == null;

  // 파일 업로드
  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      meta: { purpose: '', desc: '', participants: 2 },
      labels: {
        speakers: ['Speaker A', 'Speaker B'],
        regions: []
      }
    }));
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      setSelectedIdx(updated.length - 1);
      return updated;
    });
    e.target.value = '';
  };

  // 메타데이터 변경
  const handleMetaChange = (idx, key, value) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, meta: { ...f.meta, [key]: value } } : f));
    setSavedStates(prev => ({ ...prev, [idx]: false }));
  };

  // 레이블 변경
  const handleLabelsChange = (labels) => {
    if (selectedIdx == null) return;
    setFiles(prev => {
      const currentFile = prev[selectedIdx];
      if (JSON.stringify(currentFile.labels) === JSON.stringify(labels)) {
        return prev;
      }
      const speakerCount = labels.speakers.length;
      const newFiles = prev.map((f, i) =>
        i === selectedIdx
          ? {
              ...f,
              labels: { ...labels },
              meta: { ...f.meta, participants: speakerCount }
            }
          : f
      );
      setSavedStates(current => ({ ...current, [selectedIdx]: false }));
      return newFiles;
    });
  };

  // 파일 삭제
  const handleDelete = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setSavedStates(prev => {
      const newSavedStates = { ...prev };
      delete newSavedStates[idx];
      return newSavedStates;
    });
    if (selectedIdx === idx) setSelectedIdx(null);
  };

  // 저장
  const handleSave = () => {
    if (selectedIdx == null) return;
    setSavedStates(prev => ({ ...prev, [selectedIdx]: true }));
  };

  // 다운로드
  const handleDownload = () => {
    if (selectedIdx == null) return;
    const data = files[selectedIdx];
    const downloadData = {
      filename: data.file.name,
      meta: data.meta,
      labels: data.labels,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.file.name}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    files,
    selectedIdx,
    setSelectedIdx,
    fileInputRef,
    showGuide,
    savedStates,
    handleUpload,
    handleMetaChange,
    handleLabelsChange,
    handleDelete,
    handleSave,
    handleDownload
  };
} 