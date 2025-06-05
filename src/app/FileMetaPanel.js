"use client";
import React from "react";
import RewindIcon from './icons/left.svg';
import ForwardIcon from './icons/right.svg';

export default function FileMetaPanel({
  file,
  description,
  onDescriptionChange,
  showGuide
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
      minHeight: 220  ,
      minWidth: 500,
      flex: 2,
      boxSizing: 'border-box',
    }}>
      {/* 왼쪽: 파일 정보/설명 (오버레이 포함) */}
      <div style={{ flex: 1, padding: '40px 24px 40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', minHeight: 160 }}>
        <div style={{ opacity: showGuide ? 0.3 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, marginBottom: 8, color: '#555', fontWeight: 500 }}>
            Filename:
            <div style={{
              width: 500,
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
                width: 500,
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
    </div>
  );
} 