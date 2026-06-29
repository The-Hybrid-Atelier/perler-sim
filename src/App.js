import './App.css';
import 'semantic-ui-css/semantic.min.css';

import { DirectManipulation} from './interactions/DirectManipulation.jsx';
import { useEffect, useState } from 'react';
import {PaperCanvas} from './components/PaperCanvas.jsx';
import {View} from './components/View.jsx';
import { BEAD_COLORS, getApiBaseUrl} from './AppConfig.jsx';
import { Menus } from './components/Menus.jsx';

const START_SCREEN = "paper";
const defaultBeadParameters = {
  name: "bead",
  outer_radius: (4.5/2),
  inner_radius: ((4.5/2) - (0.79)),
  gridSize: 5,
  beadSpacing: 0.5,
  createGridType: 'square',
  fillColor: BEAD_COLORS[0],
  strokeColor: BEAD_COLORS[0],
  strokeWidth: 0,
  selectionStrokeWidth: 1,
  thickness: (0.79),
  beadHeight: 5.2
};

function LandingPage({ authError, onSignIn }) {
  return (
    <main id="main-content" className="landing-page" tabIndex="-1">
      <section className="landing-panel" aria-labelledby="landing-title">
        <h2 id="landing-title">Perler Bead Design Tool</h2>
        <p>Create bead layouts, export SVG files, and generate STL models.</p>
        {authError &&
          <p className="auth-error" role="alert">GitHub sign-in failed. Try again.</p>
        }
        <button className="github-sign-in" onClick={onSignIn}>
          Sign in with GitHub
        </button>
      </section>
    </main>
  );
}

const formatDuration = (durationMs) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Still active';
  }

  return new Date(value).toLocaleString();
};

const getDayKey = (value) => new Date(value).toISOString().slice(0, 10);

const getRecentDays = (dayCount = 14) => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = dayCount - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }

  return days;
};

