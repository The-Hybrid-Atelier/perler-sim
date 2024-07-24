import React, { useState, useEffect } from 'react';
import { ZoomControls } from './ZoomControls.jsx';
import { PaperControls } from './PaperControls.jsx';
import { Button } from 'semantic-ui-react';
import { DirectManipulation, createGrid, createCircularGrid, createHexagonalGrid } from '../interactions/DirectManipulation.jsx';
import GridSizeSlider from './GridSizeSlider';
import '../PaperToolBar.css';
import { fillTool } from '../interactions/FillTool.jsx';
import BeadSpacingSlider from './BeadSpacingSlider.jsx';
import { LuPaintBucket } from "react-icons/lu";
import Ruler from '../javascripts/ruler.js';
import paper from 'paper';
import { MdGridOff } from "react-icons/md";
import { FaRegSquare, FaRegCircle } from "react-icons/fa"; 
import { FiHexagon } from "react-icons/fi";
import BeadWidthSlider from "./BeadWidthSlider.jsx"; // Correct import

const defaultBeadParameters = {
  name: "bead",
  outer_radius: Ruler.mm2pts((4.5 / 2) / 2.5),
  inner_radius: Ruler.mm2pts((2.8 / 2) / 2.5),
  fillColor: 'black',
  strokeColor: 'black',
  strokeWidth: 0,
  selectionStrokeWidth: 1
};

const ColorPicker = ({ selectedColor, setSelectedColor }) => {
  const colors = ['black', 'red', 'blue', 'green', 'yellow'];

  return (
    <div>
      {colors.map(color => (
        <button
          key={color}
          style={{ backgroundColor: color, width: 30, height: 30, margin: 5 }}
          onClick={() => setSelectedColor(color)}
        />
      ))}
    </div>
  );
};

function PaperToolBar({ name, paperReady }) {
  const [gridSize, setGridSize] = useState(5);
  const [beadSpacing, setBeadSpacing] = useState(0.5);
  const [beadParameters, setBeadParameters] = useState(defaultBeadParameters);
  const [selectedColor, setSelectedColor] = useState('black');
  const [gridVisible, setGridVisible] = useState(true);
  const [createGridType, setCreateGridType] = useState('square');

  useEffect(() => {
    if (paper.project && paper.view) {
      paper.project.clear();
      paper.view.zoom = 4;
      if (createGridType === 'circular') {
        createCircularGrid(gridSize, beadSpacing, beadParameters);
      } else if (createGridType === 'hexagonal') {
        createHexagonalGrid(gridSize, beadSpacing, beadParameters);
      } else {
        createGrid(gridSize, beadSpacing, beadParameters);
      }
    }
  }, [gridSize, paperReady, beadSpacing, beadParameters, createGridType]);

  const activateFillTool = () => {
    fillTool(selectedColor);
  };

  const toggleGridVisibility = () => {
    paper.project.activeLayer.children.forEach(item => {
      if (item.name === 'gridLine') {
        item.visible = !gridVisible;
      }
    });
    setGridVisible(!gridVisible);
  };

  const createCircularGridButton = () => {
    setCreateGridType('circular');
  };

  const createSquareGridButton = () => {
    setCreateGridType('square');
  };

  const createHexagonalGridButton = () => {
    setCreateGridType('hexagonal');
  };

  return (
    <div className='paper-toolbar-container'>
      <div className='paper-toolbar fw'>
        <h1>{name}</h1>

        <GridSizeSlider gridSize={gridSize} setGridSize={setGridSize} />
        <BeadSpacingSlider beadSpacing={beadSpacing} setBeadSpacing={setBeadSpacing} />
        <BeadWidthSlider beadParameters={beadParameters} setBeadParameters={setBeadParameters} />
        <ColorPicker selectedColor={selectedColor} setSelectedColor={setSelectedColor} />

        <div className="button-group">
          <Button icon onClick={activateFillTool}><LuPaintBucket /></Button>
          <Button icon onClick={toggleGridVisibility}><MdGridOff /></Button>
          <Button icon onClick={createSquareGridButton}><FaRegSquare /></Button>
          <Button icon onClick={createCircularGridButton}><FaRegCircle /></Button>
          <Button icon onClick={createHexagonalGridButton}><FiHexagon /></Button> 
        </div>

        <ZoomControls />
        <PaperControls gridSize={gridSize} beadSpacing={beadSpacing} />
        <DirectManipulation
          paperReady={paperReady}
          selectedColor={selectedColor}
          gridSize={gridSize}
          beadSpacing={beadSpacing}
          beadParameters={beadParameters}
          createGridType={createGridType}
        />
      </div>
    </div>
  );
}

export { PaperToolBar };












