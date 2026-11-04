import React, { useState, useEffect } from 'react';
import { Icon, Button, Modal, Message, Checkbox, Input, Form } from 'semantic-ui-react';
import paper from 'paper';
import axios from 'axios';
import FileSaver from 'file-saver';
import { BEAD_COLORS, BEAD_COLORS_NAMES, getApiBaseUrl } from '../AppConfig.jsx';

const STORAGE = {
  project: 'beadle_project_name',
  version: 'beadle_version',
  labels: 'beadle_color_labels',
};

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const exportSVG = () => paper.project.exportSVG({ asString: true });

const trackSVGDownload = async (filename) => {
  try {
    await axios.post(`${getApiBaseUrl()}/api/downloads/svg`, { filename }, { withCredentials: true });
  } catch (error) {
    console.error('Error tracking SVG download:', error);
  }
};

const PaperControls = ({ selectedColor, beadParameters, onClearDesign }) => {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportFormat, setExportFormat] = useState('svg');
  const [projectName, setProjectName] = useState(() => load(STORAGE.project, 'MyBeadProject'));
  const [version, setVersion] = useState(() => load(STORAGE.version, '1'));
  const [colorConfig, setColorConfig] = useState(() => {
    const savedLabels = load(STORAGE.labels, null);
    return BEAD_COLORS.map((color, i) => ({
      color,
      name: savedLabels?.[i] ?? BEAD_COLORS_NAMES[i],
      enabled: true,
    }));
  });

  useEffect(() => { localStorage.setItem(STORAGE.project, JSON.stringify(projectName)); }, [projectName]);
  useEffect(() => { localStorage.setItem(STORAGE.version, JSON.stringify(version)); }, [version]);
  useEffect(() => {
    localStorage.setItem(STORAGE.labels, JSON.stringify(colorConfig.map(c => c.name)));
  }, [colorConfig]);

  const updateConfig = (i, patch) =>
    setColorConfig(prev => prev.map((cfg, j) => j === i ? { ...cfg, ...patch } : cfg));

  const withColorFilter = async (cfg, fn) => {
    const beadsToRemove = paper.project.getItems({
      name: 'bead',
      match: item => item.visible === false || (item.fillColor && item.fillColor.toCSS(true) !== cfg.color),
    });
    const gridLinesToRemove = paper.project.getItems({ name: 'gridLine' });
    beadsToRemove.forEach(b => b.remove());
    gridLinesToRemove.forEach(g => g.remove());
    try {
      await fn();
    } finally {
      beadsToRemove.forEach(b => paper.project.activeLayer.addChild(b));
      gridLinesToRemove.forEach(g => paper.project.activeLayer.addChild(g));
    }
  };

  const handleExport = async () => {
    const toExport = colorConfig.filter(cfg => cfg.enabled);
    if (!toExport.length) {
      setExportStatus({ type: 'error', message: 'No colors selected.' });
      return;
    }

    const prevZoom = paper.view.zoom;
    paper.view.zoom = 1;

    if (exportFormat === 'stl') {
      const failed = [];
      for (const cfg of toExport) {
        setExportStatus({ type: 'info', message: `Generating STL for ${cfg.name}…` });
        await withColorFilter(cfg, async () => {
          const svgBlob = new Blob([exportSVG()], { type: 'image/svg+xml' });
          const formData = new FormData();
          formData.append('svg', svgBlob, `design_${cfg.name}.svg`);
          formData.append('beadHeight', beadParameters.beadHeight);
          const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${cfg.name}_${version}.stl`;
          try {
            const response = await axios.post(`${getApiBaseUrl()}/convert-svg-to-stl`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              responseType: 'blob',
              withCredentials: true,
            });
            FileSaver.saveAs(response.data, filename);
          } catch (error) {
            const detail = error.response
              ? `Server error ${error.response.status}`
              : 'Could not reach server — is it running?';
            failed.push(`${cfg.name}: ${detail}`);
          }
        });
      }
      paper.view.zoom = prevZoom;
      if (failed.length) {
        setExportStatus({ type: 'error', message: `Export failed for: ${failed.join(', ')}` });
      } else {
        setExportStatus({ type: 'success', message: 'STL exported successfully.' });
        setTimeout(() => setExportStatus(null), 3000);
      }
    } else {
      for (const cfg of toExport) {
        await withColorFilter(cfg, async () => {
          const blob = new Blob([exportSVG()], { type: 'image/svg+xml' });
          const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${cfg.name}_${version}.svg`;
          await trackSVGDownload(filename);
          FileSaver.saveAs(blob, filename);
        });
      }
      paper.view.zoom = prevZoom;
      setExportStatus({ type: 'success', message: 'SVG exported.' });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const exporting = exportStatus?.type === 'info';
  const baseName = projectName.toLowerCase().replace(/\s+/g, '_');

  return (
    <div>
      <Modal
        trigger={<Button className='restart-button' icon><Icon name='trash' />Restart</Button>}
        header='Are you sure you want to destroy your masterpiece?'
        content='This action cannot be undone.'
        actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: onClearDesign }]}
      />
      <Button icon onClick={() => { setExportStatus(null); setExportModalOpen(true); }} disabled={exporting}>
        <Icon name='download' />Export
      </Button>

      <Modal open={exportModalOpen} onClose={() => !exporting && setExportModalOpen(false)} size='tiny'>
        <Modal.Header>Export</Modal.Header>
        <Modal.Content>
          <Form style={{ marginBottom: '1rem' }}>
            <Form.Group widths='equal'>
              <Form.Field>
                <label>Project name</label>
                <Input value={projectName} onChange={(_, d) => setProjectName(d.value)} />
              </Form.Field>
              <Form.Field>
                <label>Version</label>
                <Input value={version} onChange={(_, d) => setVersion(d.value)} />
              </Form.Field>
            </Form.Group>
          </Form>

          <p style={{ marginBottom: '0.5rem' }}>Format:</p>
          <Button.Group style={{ marginBottom: '1rem' }}>
            <Button active={exportFormat === 'svg'} onClick={() => setExportFormat('svg')}><Icon name='file outline' />SVG</Button>
            <Button active={exportFormat === 'stl'} onClick={() => setExportFormat('stl')}><Icon name='cube' />STL</Button>
          </Button.Group>

          <p style={{ marginBottom: '0.5rem' }}>Colors:</p>
          {colorConfig.map((cfg, i) => (
            <div key={cfg.color} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
              <Checkbox checked={cfg.enabled} onChange={(_, d) => updateConfig(i, { enabled: d.checked })} />
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.color, border: '1px solid rgba(0,0,0,0.3)', flexShrink: 0 }} />
              <Input size='mini' value={cfg.name} onChange={(_, d) => updateConfig(i, { name: d.value })} style={{ flex: 1 }} />
            </div>
          ))}

          {colorConfig.some(cfg => cfg.enabled) && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#f8f9fa', borderRadius: 4, border: '1px solid #dee2e6' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a' }}>Files will be saved as:</p>
              {colorConfig.filter(cfg => cfg.enabled).map(cfg => (
                <code key={cfg.color} style={{ display: 'block', fontSize: '0.8rem', color: '#1a1a1a' }}>
                  {baseName}_{cfg.name}_{version}.{exportFormat}
                </code>
              ))}
            </div>
          )}

          {exportStatus && (
            <Message
              info={exportStatus.type === 'info'}
              success={exportStatus.type === 'success'}
              error={exportStatus.type === 'error'}
              content={exportStatus.message}
              style={{ marginTop: '0.75rem' }}
            />
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setExportModalOpen(false)} disabled={exporting}>Cancel</Button>
          <Button icon primary onClick={handleExport} disabled={exporting}>
            <Icon name={exportFormat === 'stl' ? 'cube' : 'file outline'} />
            Export {exportFormat.toUpperCase()}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
};

export { PaperControls };
