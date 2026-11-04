import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./components/PaperCanvas.jsx', () => ({
  PaperCanvas: () => <div data-testid="paper-canvas" />,
}));
jest.mock('./components/Menus.jsx', () => ({ Menus: () => <div>Editor tools</div> }));
jest.mock('./components/View.jsx', () => ({ View: ({ children }) => <div>{children}</div> }));
jest.mock('./interactions/DirectManipulation.jsx', () => ({ DirectManipulation: () => null }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

test('opens the editor immediately without waiting for GitHub', () => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  render(<App />);
  expect(screen.getByTestId('paper-canvas')).toBeInTheDocument();
  expect(screen.getByText('Editor tools')).toBeInTheDocument();
  expect(screen.queryByText(/Continue with GitHub/i)).not.toBeInTheDocument();
});

test.each(['anonymous', 'unavailable'])('keeps the editor accessible when the session is %s', async (state) => {
  global.fetch = jest.fn(() => state === 'anonymous'
    ? Promise.resolve({ ok: true, json: async () => ({ authenticated: false }) })
    : Promise.reject(new Error('Server unavailable')));
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(screen.getByTestId('paper-canvas')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Dashboard/i })).not.toBeInTheDocument();
});
