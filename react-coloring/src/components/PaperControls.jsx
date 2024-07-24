import React from 'react';
import { exportSVG, getColorName } from '../javascripts/Paper.js'; // Assuming getColorName is a function that returns color name based on color
import { Icon, Button, Modal } from 'semantic-ui-react';
import { createGrid } from '../interactions/DirectManipulation.jsx';
import paper from 'paper';
import axios from 'axios';
import FileSaver from 'file-saver';

const PaperControls = ({ gridSize, beadSpacing, selectedColor }) => {
  const trashInteraction = () => {
    paper.project.clear();
    createGrid(gridSize, beadSpacing);
  };

  const handleExportSTL = async () => {
    const svgString = exportSVG();
    console.log('Exported SVG:', svgString);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const formData = new FormData();
    formData.append('svg', blob, 'design.svg');
    FileSaver.saveAs(blob, 'design.svg');

    try {
      const response = await axios.post('https://super-enigma-r5v9x67qwvj3955-3001.app.github.dev/convert-svg-to-stl', formData, {
        responseType: 'blob',
      });
      console.log('STL file received:', response);  // Log when STL file is received
      FileSaver.saveAs(response.data, 'design.stl');
    } catch (error) {
      console.error('Error exporting STL:', error);
    }
  };

  const handleExportSVG = () => {
    console.log("Selected color:", selectedColor);  // Check selectedColor value
    const svgString = exportSVG();
    const color = selectedColor || 'black';
    const colorName = getColorName(color); 
    const filename = `${colorName}.svg`;
    console.log("Color name resolved:", colorName);  // Log the resolved color name
    console.log("Filename:", filename);  // Log the filename being used
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    FileSaver.saveAs(blob, filename);
  };
  

  return (
    <div>
      <Modal
        trigger={<Button icon><Icon name='trash' /></Button>}
        header='Are you sure you want to destroy your masterpiece?'
        content='This action cannot be undone.'
        actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: trashInteraction }]}
      />
      <Button icon onClick={handleExportSTL}>
        <Icon name='download' />
      </Button>
      {/* <Button icon onClick={handleExportSVG}>
        <Icon name='download' />
      </Button> */}
    </div>
  );
};

export { PaperControls };


























