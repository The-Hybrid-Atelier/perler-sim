const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const neo4j = require('neo4j-driver');

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
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const GITHUB_ORG = process.env.GITHUB_ADMIN_ORG || 'The-Hybrid-Atelier';
const APP_NAME = process.env.APP_NAME || 'perler-sim';
const SESSION_COOKIE = 'perler_session';
const STATE_COOKIE = 'github_oauth_state';
const sessions = new Map();
const accessLog = [];
const neo4jConfig = {
  uri: process.env.NEO4J_URI,
  user: process.env.NEO4J_USER || process.env.NEO4J_USERNAME,
  password: process.env.NEO4J_PASSWORD,
  database: process.env.NEO4J_DATABASE || 'neo4j',
};
const neo4jDriver = neo4jConfig.uri && neo4jConfig.user && neo4jConfig.password
  ? neo4j.driver(neo4jConfig.uri, neo4j.auth.basic(neo4jConfig.user, neo4jConfig.password))
  : null;

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

const runNeo4j = async (query, params = {}, mode = 'WRITE') => {
  if (!neo4jDriver) {
    return null;
  }

  const session = neo4jDriver.session({
    database: neo4jConfig.database,
    defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE,
  });

  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
};

const toNumber = (value) => {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }
  return value;
};

const getDayKey = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

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

const emptySeries = (days) => days.map(day => ({ day, value: 0 }));

const initNeo4j = async () => {
  if (!neo4jDriver) {
    console.warn('Neo4j is not configured. Dashboard metrics will use in-memory storage only.');
    return;
  }

  await runNeo4j('CREATE CONSTRAINT app_name IF NOT EXISTS FOR (a:App) REQUIRE a.name IS UNIQUE');
  await runNeo4j('CREATE CONSTRAINT github_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.githubId IS UNIQUE');
  await runNeo4j('CREATE CONSTRAINT app_session_id IF NOT EXISTS FOR (s:AppSession) REQUIRE s.sessionId IS UNIQUE');
  await runNeo4j('CREATE CONSTRAINT download_id IF NOT EXISTS FOR (d:Download) REQUIRE d.id IS UNIQUE');
  await runNeo4j('MERGE (:App {name: $appName})', { appName: APP_NAME });
  console.log(`Neo4j metrics enabled for ${neo4jConfig.uri}`);
};

initNeo4j().catch(error => {
  console.error('Neo4j initialization failed. Metrics will fall back to memory:', error.message);
});

const getSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  return sessions.get(cookies[SESSION_COOKIE]);
};

const getDurationMs = (entry) => {
  return (entry.logoutAt || entry.lastSeenAt || Date.now()) - entry.loginAt;
};

const touchSession = (session) => {
  const now = Date.now();
  session.lastSeenAt = now;
  if (session.accessEntry) {
    session.accessEntry.lastSeenAt = now;
  }
};

const defaultDownloads = () => ({
  svg: 0,
  stl: 0,
});

const createAccessEntry = ({ sessionId, user, loginAt, lastSeenAt, logoutAt = null }) => ({
  sessionId,
  user,
  loginAt,
  lastSeenAt,
  logoutAt,
  downloads: defaultDownloads(),
});

const trackDownload = (session, type) => {
  if (!session.accessEntry) {
    return;
  }

  if (!session.accessEntry.downloads) {
    session.accessEntry.downloads = defaultDownloads();
  }

  session.accessEntry.downloads[type] += 1;
};

const recordLogin = async (entry) => {
  accessLog.unshift(entry);

  try {
    await runNeo4j(`
      MERGE (app:App {name: $appName})
      MERGE (user:User {githubId: $githubId})
      SET user.login = $login,
          user.name = $name,
          user.email = $email,
          user.avatarUrl = $avatarUrl,
          user.profileUrl = $profileUrl,
          user.isAdmin = $isAdmin
      MERGE (session:AppSession {sessionId: $sessionId})
      SET session.loginAt = $loginAt,
          session.lastSeenAt = $lastSeenAt,
          session.logoutAt = null
      MERGE (user)-[:STARTED]->(session)
      MERGE (session)-[:IN_APP]->(app)
    `, {
      appName: APP_NAME,
      sessionId: entry.sessionId,
      githubId: String(entry.user.id),
      login: entry.user.login,
      name: entry.user.name,
      email: entry.user.email,
      avatarUrl: entry.user.avatarUrl,
      profileUrl: entry.user.profileUrl,
      isAdmin: entry.user.isAdmin,
      loginAt: entry.loginAt,
      lastSeenAt: entry.lastSeenAt,
    });
  } catch (error) {
    console.error('Unable to record login in Neo4j:', error.message);
  }
};

const recordSessionActivity = async (session) => {
  if (!session?.accessEntry) {
    return;
  }

  try {
    await runNeo4j(`
      MATCH (session:AppSession {sessionId: $sessionId})
      SET session.lastSeenAt = $lastSeenAt
    `, {
      sessionId: session.accessEntry.sessionId,
      lastSeenAt: session.lastSeenAt,
    });
  } catch (error) {
    console.error('Unable to update session activity in Neo4j:', error.message);
  }
};

