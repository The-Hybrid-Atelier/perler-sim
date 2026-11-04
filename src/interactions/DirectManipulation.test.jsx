/** @jest-environment node */
import { render } from '@testing-library/react';
import paper from 'paper';
import { DirectManipulation } from './DirectManipulation';
import { defaultBeadParameters } from '../AppConfig';
import { beadTool } from './BeadTool';
import { lineTool } from './LineTool';
import { fillTool } from './FillTool';
import { panTool } from './PanTool';

// Import Paper before creating a DOM so its geometry runs without a canvas.
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
afterAll(() => dom.window.close());

beforeEach(() => paper.setup(new paper.Size(800, 600)));
afterEach(() => {
  paper.tools.slice().forEach(tool => tool.remove());
  paper.project.remove();
});

test('restores the initial board and discards saved design edits on repeated resets', () => {
  const props = { paperReady: paper, selectedColor: defaultBeadParameters.fillColor,
    beadParametersMM: { ...defaultBeadParameters }, gridVisible: true, resetVersion: 0 };
  const { rerender } = render(<DirectManipulation {...props} />);
  const snapshot = () => paper.project.getItems({}).map(item => ({ name: item.name,
    visible: item.visible, color: item.fillColor?.toCSS(true), opacity: item.opacity,
    bounds: item.bounds.toString() }));
  const initial = snapshot();
  const bead = paper.project.getItems({ name: 'bead' })[0];
  bead.visible = false;
  bead.fillColor = 'blue';
  rerender(<DirectManipulation {...props} beadParametersMM={{ ...defaultBeadParameters, gridSize: 7 }} />);
  paper.view.zoom = 3;
  paper.view.center = [700, 900];
  rerender(<DirectManipulation {...props} resetVersion={1} />);
  expect(snapshot()).toEqual(initial);
  expect(paper.view.zoom).toBe(10);
  expect(paper.view.center.equals(new paper.Point(400, 300))).toBe(true);
  rerender(<DirectManipulation {...props} resetVersion={2} />);
  expect(snapshot()).toEqual(initial);
});

test('clears cached edits across shape changes, removes extra items, and restores grid visibility', () => {
  const props = { paperReady: paper, selectedColor: defaultBeadParameters.fillColor,
    beadParametersMM: { ...defaultBeadParameters }, gridVisible: true, resetVersion: 0 };
  const { rerender } = render(<DirectManipulation {...props} />);
  const original = paper.project.getItems({ name: 'bead' }).map(bead => ({
    key: bead.data.gridKey, visible: bead.visible, color: bead.fillColor.toCSS(true),
  }));
  paper.project.getItems({ name: 'bead' }).forEach(bead => {
    bead.visible = !bead.visible;
    bead.fillColor = 'blue';
  });
  for (const createGridType of ['circular', 'hexagonal']) {
    rerender(<DirectManipulation {...props} gridVisible={false}
      beadParametersMM={{ ...defaultBeadParameters, createGridType }} />);
  }
  new paper.Path.Circle({ center: [0, 0], radius: 20, name: 'user-item' });
  rerender(<DirectManipulation {...props} resetVersion={1} />);
  expect(paper.project.getItems({ name: 'user-item' })).toHaveLength(0);
  expect(paper.project.getItems({ name: 'gridLine' }).every(line => line.opacity === 1)).toBe(true);
  // A later rebuild must not resurrect edits cached before clearing.
  rerender(<DirectManipulation {...props} resetVersion={1}
    beadParametersMM={{ ...defaultBeadParameters, beadSpacing: 1 }} />);
  expect(paper.project.getItems({ name: 'bead' }).map(bead => ({
    key: bead.data.gridKey, visible: bead.visible, color: bead.fillColor.toCSS(true),
  }))).toEqual(original);
});

test('resets in-progress tool references and allows immediate drawing after clearing', () => {
  const color = defaultBeadParameters.fillColor;
  const bead = beadTool(color);
  const brush = lineTool(color);
  const marquee = fillTool(color);
  const pan = panTool(color);
  bead.activate();
  const props = { paperReady: paper, selectedColor: color,
    beadParametersMM: { ...defaultBeadParameters }, gridVisible: true, resetVersion: 0 };
  const { rerender } = render(<DirectManipulation {...props} />);
  const point = new paper.Point(400, 300);
  bead.onMouseDown({ point });
  brush.onMouseDown({ point });
  marquee.onMouseDown({ point });
  marquee.onMouseDrag({ point: point.add([100, 100]) });
  pan.onMouseDown({ point });
  expect(bead.activeBead).not.toBeNull();
  expect(brush.path).toBeTruthy();
  expect(pan.lastPoint).not.toBeNull();
  rerender(<DirectManipulation {...props} resetVersion={1} />);
  expect(bead.activeBead).toBeNull();
  expect(brush.path).toBeNull();
  expect(pan.lastPoint).toBeNull();
  expect(paper.tool).toBe(bead);
  const interior = paper.project.getItems({ name: 'bead', visible: false })[0];
  const event = { point: interior.position, modifiers: { shift: false } };
  // Mouse-up from the discarded gesture must not change the fresh board.
  marquee.onMouseUp(event);
  expect(interior.visible).toBe(false);
  bead.onMouseDown(event);
  bead.onMouseUp(event);
  expect(interior.visible).toBe(true);
  expect(interior.fillColor.toCSS(true)).toBe(color);
});
