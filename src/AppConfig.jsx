const START_TOOL = 'bucket';

// there are some more coloring pages in this folder
const DEFAULT_COLORING_PAGE = "/coloring_pages/mandala.svg";

const MY_NAME = "Student Name (AppConfig.jsx)";
const ACTIVE_PROBLEM = 1;
const BEAD_COLORS = ["#550527","#688e26","#faa613","#f44708","#1d4ed8"];
const BEAD_COLORS_NAMES = ['black', 'green', 'yellow', 'orange', 'blue'];

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

function getApiBaseUrl() {
  const host = window.location.hostname;
  const port = window.location.port;

  if (host.endsWith('.app.github.dev')) {
    return `https://${host.replace('-3000.', '-3001.')}`;
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://${host}:3001`;
  }

  if (port === '3000') {
    return `${window.location.protocol}//${host}:3001`;
  }

  // In production, assume same-origin
  return '';
}



export {defaultBeadParameters, getApiBaseUrl, BEAD_COLORS_NAMES, START_TOOL, BEAD_COLORS, DEFAULT_COLORING_PAGE, MY_NAME, ACTIVE_PROBLEM};
