const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const loadEnvFile = () => {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
  const envPath = path.join(__dirname, envFile);

  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
};

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const GITHUB_ORG = process.env.GITHUB_ADMIN_ORG || 'The-Hybrid-Atelier';
const SESSION_COOKIE = 'perler_session';
const STATE_COOKIE = 'github_oauth_state';
const sessions = new Map();

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

const upload = multer({ dest: os.tmpdir() });

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

const parseCookies = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
};

const cookieOptions = () => {
  const secure = process.env.NODE_ENV === 'production';
  return `HttpOnly; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
};

const setCookie = (res, name, value, maxAgeSeconds) => {
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; ${cookieOptions()}`);
};

const clearCookie = (res, name) => {
  res.append('Set-Cookie', `${name}=; Max-Age=0; ${cookieOptions()}`);
};

const getSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return sessions.get(cookies[SESSION_COOKIE]);
};

const requireAuth = (req, res, next) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.session = session;
  next();
};

const getGitHubEmail = async (accessToken, fallbackEmail) => {
  if (fallbackEmail) {
    return fallbackEmail;
  }

  const response = await axios.get('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const primaryEmail = response.data.find(email => email.primary) || response.data[0];
  return primaryEmail?.email || null;
};

const getGitHubOrgMembership = async (accessToken) => {
  try {
    const response = await axios.get(`https://api.github.com/user/memberships/orgs/${GITHUB_ORG}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return response.data?.state === 'active';
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

app.get('/auth/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).send('GitHub OAuth is not configured.');
  }

  const state = crypto.randomBytes(24).toString('hex');
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${SERVER_URL}/auth/github/callback`,
    scope: 'read:user user:email read:org',
    state,
  });

  setCookie(res, STATE_COOKIE, state, 600);
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);

  if (!req.query.state || req.query.state !== cookies[STATE_COOKIE]) {
    clearCookie(res, STATE_COOKIE);
    return res.redirect(`${CLIENT_URL}/?auth=invalid_state`);
  }

  if (!req.query.code) {
    clearCookie(res, STATE_COOKIE);
    return res.redirect(`${CLIENT_URL}/?auth=missing_code`);
  }

  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: req.query.code,
      redirect_uri: `${SERVER_URL}/auth/github/callback`,
    }, {
      headers: { Accept: 'application/json' },
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      clearCookie(res, STATE_COOKIE);
      return res.redirect(`${CLIENT_URL}/?auth=token_failed`);
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const email = await getGitHubEmail(accessToken, userResponse.data.email);
    const isAdmin = await getGitHubOrgMembership(accessToken);
    const sessionId = crypto.randomBytes(32).toString('hex');
    const user = {
      id: userResponse.data.id,
      login: userResponse.data.login,
      name: userResponse.data.name,
      email,
      avatarUrl: userResponse.data.avatar_url,
      profileUrl: userResponse.data.html_url,
      isAdmin,
    };

    sessions.set(sessionId, {
      user,
      accessToken,
      createdAt: Date.now(),
    });

    clearCookie(res, STATE_COOKIE);
    setCookie(res, SESSION_COOKIE, sessionId, 60 * 60 * 24 * 7);
    res.redirect(CLIENT_URL);
  } catch (error) {
    console.error('GitHub OAuth callback failed:', error.response?.data || error.message);
    clearCookie(res, STATE_COOKIE);
    res.redirect(`${CLIENT_URL}/?auth=callback_failed`);
  }
});

app.get('/api/auth/session', (req, res) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: session.user,
  });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE]) {
    sessions.delete(cookies[SESSION_COOKIE]);
  }

  clearCookie(res, SESSION_COOKIE);
  res.json({ authenticated: false });
});

app.get('/api/admin/session', (req, res) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!session.user.isAdmin) {
    return res.status(403).json({ error: `Admin access requires membership in ${GITHUB_ORG}` });
  }

  res.json({ user: session.user });
});

app.post('/convert-svg-to-stl', requireAuth, upload.single('svg'), (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).send('Uploaded file is empty');
  }

  const { beadHeight } = req.body;
  if (!beadHeight || isNaN(beadHeight)) {
    return res.status(400).send('Invalid bead height');
  }

  const svgFilePath = `${req.file.path}.svg`;
  const stlFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.stl`);
  const scadFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.scad`);

  const scadContent = `
  $fn = 100;
  Beads_Height = ${beadHeight};
  module perler_bead(){
    linear_extrude(height = Beads_Height, center = true)
      import("${svgFilePath}", scale=10);
  }
  perler_bead();
  `;

  try {
    fs.writeFileSync(scadFilePath, scadContent);
  } catch (error) {
    return res.status(500).send('Error writing SCAD file');
  }

  fs.rename(req.file.path, svgFilePath, (err) => {
    if (err) return res.status(500).send('Error renaming SVG file');

    exec(`openscad -o ${stlFilePath} ${scadFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`OpenSCAD command failed: ${error.message}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).send('Error converting SVG to STL');
      }

      res.download(stlFilePath, (err) => {
        if (err) return res.status(500).send('Error sending STL file');

        try {
          fs.unlinkSync(svgFilePath);
          fs.unlinkSync(stlFilePath);
          fs.unlinkSync(scadFilePath);
        } catch (unlinkError) {
          console.error('Error cleaning up files:', unlinkError);
        }
      });
    });
  });
});

// Serve React index.html for all other GET requests (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