const buildMetricsFromEntries = (entries) => {
  const days = getRecentDays();
  const activeUsersByDay = new Map(days.map(day => [day, new Set()]));
  const stlDownloadsByDay = new Map(days.map(day => [day, 0]));
  const activeUsers = new Set();
  const now = Date.now();
  let totalStlDownloads = 0;

  entries.forEach(entry => {
    const loginDay = getDayKey(entry.loginAt);
    if (activeUsersByDay.has(loginDay)) {
      activeUsersByDay.get(loginDay).add(entry.user.login);
    }

    const stlCount = entry.downloads?.stl || 0;
    totalStlDownloads += stlCount;
    if (stlDownloadsByDay.has(loginDay)) {
      stlDownloadsByDay.set(loginDay, stlDownloadsByDay.get(loginDay) + stlCount);
    }

    if (entry.active && now - new Date(entry.lastSeenAt).getTime() < 15 * 60 * 1000) {
      activeUsers.add(entry.user.login);
    }
  });

  return {
    activeUsersByDay: days.map(day => ({ day, value: activeUsersByDay.get(day).size })),
    stlDownloadsByDay: days.map(day => ({ day, value: stlDownloadsByDay.get(day) })),
    currentActiveUsers: activeUsers.size,
    totalStlDownloads,
  };
};

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarChart({ title, description, data }) {
  const maxValue = Math.max(...data.map(point => point.value), 1);

  return (
    <section className="chart-panel" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <div className="chart-heading">
        <h3 id={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="bar-chart" role="list">
        {data.map(point => {
          const height = `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 2)}%`;
          return (
            <div className="bar-column" role="listitem" key={point.day}>
              <span className="bar-value">{point.value}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ height }} />
              </div>
              <span className="bar-label">{new Date(`${point.day}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AdminDashboard({ apiBase, currentUser, onBack }) {
  const [entries, setEntries] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchJson = (path) => fetch(`${apiBase}${path}`, {
      credentials: 'include',
    })
      .then(response => {
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
          throw new Error(`Unable to load dashboard data (${response.status})`);
        }
        if (!contentType.includes('application/json')) {
          throw new Error(`Dashboard API returned ${contentType || 'non-JSON content'}`);
        }
        return response.json();
      });

    fetchJson('/api/admin/access-log')
      .then(accessLog => {
        const accessEntries = accessLog.entries || [];
        setEntries(accessEntries);
        setMetrics(buildMetricsFromEntries(accessEntries));
        setStatus('ready');

        return fetchJson('/api/admin/metrics')
          .then(dashboardMetrics => {
            setMetrics(dashboardMetrics);
          })
          .catch(error => {
            setErrorMessage(`${error.message}. Charts are estimated from the access log.`);
          });
      })
      .catch(error => {
        setErrorMessage(error.message);
        setEntries([{
          sessionId: 'current-session',
          user: currentUser,
          loginAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          logoutAt: null,
          active: true,
          durationMs: 0,
          downloads: {
            svg: 0,
            stl: 0,
          },
        }]);
        setMetrics({
          activeUsersByDay: [],
          stlDownloadsByDay: [],
          currentActiveUsers: 1,
          totalStlDownloads: 0,
        });
        setStatus('error');
      });
  }, [apiBase, currentUser]);

  return (
    <main id="main-content" className="admin-dashboard" tabIndex="-1">
      <div className="dashboard-header">
        <div>
          <h2>Admin dashboard</h2>
          <p>App access history for this server session.</p>
        </div>
        <button type="button" onClick={onBack}>Back to editor</button>
      </div>

      {status === 'loading' &&
        <p>Loading access history...</p>
      }

      {errorMessage &&
        <p className="dashboard-error" role="alert">
          {errorMessage}{status === 'error' ? '. Showing the active admin session only.' : ''}
        </p>
      }

      {metrics &&
        <>
          <section className="stats-grid" aria-label="Dashboard summary">
            <StatCard label="Active now" value={metrics.currentActiveUsers} />
            <StatCard label="STLs downloaded" value={metrics.totalStlDownloads} />
          </section>

          <div className="charts-grid">
            <BarChart
              title="Active users"
              description="Unique users who started a session each day."
              data={metrics.activeUsersByDay}
            />
            <BarChart
              title="STL downloads"
              description="STL files downloaded each day."
              data={metrics.stlDownloadsByDay}
            />
          </div>
        </>
      }

      {(status === 'ready' || status === 'error') &&
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <caption>GitHub users who accessed the app</caption>
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Signed in</th>
                <th scope="col">Last activity</th>
                <th scope="col">Signed out</th>
                <th scope="col">Duration</th>
                <th scope="col">SVG downloads</th>
                <th scope="col">STL downloads</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.sessionId}>
                  <td>
                    <div className="dashboard-user">
                      {entry.user.avatarUrl &&
                        <img src={entry.user.avatarUrl} alt="" />
                      }
                      <div>
                        <strong>{entry.user.name || entry.user.login}</strong>
                        <span>@{entry.user.login}</span>
                      </div>
                    </div>
                  </td>
                  <td>{entry.user.isAdmin ? 'Admin' : 'User'}</td>
                  <td>{formatDateTime(entry.loginAt)}</td>
                  <td>{formatDateTime(entry.lastSeenAt)}</td>
                  <td>{formatDateTime(entry.logoutAt)}</td>
                  <td>{entry.active ? `${formatDuration(entry.durationMs)} active` : formatDuration(entry.durationMs)}</td>
                  <td>{entry.downloads?.svg || 0}</td>
                  <td>{entry.downloads?.stl || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 &&
            <p>No access history yet.</p>
          }
        </div>
      }
    </main>
  );
}

function UserSession({ user, onLogout, onOpenDashboard }) {
  return (
    <div className="user-session" aria-label="Signed-in user">
      {user.avatarUrl &&
        <img src={user.avatarUrl} alt="" />
      }
      <div>
        <strong>{user.name || user.login}</strong>
        {user.isAdmin &&
          <span>THA admin</span>
        }
      </div>
      {user.isAdmin &&
        <button type="button" onClick={onOpenDashboard}>Dashboard</button>
      }
      <button type="button" onClick={onLogout}>Log out</button>
    </div>
  );
}

function App() {
  const [appScreen, setScreen] = useState(START_SCREEN);
  const [paperReady, setPaperReady] = useState(false);
  const [selectedColor, setSelectedColor] = useState(BEAD_COLORS[0]);
  const [beadParameters, setBeadParameters] = useState(defaultBeadParameters);
  const [gridVisible, setGridVisible] = useState(true);
  const [authStatus, setAuthStatus] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(false);
  const apiBase = getApiBaseUrl();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('auth')) {
      setAuthError(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetch(`${apiBase}/api/auth/session`, {
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('No active session');
        }
        return response.json();
      })
      .then(session => {
        setCurrentUser(session.user);
        setAuthStatus('authenticated');
      })
      .catch(() => {
        setCurrentUser(null);
        setAuthStatus('anonymous');
      });
  }, [apiBase]);

  const signInWithGitHub = () => {
    window.location.href = `${apiBase}/auth/github`;
  };

  const logout = async () => {
    await fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setCurrentUser(null);
    setAuthStatus('anonymous');
    setScreen(START_SCREEN);
    setPaperReady(false);
  };

  const openDashboard = () => {
    setPaperReady(false);
    setScreen('dashboard');
  };

  const backToEditor = () => {
    setPaperReady(false);
    setScreen(START_SCREEN);
  };

  const isAuthenticated = authStatus === 'authenticated';

  return (
    <div className="App">
      <header>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <h1 className="visually-hidden">Perler Bead Design Tool</h1>
      </header>
      {isAuthenticated &&
        <aside className="controls fh" aria-label="Design controls">
          <UserSession user={currentUser} onLogout={logout} onOpenDashboard={openDashboard} />
          {appScreen === START_SCREEN &&
            <Menus
                paper={paperReady}
                beadParameters={beadParameters}
                setBeadParameters={setBeadParameters}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                gridVisible={gridVisible}  
                setGridVisible={setGridVisible}
              />
          }
        </aside>
      }
      {authStatus === 'loading' &&
        <main id="main-content" className="landing-page" tabIndex="-1">
          <p>Checking GitHub sign-in...</p>
        </main>
      }
      {authStatus === 'anonymous' &&
        <LandingPage authError={authError} onSignIn={signInWithGitHub} />
      }
      {isAuthenticated && currentUser?.isAdmin && appScreen === "dashboard" &&
          <AdminDashboard apiBase={apiBase} currentUser={currentUser} onBack={backToEditor} />
      }
      {isAuthenticated && appScreen === START_SCREEN &&
          <main id="main-content" className="fw fh" tabIndex="-1">
            <View icon="" goToScreen="" screen={appScreen} setScreen={setScreen}>
              
              <DirectManipulation
                paperReady={paperReady}
                selectedColor={selectedColor}
                beadParametersMM={beadParameters}
                gridVisible={gridVisible}  
              />

              <PaperCanvas setPaperReady={setPaperReady}></PaperCanvas>
            </View>
          </main>
        }
    </div>
  );
}

export default App;
