import React, { useState, useEffect } from 'react';
import Ruler from "../javascripts/ruler.js";

const GridSizeSlider = ({ gridSize, setGridSize }) => {
  const [sliderValue, setSliderValue] = useState(Ruler.mm2pts(gridSize * 10)); // Convert cm to mm, then to pts

  useEffect(() => {
    setSliderValue(Ruler.mm2pts(gridSize * 10)); // Convert cm to mm, then to pts
  }, [gridSize]);

  const handleSliderChange = (event) => {
    const newGridSizePts = Number(event.target.value);
    setSliderValue(newGridSizePts);
    setGridSize(Ruler.pts2mm(newGridSizePts) / 10); // Convert pts to mm, then to cm
  };

  const gridSizeMin = Ruler.mm2pts(10); 
  const gridSizeMax = Ruler.mm2pts(200); 
  const gridSizeStep = Ruler.mm2pts(10); 

  return (
    <div className="grid-size-slider" style={{ marginBottom: '1em' }}>
      <label style={{ display: 'block', marginBottom: '0.5em' }}>
        Grid Size: {(Ruler.pts2mm(sliderValue) / 10).toFixed(1)} cm
      </label>
      <input
        type="range"
        min={gridSizeMin}
        max={gridSizeMax}
        step={gridSizeStep}
        value={sliderValue}
        onChange={handleSliderChange}
      />
    </div>
  );
};

export default GridSizeSlider;

