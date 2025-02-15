// BeadHeightSlider.jsx

import React from 'react';
import { Slider } from 'semantic-ui-react'; // Assuming Semantic UI React for the slider component

const BeadHeightSlider = ({ beadHeight, setBeadHeight }) => {
  const handleChange = (e, { value }) => {
    setBeadHeight(value);
  };

  return (
    <div className="bead-height-slider">
      <label>Bead Height</label>
      <Slider
        value={beadHeight}
        min={1} // Adjust min and max values as needed
        max={10}
        step={0.1}
        onChange={handleChange}
      />
    </div>
  );
};

export default BeadHeightSlider; 

