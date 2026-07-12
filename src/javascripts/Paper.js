let paper = require('paper');
let FileSaver = require('file-saver');

const setTool = (interaction) => {
  const tool = paper.tools.find(tool => tool.name === interaction);
  if (tool) {
    tool.activate();
  } else {
    console.error(`Tool with name ${interaction} not found.`);
  }
};

function setupPaper(canvasRef) {
  // explicitly set the attr width/height
  canvasRef.current.height = canvasRef.current.parentElement.height;
  canvasRef.current.width = canvasRef.current.parentElement.width;
  paper.setup(canvasRef.current);
  paper.view.zoom = 1;
  return paper;
}

// Translate to readable color name
const getColorName = (color) => {
  const colorNames = {
    "black": "Black",
    "red": "Red",    
    "blue": "Blue",   
    "green": "Green",  
    "yellow": "Yellow" 
  };

  // Convert color to lowercase for consistent comparison
  const lowercaseColor = color.toLowerCase();

  // Check if the color exists in colorNames, return "Unknown" if not found
  return colorNames[lowercaseColor] || "thisiswrong";
};


function exportSVG() {
  let prev = paper.view.zoom;
  paper.view.zoom = 1;
  paper.view.update();

  // Store grid lines and invisible beads
  const gridLines = paper.project.getItems({ name: "gridLine" });
  const invisibleBeads = paper.project.getItems({ name: "bead", visible: false });

  // Remove grid lines and invisible beads
  gridLines.forEach(line => line.remove());
  invisibleBeads.forEach(bead => bead.remove());

  // Get all visible beads and group them by color
  const visibleBeads = paper.project.getItems({ name: "bead", visible: true });
  const beadsByColor = {};

  visibleBeads.forEach(bead => {
    const color = bead.fillColor.toCSS();
    if (!beadsByColor[color]) {
      beadsByColor[color] = [];
    }
    beadsByColor[color].push(bead);
  });

  // Create a combined SVG string for all beads
  let combinedSVG = '';

  Object.keys(beadsByColor).forEach(color => {
    const beads = beadsByColor[color];

    // Create a new temp layer
    const tempLayer = new paper.Layer();

    // Add beads of the current color to the temp layer
    beads.forEach(bead => {
      tempLayer.addChild(bead.clone());
    });

    // Export SVG from temp layer
    combinedSVG += tempLayer.exportSVG({ asString: true, precision: 5 });

    // Remove temp layer
    tempLayer.remove();
  });

  // Restore grid lines and invisible beads
  gridLines.forEach(line => paper.project.activeLayer.addChild(line));
  invisibleBeads.forEach(bead => paper.project.activeLayer.addChild(bead));

  // Reset zoom
  paper.view.zoom = prev;

  return combinedSVG;
}

export { setupPaper, exportSVG, setTool , getColorName };