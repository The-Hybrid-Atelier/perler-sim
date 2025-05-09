import React, { useState, useEffect } from 'react';
import Ruler from "../javascripts/ruler.js";

const BeadSpacingSlider = ({ beadSpacing, setBeadSpacing }) => {
  const [sliderValue, setSliderValue] = useState(Ruler.mm2pts(beadSpacing));

  useEffect(() => {
    setSliderValue(Ruler.mm2pts(beadSpacing));
  }, [beadSpacing]);

  const handleSliderChange = (event) => {
    const newBeadSpacing = Number(event.target.value);
    setSliderValue(newBeadSpacing);
    setBeadSpacing(Ruler.pts2mm(newBeadSpacing));
  };

  const beadSpaceMin = Ruler.mm2pts(-1);
  const beadSpaceMax = Ruler.mm2pts(1.5);
  const beadSpaceStep = Ruler.mm2pts(0.1);

  return (
    <div className="bead-spacing-slider" style={{ marginBottom: '1em' }}>
      <label style={{ display: 'block', marginBottom: '0.5em' }}>
        Bead Spacing: {Ruler.pts2mm(sliderValue).toFixed(2)} mm
      </label>
      <input
        type="range"
        min={beadSpaceMin}
        max={beadSpaceMax}
        step={beadSpaceStep}
        value={sliderValue}
        onChange={handleSliderChange}
      />
    </div>
  );
};

export default BeadSpacingSlider;

