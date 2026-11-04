import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { defaultBeadParameters } from './AppConfig';

jest.mock('./components/PaperCanvas.jsx', () => ({
  PaperCanvas: () => <div data-testid="paper-canvas" />,
}));
jest.mock('./components/Menus.jsx', () => ({ Menus: (props) => <div>
  Editor tools
  <output data-testid="workspace-config">{JSON.stringify({ parameters: props.beadParameters,
    color: props.selectedColor, gridVisible: props.gridVisible })}</output>
  <button onClick={() => {
    props.setBeadParameters({ ...props.beadParameters, gridSize: 9, createGridType: 'circular', beadHeight: 10 });
    props.setSelectedColor('blue');
    props.setGridVisible(false);
  }}>Modify workspace</button>
  <button onClick={props.onClearDesign}>Clear Design</button>
</div> }));
jest.mock('./components/View.jsx', () => ({ View: ({ children }) => <div>{children}</div> }));
jest.mock('./interactions/DirectManipulation.jsx', () => ({
  DirectManipulation: ({ resetVersion }) => <output data-testid="reset-version">{resetVersion}</output>,
}));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

test('keeps GitHub sign-in when main requires authentication', async () => {
  global.fetch = jest.fn(async () => ({
    ok: false,
    json: async () => ({ authenticated: false, authRequired: true }),
  }));
  render(<App />);
  expect(await screen.findByRole('button', { name: /Continue with GitHub/i })).toBeInTheDocument();
  expect(screen.queryByTestId('paper-canvas')).not.toBeInTheDocument();
});

test.each(['anonymous', 'unavailable'])('keeps the editor accessible when the session is %s', async (state) => {
  global.fetch = jest.fn(() => state === 'anonymous'
    ? Promise.resolve({ ok: false, json: async () => ({ authenticated: false, authRequired: false }) })
    : Promise.reject(new Error('Server unavailable')));
  render(<App />);
  expect(await screen.findByTestId('paper-canvas')).toBeInTheDocument();
  expect(screen.getByText('Editor tools')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Dashboard/i })).not.toBeInTheDocument();
});

test('Clear Design restores shared defaults and requests a fresh board on every click', async () => {
  global.fetch = jest.fn(async () => ({ json: async () => ({ authenticated: false }) }));
  render(<App />);
  await screen.findByTestId('workspace-config');
  fireEvent.click(screen.getByText('Modify workspace'));
  expect(JSON.parse(screen.getByTestId('workspace-config').textContent).parameters.gridSize).toBe(9);
  for (const version of [1, 2]) {
    fireEvent.click(screen.getByRole('button', { name: 'Clear Design' }));
    expect(JSON.parse(screen.getByTestId('workspace-config').textContent)).toEqual({
      parameters: defaultBeadParameters, color: defaultBeadParameters.fillColor, gridVisible: true,
    });
    expect(screen.getByTestId('reset-version')).toHaveTextContent(String(version));
    expect(screen.getByTestId('paper-canvas')).toBeInTheDocument();
  }
});
