import React from 'react';
// import { Slider } from 'semantic-ui-react'; // Assuming Semantic UI React for the slider component

function titleToHyphenated(title) {
  // Convert title to lowercase and replace spaces with hyphens
  return title.toLowerCase().replace(/\s+/g, '-');
}

const LabeledParameter = ({label, children}) => {
  return (
    <div className="crsb fw parameter">
      <label for={titleToHyphenated(label)}>{label}</label>
      {children}
    </div>
  )
}

const ParameterSlider = ({ label, value, setValue, minValue, maxValue, stepValue, parser=parseFloat}) => {
  
  const handleChange = (e) => {setValue(parser(e.target.value));};

  return (
      <input
        type="range"
        value={value}
        min={minValue} // Adjust min and max values as needed
        max={maxValue}
        step={stepValue}
        onChange={handleChange}
        for={titleToHyphenated(label)}
      />

  );
};

export { LabeledParameter, ParameterSlider }; // Export as named export

