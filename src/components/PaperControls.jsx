import React, { useState } from 'react';
import { Icon, Button, Modal, Dropdown, Message } from 'semantic-ui-react';
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
  const [exportStatus, setExportStatus] = useState(null); // null | {type, message}

  const trashInteraction = () => {
    paper.project.clear();
  };

  const handleExportSTL = async () => {
    const prevZoom = paper.view.zoom;
    paper.view.zoom = 1;
    setExportStatus({ type: 'info', message: 'Generating STL…' });

    const failed = [];

    for (let colorIndex = 0; colorIndex < BEAD_COLORS.length; colorIndex++) {
        const color = BEAD_COLORS[colorIndex];
        const colorName = BEAD_COLORS_NAMES[colorIndex];

        const beadsToRemove = paper.project.getItems({
            name: 'bead',
            match: function (item) {
                return item.visible === false || (item.fillColor && item.fillColor.toCSS(true) !== color);
            },
        });
        const gridLinesToRemove = paper.project.getItems({ name: 'gridLine' });

        beadsToRemove.forEach(bead => bead.remove());
        gridLinesToRemove.forEach(gridLine => gridLine.remove());

        const svgString = exportSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const formData = new FormData();
        formData.append('svg', blob, `design_${colorName}.svg`);
        formData.append('beadHeight', beadParameters.beadHeight);

        const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${colorName}_${version}.stl`;

        setExportStatus({ type: 'info', message: `Generating STL for ${colorName}…` });

        try {
          const apiBase = getApiBaseUrl();
          const response = await axios.post(`${apiBase}/convert-svg-to-stl`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
            withCredentials: true,
          });
          FileSaver.saveAs(response.data, filename);
        } catch (error) {
          const detail = error.response
            ? `Server error ${error.response.status}`
            : 'Could not reach server — is it running?';
          failed.push(`${colorName}: ${detail}`);
        }

        beadsToRemove.forEach(bead => paper.project.activeLayer.addChild(bead));
        gridLinesToRemove.forEach(gridLine => paper.project.activeLayer.addChild(gridLine));
    }

    paper.view.zoom = prevZoom;

    if (failed.length) {
      setExportStatus({ type: 'error', message: `Export failed for: ${failed.join(', ')}` });
    } else {
      setExportStatus({ type: 'success', message: 'STL exported successfully.' });
      setTimeout(() => setExportStatus(null), 3000);
    }
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
  

  const exporting = exportStatus?.type === 'info';

  return (
    <div>
      <Modal
        trigger={<Button color='red' icon><Icon name='trash' />Restart</Button>}
        header='Are you sure you want to destroy your masterpiece?'
        content='This action cannot be undone.'
        actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: trashInteraction }]}
      />
      <Dropdown text='Export' icon='download' button className='icon' disabled={exporting}>
        <Dropdown.Menu>
          <Dropdown.Item icon='cube' text='STL' onClick={() => handleExportSTL(selectedColor)} />
          <Dropdown.Item icon='file outline' text='SVG' onClick={() => handleExportSVG(selectedColor)} />
        </Dropdown.Menu>
      </Dropdown>
      {exportStatus && (
        <Message
          size='mini'
          info={exportStatus.type === 'info'}
          success={exportStatus.type === 'success'}
          error={exportStatus.type === 'error'}
          content={exportStatus.message}
          style={{ marginTop: '0.5rem' }}
        />
      )}
    </div>
  );
};

export { PaperControls };
