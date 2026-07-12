import React from 'react';
import { Icon, Button, Modal, Dropdown } from 'semantic-ui-react';
import paper from 'paper';
import axios from 'axios';
import FileSaver from 'file-saver';
import { BEAD_COLORS, BEAD_COLORS_NAMES, getApiBaseUrl} from '../AppConfig.jsx';

const exportSVG = () => {
  return paper.project.exportSVG({ asString: true });
};

const trackSVGDownload = async (filename) => {
  const apiBase = getApiBaseUrl();
  try {
    await axios.post(`${apiBase}/api/downloads/svg`, { filename }, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error tracking SVG download:', error);
  }
};

const PaperControls = ({  selectedColor, version, projectName, beadParameters }) => {
  const trashInteraction = () => {
    paper.project.clear();
  };

  const handleExportSTL = async () => {
    const prevZoom = paper.view.zoom;
    paper.view.zoom = 1;

    for (let colorIndex = 0; colorIndex < BEAD_COLORS.length; colorIndex++) {
        const color = BEAD_COLORS[colorIndex];
        const colorName = BEAD_COLORS_NAMES[colorIndex];

        // Filter beads by color and visibility
        const beadsToRemove = paper.project.getItems({
            name: 'bead',
            match: function (item) {
                return item.visible === false || (item.fillColor && item.fillColor.toCSS(true) !== color);
            },
        });

        // Filter out GridLines
        const gridLinesToRemove = paper.project.getItems({
            name: 'gridLine',
        });

        beadsToRemove.forEach(bead => bead.remove());
        gridLinesToRemove.forEach(gridLine => gridLine.remove());

        const svgString = exportSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const formData = new FormData();
        formData.append('svg', blob, `design_${colorName}.svg`);
        formData.append('beadHeight', beadParameters.beadHeight);

        // Generate the filename based on project name, color, and version
        const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${colorName}_${version}.stl`;

        try {
          const apiBase = getApiBaseUrl();

          const response = await axios.post(`${apiBase}/convert-svg-to-stl`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
            withCredentials: true,
          });
        
          FileSaver.saveAs(response.data, filename);
        } catch (error) {
            console.error(`Error exporting STL for color ${colorName}:`, error);
        }

        // Add back the removed beads and gridLines
        beadsToRemove.forEach(bead => paper.project.activeLayer.addChild(bead));
        gridLinesToRemove.forEach(gridLine => paper.project.activeLayer.addChild(gridLine));
    }

    paper.view.zoom = prevZoom;
};

  const handleExportSVG = async (selectedColor) => {
    const prevZoom = paper.view.zoom;
    paper.view.zoom = 1;
    const colorIndex = BEAD_COLORS.findIndex(element => element === selectedColor);
    const colorName = BEAD_COLORS_NAMES[colorIndex];
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${colorName}_${version}.svg`;

    var beadsToRemove = paper.project.getItems({
      name: 'bead',
      match: function(item) {
        return item.visible === false || (item.fillColor && item.fillColor.toCSS(true) !== selectedColor);      }
    });

     // Filter out GridLines
     const gridLinesToRemove = paper.project.getItems({
      name: 'gridLine',
    });

    beadsToRemove.forEach(bead => bead.remove());
    gridLinesToRemove.forEach(gridLine => gridLine.remove());

    const svgString = exportSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    await trackSVGDownload(filename);
    FileSaver.saveAs(blob, filename);

    beadsToRemove.forEach(bead => paper.project.activeLayer.addChild(bead));
    gridLinesToRemove.forEach(gridLine => paper.project.activeLayer.addChild(gridLine));

    paper.view.zoom = prevZoom;
  };
  

  return (
    <div>
      <Modal
        trigger={<Button className='restart-button' color='red' icon><Icon name='trash' />Restart</Button>}
        header='Are you sure you want to destroy your masterpiece?'
        content='This action cannot be undone.'
        actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: trashInteraction }]}
      />
      <Dropdown text='Export' icon='download' floating labeled button className='icon'>
        <Dropdown.Menu>
          <Dropdown.Item icon='cube' text='STL' onClick={() => handleExportSTL(selectedColor)} />
          <Dropdown.Item icon='file outline' text='SVG' onClick={() => handleExportSVG(selectedColor)} />
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export { PaperControls };
