export function formatTimeFull(t) {
  const hours = String(Math.floor(t / 3600)).padStart(2, '0');
  const min = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(t % 60)).padStart(2, '0');
  const ms = String(Math.floor((t % 1) * 1000)).padStart(3, '0');
  return `${hours}:${min}:${sec}.${ms}`;
} 