import { fireEvent, render, screen } from '@testing-library/react';
import paper from 'paper';
import { Menus } from './Menus';

jest.mock('paper', () => {
  const tools = [];
  return {
    tools,
    Tool: function (options = {}) {
      Object.assign(this, options);
      this.activate = jest.fn();
      tools.push(this);
    },
    project: { getItems: jest.fn() },
    Path: function () {
      this.simplify = jest.fn();
      this.add = jest.fn();
      this.intersects = () => true;
      this.remove = jest.fn();
    },
  };
});
jest.mock('react-draggable', () => ({ children }) => <>{children}</>);
jest.mock('./PaperControls.jsx', () => ({
  PaperControls: ({ onClearDesign }) => <button onClick={onClearDesign}>Clear Design</button>,
}));
jest.mock('./ZoomControls.jsx', () => ({ ZoomControls: () => null }));

const shiftDown = (options = {}) => fireEvent.keyDown(window, { key: 'Shift', code: 'ShiftLeft', ...options });
const shiftUp = (options = {}) => fireEvent.keyUp(window, { key: 'Shift', code: 'ShiftLeft', ...options });
const eraseButton = () => screen.getByRole('button', { name: 'Erase' });
const expectErase = (active) => {
  expect(eraseButton()).toHaveAttribute('aria-pressed', String(active));
  if (active) expect(eraseButton()).toHaveClass('green');
  else expect(eraseButton()).not.toHaveClass('green');
};

beforeEach(() => {
  paper.tools.length = 0;
  paper.project.getItems.mockReset();
});

function renderMenus(onClearDesign = jest.fn()) {
  const setSelectedColor = jest.fn();
  render(<Menus paper={paper} beadParameters={{ gridSize: 5, beadSpacing: 0.5,
    thickness: 0.79, outer_radius: 2.25, beadHeight: 5.2, createGridType: 'square' }}
    setBeadParameters={jest.fn()} selectedColor='red' setSelectedColor={setSelectedColor}
    gridVisible={true} setGridVisible={jest.fn()} onClearDesign={onClearDesign} />);
  return { setSelectedColor };
}

test('shows the native Shift shortcut and toggles persistent erase', () => {
  renderMenus();
  expect(screen.getByText('Shift')).toHaveClass('color-key');
  expectErase(false);
  fireEvent.click(eraseButton());
  expectErase(true);
  fireEvent.click(eraseButton());
  expectErase(false);
});

test.each([false, true])('Shift release restores mouse toggle %s without repeat toggling', (toggled) => {
  renderMenus();
  if (toggled) fireEvent.click(eraseButton());
  shiftDown();
  expectErase(true);
  shiftDown({ repeat: true });
  expectErase(true);
  shiftUp();
  expectErase(toggled);
});

test('clicking while Shift is held changes only the persistent toggle', () => {
  renderMenus();
  shiftDown();
  fireEvent.click(eraseButton());
  shiftUp();
  expectErase(true);
  shiftDown();
  fireEvent.click(eraseButton());
  expectErase(true);
  shiftUp();
  expectErase(false);
});

test('tracks both Shift keys until both are released', () => {
  renderMenus();
  shiftDown();
  shiftDown({ code: 'ShiftRight' });
  shiftUp();
  expectErase(true);
  shiftUp({ code: 'ShiftRight' });
  expectErase(false);
});

test.each([false, true])('blur and focus changes reset temporary Shift but preserve toggle %s', (toggled) => {
  renderMenus();
  if (toggled) fireEvent.click(eraseButton());
  shiftDown();
  fireEvent.blur(window);
  expectErase(toggled);
  shiftDown();
  const slider = screen.getByRole('slider', { name: /Size:/ });
  fireEvent.focusIn(slider);
  expectErase(toggled);
  fireEvent.keyDown(slider, { key: 'Shift', code: 'ShiftLeft' });
  expectErase(toggled);
  fireEvent.keyUp(slider, { key: 'Shift', code: 'ShiftLeft' });
  expectErase(toggled);
});

test('hiding the tab clears temporary Shift', () => {
  renderMenus();
  shiftDown();
  const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expectErase(false);
  hidden.mockRestore();
});

test.each(['mouse', 'shift'])('%s uses existing bead and brush erase behavior without recreating tools', (input) => {
  renderMenus();
  const bead = { visible: true, fillColor: 'blue' };
  const beadTool = paper.tools.find(tool => tool.name === 'beadTool');
  const brushTool = paper.tools.find(tool => tool.name === 'brushTool');
  const event = { point: {}, modifiers: { shift: false } };
  if (input === 'mouse') fireEvent.click(eraseButton());
  else shiftDown();
  // Both activations reach the existing branches, even without Paper's Shift flag.
  beadTool.activeBead = bead;
  beadTool.onMouseUp(event);
  expect(bead.visible).toBe(false);
  expect(bead.fillColor).toBe('red');
  paper.project.getItems.mockImplementation(query => query.visible === undefined || query.visible === bead.visible ? [bead] : []);
  bead.visible = true;
  brushTool.onMouseDown(event);
  brushTool.onMouseDrag(event);
  expect(bead.visible).toBe(false);
  brushTool.onMouseUp(event);
  expect(paper.tools).toHaveLength(4);
  if (input === 'mouse') fireEvent.click(eraseButton());
  else shiftUp();
  beadTool.onMouseUp(event);
  expect(bead.visible).toBe(true);
  bead.visible = false;
  brushTool.onMouseDown(event);
  brushTool.onMouseDrag(event);
  expect(bead.visible).toBe(true);
});

test('preserves tool and color shortcuts with erase enabled', () => {
  const { setSelectedColor } = renderMenus();
  fireEvent.click(eraseButton());
  for (const [key, name] of [['b', 'brushTool'], ['m', 'fillTool'], ['p', 'beadTool']]) {
    fireEvent.keyDown(window, { key });
    expect(paper.tools.find(tool => tool.name === name).activate).toHaveBeenCalled();
    expectErase(true);
  }
  fireEvent.keyDown(window, { key: ' ' });
  expect(paper.tools.find(tool => tool.name === 'panTool').activate).toHaveBeenCalledTimes(1);
  fireEvent.keyUp(window, { key: ' ' });
  expect(paper.tools.find(tool => tool.name === 'beadTool').activate).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(window, { key: '1' });
  expect(setSelectedColor).toHaveBeenCalledTimes(1);
  expectErase(true);
});

test('passes the workspace reset callback to the controls', () => {
  const onClearDesign = jest.fn();
  renderMenus(onClearDesign);
  fireEvent.click(screen.getByRole('button', { name: 'Clear Design' }));
  expect(onClearDesign).toHaveBeenCalledTimes(1);
});
