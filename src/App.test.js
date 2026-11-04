import { render, screen } from '@testing-library/react';
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
