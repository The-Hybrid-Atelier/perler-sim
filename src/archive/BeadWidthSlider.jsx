import React, { useState, useEffect } from 'react';
import Ruler from '../javascripts/ruler.js';

const InnerRadiusSlider = ({ beadParameters, setBeadParameters }) => {
  const [sliderValue, setSliderValue] = useState(beadParameters.inner_radius);

  useEffect(() => {
    setSliderValue(beadParameters.inner_radius);
  }, [beadParameters.inner_radius]);

  const handleSliderChange = (event) => {
    const newInnerRadius = Number(event.target.value);
    setSliderValue(newInnerRadius);
    setBeadParameters({
      ...beadParameters,
      inner_radius: newInnerRadius
    });
  };

  const innerRadiusMin = Ruler.mm2pts(0.1);
  const innerRadiusMax = (beadParameters.outer_radius);
  const innerRadiusStep = Ruler.mm2pts(0.05);

  return (
    <div className="inner-radius-slider" style={{ marginBottom: '1em' }}>
      <label style={{ display: 'block', marginBottom: '0.5em' }}>
        Inner Radius: {Ruler.pts2mm(sliderValue).toFixed(2)} mm
      </label>
      <input
        type="range"
        min={innerRadiusMin}
        max={innerRadiusMax}
        step={innerRadiusStep}
        value={sliderValue}
        onChange={handleSliderChange}
      />
    </div>
  );
};

export default InnerRadiusSlider;


