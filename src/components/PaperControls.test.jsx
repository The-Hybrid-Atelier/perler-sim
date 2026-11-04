import { fireEvent, render, screen } from '@testing-library/react';
import { PaperControls } from './PaperControls';
import { defaultBeadParameters } from '../AppConfig';
import paper from 'paper';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('paper', () => ({ project: { clear: jest.fn() } }));

test('confirmation delegates clearing to workspace initialization instead of deleting the project', async () => {
  const onClearDesign = jest.fn();
  render(<PaperControls beadParameters={defaultBeadParameters} onClearDesign={onClearDesign} />);
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Keep It' }));
  expect(onClearDesign).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Nuke It' }));
  expect(onClearDesign).toHaveBeenCalledTimes(1);
  expect(paper.project.clear).not.toHaveBeenCalled();
});
