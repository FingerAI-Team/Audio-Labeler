import { useState, useCallback } from "react";

export default function useRegions({
  regionsPluginRef,
  wavesurferRef,
  getRegionStyle,
}) {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [speakerRegions, setSpeakerRegions] = useState({});
  const [highlightedSpeaker, setHighlightedSpeaker] = useState(null);

  // 구간 클릭 핸들러
  const handleRegionClick = useCallback((region, e) => {
    e.stopPropagation();
    setSelectedRegionId(region.id);
    // 재생 등 추가 동작은 상위에서 처리
  }, []);

  // 구간 삭제 시 화자 정보도 함께 삭제
  const handleRegionRemoved = useCallback((region) => {
    setSpeakerRegions((prev) => {
      const newSpeakerRegions = { ...prev };
      delete newSpeakerRegions[region.id];
      return newSpeakerRegions;
    });
  }, []);

  // 구간 스타일 일괄 적용
  const updateAllRegionStyles = useCallback(() => {
    if (!regionsPluginRef.current) return;
    regionsPluginRef.current.getRegions().forEach((r) => {
      const style = getRegionStyle(r.id, speakerRegions[r.id]);
      r.setOptions(style);
    });
  }, [regionsPluginRef, getRegionStyle, speakerRegions]);

  return {
    selectedRegionId,
    setSelectedRegionId,
    speakerRegions,
    setSpeakerRegions,
    highlightedSpeaker,
    setHighlightedSpeaker,
    handleRegionClick,
    handleRegionRemoved,
    updateAllRegionStyles,
  };
} 