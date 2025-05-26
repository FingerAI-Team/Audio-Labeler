"use client";
import React from "react";

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

      <div className="audio-section">
        <h2>오디오 주석 작업</h2>
        <audio controls style={{ width: "100%", borderRadius: "5px", background: "#f3f4f6" }}>
          <source src="#" type="audio/wav" />
          브라우저가 오디오 태그를 지원하지 않습니다.
        </audio>
        <div className="tag-section">
          <label>구간 선택: </label>
          <input type="number" min="0" placeholder="시작 (초)" /> ~
          <input type="number" min="0" placeholder="끝 (초)" />
          <label>발화자:</label>
          <select>
            <option>화자1</option>
            <option>화자2</option>
            <option>기타</option>
          </select>
          <button>구간 추가</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>시작</th>
              <th>끝</th>
              <th>발화자</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1.2</td>
              <td>3.5</td>
              <td>화자1</td>
              <td>
                <button>삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="actions">
          <button>주석 저장</button>
          <button>다운로드</button>
        </div>
      </div>
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
          margin-top: 22px;
          margin-bottom: 16px;
          background: #fafbfc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: none;
          padding: 10px 8px 8px 8px;
        }
        .audio-section audio {
          margin-bottom: 20px;
        }
        .tag-section {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .tag-section label {
          font-weight: 500;
          color: #1a237e;
        }
        .tag-section input, .tag-section select {
          padding: 8px 12px;
          border: 1.2px solid #b0b7c3;
          border-radius: 5px;
          font-size: 1em;
          outline: none;
          background: #fff;
          transition: border 0.2s;
        }
        .tag-section input:focus, .tag-section select:focus {
          border: 1.5px solid #1a237e;
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
