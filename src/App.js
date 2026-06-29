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

function UserSession({ user, onLogout }) {
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
    setPaperReady(false);
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
          <UserSession user={currentUser} onLogout={logout} />
          <Menus
              paper={paperReady}
              beadParameters={beadParameters}
              setBeadParameters={setBeadParameters}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              gridVisible={gridVisible}  
              setGridVisible={setGridVisible}
            />
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
      {isAuthenticated && appScreen === "paper" &&
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