const recordLogout = async (session) => {
  if (!session?.accessEntry) {
    return;
  }

  try {
    await runNeo4j(`
      MATCH (session:AppSession {sessionId: $sessionId})
      SET session.lastSeenAt = $lastSeenAt,
          session.logoutAt = $logoutAt
    `, {
      sessionId: session.accessEntry.sessionId,
      lastSeenAt: session.accessEntry.lastSeenAt,
      logoutAt: session.accessEntry.logoutAt,
    });
  } catch (error) {
    console.error('Unable to record logout in Neo4j:', error.message);
  }
};

const recordDownload = async (session, type, filename = null) => {
  trackDownload(session, type);

  if (!session?.accessEntry) {
    return;
  }

  try {
    await runNeo4j(`
      MATCH (session:AppSession {sessionId: $sessionId})
      CREATE (download:Download {
        id: $downloadId,
        type: $type,
        filename: $filename,
        createdAt: $createdAt
      })
      CREATE (session)-[:DOWNLOADED]->(download)
      SET session.lastSeenAt = $createdAt
    `, {
      sessionId: session.accessEntry.sessionId,
      downloadId: crypto.randomUUID(),
      type,
      filename,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error(`Unable to record ${type} download in Neo4j:`, error.message);
  }
};

const getAccessLogFromNeo4j = async () => {
  const result = await runNeo4j(`
    MATCH (user:User)-[:STARTED]->(session:AppSession)-[:IN_APP]->(:App {name: $appName})
    OPTIONAL MATCH (session)-[:DOWNLOADED]->(download:Download)
    WITH user, session,
      count(CASE WHEN download.type = 'svg' THEN 1 END) AS svgDownloads,
      count(CASE WHEN download.type = 'stl' THEN 1 END) AS stlDownloads
    RETURN user, session, svgDownloads, stlDownloads
    ORDER BY session.loginAt DESC
    LIMIT 200
  `, { appName: APP_NAME }, 'READ');

  if (!result) {
    return null;
  }

  return result.records.map(record => {
    const user = record.get('user').properties;
    const session = record.get('session').properties;
    return serializeAccessEntry({
      sessionId: session.sessionId,
      user: {
        id: user.githubId,
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        profileUrl: user.profileUrl,
        isAdmin: user.isAdmin,
      },
      loginAt: toNumber(session.loginAt),
      lastSeenAt: toNumber(session.lastSeenAt),
      logoutAt: session.logoutAt ? toNumber(session.logoutAt) : null,
      downloads: {
        svg: toNumber(record.get('svgDownloads')),
        stl: toNumber(record.get('stlDownloads')),
      },
    });
  });
};

const getMetricsFromMemory = () => {
  const days = getRecentDays();
  const activeUsersByDay = new Map(days.map(day => [day, new Set()]));
  const stlDownloadsByDay = new Map(days.map(day => [day, 0]));
  const now = Date.now();
  const currentActiveLogins = new Set();
  let totalStlDownloads = 0;

  accessLog.forEach(entry => {
    const loginDay = getDayKey(entry.loginAt);
    if (activeUsersByDay.has(loginDay)) {
      activeUsersByDay.get(loginDay).add(entry.user.login);
    }

    const stlCount = entry.downloads?.stl || 0;
    totalStlDownloads += stlCount;
    if (stlDownloadsByDay.has(loginDay)) {
      stlDownloadsByDay.set(loginDay, stlDownloadsByDay.get(loginDay) + stlCount);
    }

    if (!entry.logoutAt && now - entry.lastSeenAt < 15 * 60 * 1000) {
      currentActiveLogins.add(entry.user.login);
    }
  });

  return {
    activeUsersByDay: days.map(day => ({ day, value: activeUsersByDay.get(day).size })),
    stlDownloadsByDay: days.map(day => ({ day, value: stlDownloadsByDay.get(day) })),
    currentActiveUsers: currentActiveLogins.size,
    totalStlDownloads,
  };
};

const getMetricsFromNeo4j = async () => {
  const days = getRecentDays();
  const startTime = new Date(`${days[0]}T00:00:00.000Z`).getTime();
  const activeUsersByDay = new Map(days.map(day => [day, new Set()]));
  const stlDownloadsByDay = new Map(days.map(day => [day, 0]));

  const sessionResult = await runNeo4j(`
    MATCH (user:User)-[:STARTED]->(session:AppSession)-[:IN_APP]->(:App {name: $appName})
    WHERE session.loginAt >= $startTime
    RETURN user.login AS login, session.loginAt AS loginAt, session.lastSeenAt AS lastSeenAt, session.logoutAt AS logoutAt
  `, { appName: APP_NAME, startTime }, 'READ');

  const downloadResult = await runNeo4j(`
    MATCH (session:AppSession)-[:IN_APP]->(:App {name: $appName})
    MATCH (session)-[:DOWNLOADED]->(download:Download)
    WHERE download.type = 'stl' AND download.createdAt >= $startTime
    RETURN download.createdAt AS createdAt
  `, { appName: APP_NAME, startTime }, 'READ');

  if (!sessionResult || !downloadResult) {
    return null;
  }

  const now = Date.now();
  const currentActiveLogins = new Set();

  sessionResult.records.forEach(record => {
    const login = record.get('login');
    const day = getDayKey(toNumber(record.get('loginAt')));
    if (activeUsersByDay.has(day)) {
      activeUsersByDay.get(day).add(login);
    }

    const logoutAt = record.get('logoutAt') ? toNumber(record.get('logoutAt')) : null;
    const lastSeenAt = toNumber(record.get('lastSeenAt'));
    if (!logoutAt && now - lastSeenAt < 15 * 60 * 1000) {
      currentActiveLogins.add(login);
    }
  });

  downloadResult.records.forEach(record => {
    const day = getDayKey(toNumber(record.get('createdAt')));
    if (stlDownloadsByDay.has(day)) {
      stlDownloadsByDay.set(day, stlDownloadsByDay.get(day) + 1);
    }
  });

  const totalStlDownloads = downloadResult.records.length;

  return {
    activeUsersByDay: days.map(day => ({ day, value: activeUsersByDay.get(day).size })),
    stlDownloadsByDay: days.map(day => ({ day, value: stlDownloadsByDay.get(day) })),
    currentActiveUsers: currentActiveLogins.size,
    totalStlDownloads,
  };
};

const serializeAccessEntry = (entry) => ({
  sessionId: entry.sessionId,
  user: entry.user,
  loginAt: new Date(entry.loginAt).toISOString(),
  lastSeenAt: new Date(entry.lastSeenAt).toISOString(),
  logoutAt: entry.logoutAt ? new Date(entry.logoutAt).toISOString() : null,
  active: !entry.logoutAt,
  durationMs: getDurationMs(entry),
  downloads: entry.downloads || defaultDownloads(),
});

// Public editor exports may still record activity for an existing GitHub session.
const optionalSession = (req, res, next) => {
  const session = getSession(req);

  if (!session) {
    req.session = {};
    return next();
  }

  touchSession(session);
  recordSessionActivity(session);
  req.session = session;
  next();
};

const requireAdmin = (req, res, next) => {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  touchSession(session);
  recordSessionActivity(session);
  req.session = session;

  if (!req.session.user.isAdmin) {
    return res.status(403).json({ error: `Admin access requires membership in ${GITHUB_ORG}` });
  }

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
    const now = Date.now();
    const user = {
      id: userResponse.data.id,
      login: userResponse.data.login,
      name: userResponse.data.name,
      email,
      avatarUrl: userResponse.data.avatar_url,
      profileUrl: userResponse.data.html_url,
      isAdmin,
    };
    const accessEntry = createAccessEntry({
      sessionId,
      user,
      loginAt: now,
      lastSeenAt: now,
    });

    sessions.set(sessionId, {
      user,
      accessToken,
      createdAt: now,
      lastSeenAt: now,
      accessEntry,
    });
    await recordLogin(accessEntry);

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
    return res.json({ authenticated: false });
  }

  touchSession(session);
  res.json({
    authenticated: true,
    user: session.user,
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = sessions.get(cookies[SESSION_COOKIE]);
  if (session) {
    const now = Date.now();
    session.lastSeenAt = now;
    if (session.accessEntry) {
      session.accessEntry.lastSeenAt = now;
      session.accessEntry.logoutAt = now;
    }
    await recordLogout(session);
    sessions.delete(cookies[SESSION_COOKIE]);
  }

  clearCookie(res, SESSION_COOKIE);
  res.json({ authenticated: false });
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ user: req.session.user });
});

