import React from 'react';
// import { Slider } from 'semantic-ui-react'; // Assuming Semantic UI React for the slider component


const LabeledParameter = ({label, children}) => {
  return (
    <div className="crsb fw parameter">
      <label>{label}</label>
      {children}
    </div>
  )
}

const ParameterSlider = ({ value, setValue, minValue, maxValue, stepValue, parser=parseFloat}) => {
  
  const handleChange = (e) => {setValue(parser(event.target.value));};

  return (
      <input
        type="range"
        value={value}
        min={minValue} // Adjust min and max values as needed
        max={maxValue}
        step={stepValue}
        onChange={handleChange}
      />

  );
};

export { LabeledParameter, ParameterSlider }; // Export as named export

