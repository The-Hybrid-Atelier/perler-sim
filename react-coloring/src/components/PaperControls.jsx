import React from 'react';
import { exportSVG, getColorName } from '../javascripts/Paper.js'; // Assuming getColorName is a function that returns color name based on color
import { Icon, Button, Modal, ButtonGroup } from 'semantic-ui-react';
import { createGrid } from '../interactions/DirectManipulation.jsx';
import paper from 'paper';
import axios from 'axios';
import FileSaver from 'file-saver';
import { BEAD_COLORS, BEAD_COLORS_NAMES } from '../AppConfig.jsx';

const PaperControls = ({  selectedColor, version, projectName }) => {
  const trashInteraction = () => {
    paper.project.clear();
  };

  const handleExportSTL = async () => {
    const svgString = exportSVG();
    // console.log('Exported SVG:', svgString);

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

  const handleExportSVG = (selectedColor) => {
    console.log("Selected color:", selectedColor, BEAD_COLORS);  // Check selectedColor value
    
    const colorIndex = BEAD_COLORS.findIndex(element => element === selectedColor);
    const colorName = BEAD_COLORS_NAMES[colorIndex];
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${colorName}_${version}.svg`;

    var beadsToRemove = paper.project.getItems({
      name: 'bead',
      match: function(item) {
        return item.fillColor && item.fillColor.toCSS(true) !== selectedColor;
      }
    });
    var beadsToKeep = paper.project.getItems({
      name: 'bead',
      match: function(item) {
        return item.fillColor && item.fillColor.toCSS(true) === selectedColor;
      }
    });
    beadsToRemove.forEach(bead => bead.remove());
    const svgString = exportSVG();
    console.log("Color name resolved:", colorName, selectedColor);  // Log the resolved color name
    console.log("Filename:", filename);  // Log the filename being used
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    FileSaver.saveAs(blob, filename);
    beadsToRemove.forEach(bead => paper.project.activeLayer.addChild(bead));
  };
  

  return (
    <div>
      <Modal
        trigger={<Button color='red' icon><Icon name='trash' />Restart</Button>}
        header='Are you sure you want to destroy your masterpiece?'
        content='This action cannot be undone.'
        actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: trashInteraction }]}
      />
      <ButtonGroup>
        <Button icon onClick={()=>handleExportSTL(selectedColor)}>
          <Icon name='download' />
          STL
        </Button>
        <Button icon onClick={()=>handleExportSVG(selectedColor)}>
          <Icon name='download' />
          SVG
        </Button>
      </ButtonGroup>
    </div>
  );
};

export { PaperControls };


