app.get('/api/admin/access-log', requireAdmin, async (req, res) => {
  if (!req.session.accessEntry) {
    const now = Date.now();
    req.session.accessEntry = createAccessEntry({
      sessionId: parseCookies(req.headers.cookie)[SESSION_COOKIE],
      user: req.session.user,
      loginAt: req.session.createdAt || now,
      lastSeenAt: now,
    });
    accessLog.unshift(req.session.accessEntry);
  }

  let neo4jEntries = null;
  try {
    neo4jEntries = await getAccessLogFromNeo4j();
  } catch (error) {
    console.error('Unable to read access log from Neo4j:', error.message);
  }

  res.json({
    entries: neo4jEntries || accessLog.map(serializeAccessEntry),
  });
});

app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
  let metrics = null;

  try {
    metrics = await getMetricsFromNeo4j();
  } catch (error) {
    console.error('Unable to read metrics from Neo4j:', error.message);
  }

  res.json(metrics || getMetricsFromMemory());
});

app.post('/api/downloads/svg', optionalSession, async (req, res) => {
  await recordDownload(req.session, 'svg', req.body?.filename || null);
  res.json({
    downloads: req.session.accessEntry?.downloads || defaultDownloads(),
  });
});

app.post('/convert-svg-to-stl', optionalSession, upload.single('svg'), (req, res) => {
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

        recordDownload(req.session, 'stl', req.file.originalname);

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

app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Serve React index.html for all other GET requests (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
