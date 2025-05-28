"use client";
import React from "react";
import WaveformLabeler from "./WaveformLabeler";

export default function Home() {
  return (
    <div className="container">
      <h2>작업 목록</h2>
      <table>
        <thead>
          <tr>
            <th>파일명</th>
            <th>상태</th>
            <th>담당자</th>
            <th>진행률</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>audio1.wav</td>
            <td>미작업</td>
            <td>홍길동</td>
            <td>0%</td>
            <td><button>작업 시작</button></td>
          </tr>
          <tr>
            <td>audio2.wav</td>
            <td>작업중</td>
            <td>김철수</td>
            <td>50%</td>
            <td><button>계속 작업</button></td>
          </tr>
        </tbody>
      </table>

      <WaveformLabeler />

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
        h2 {
          color: #222;
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.12em;
          padding-bottom: 5px;
          font-weight: 700;
          border-bottom: 2px solid #e5e7eb;
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
        .audio-section {
          /* 삭제됨 */
        }
        .audio-section audio {
          /* 삭제됨 */
        }
        .tag-section {
          /* 삭제됨 */
        }
        .tag-section label {
          /* 삭제됨 */
        }
        .tag-section input, .tag-section select {
          /* 삭제됨 */
        }
        .tag-section input:focus, .tag-section select:focus {
          /* 삭제됨 */
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
          .audio-section { padding: 8px 2vw; margin-top: 18px; margin-bottom: 16px; }
          .tag-section { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
          table, th, td { font-size: 0.97em; }
        }
      `}</style>
    </div>
  );
}
