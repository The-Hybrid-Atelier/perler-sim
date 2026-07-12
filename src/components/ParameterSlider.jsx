import React from 'react';
// import { Slider } from 'semantic-ui-react'; // Assuming Semantic UI React for the slider component

function titleToHyphenated(title) {
  // Convert title to lowercase and replace spaces with hyphens
  return title.toLowerCase().replace(/\s+/g, '-');
}

const LabeledParameter = ({label, hotkey, children}) => {
  const id = titleToHyphenated(label);
  const childWithId = React.isValidElement(children)
    ? React.cloneElement(children, { id })
    : children;
  return (
    <div className="crsb fw parameter">
      <label htmlFor={id}>{label}{hotkey && <span className="color-key" style={{marginLeft: '0.35em'}}>{hotkey}</span>}</label>
      {childWithId}
    </div>
  )
}

const ParameterSlider = ({ id, label, value, setValue, minValue, maxValue, stepValue, parser=parseFloat}) => {

  const handleChange = (e) => {setValue(parser(e.target.value));};

  return (
      <input
        id={id}
        type="range"
        value={value}
        min={minValue} // Adjust min and max values as needed
        max={maxValue}
        step={stepValue}
        onChange={handleChange}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        aria-valuenow={value}
        aria-label={`${label}: ${value}`}
      />

  );
};

export { LabeledParameter, ParameterSlider }; // Export as named export

