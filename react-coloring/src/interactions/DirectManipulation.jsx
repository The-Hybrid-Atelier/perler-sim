// DirectManipulation.jsx
import { useEffect } from 'react';
import Ruler from '../javascripts/ruler.js';


const convertBeadParameters = (parameters) => {
  return {...parameters, 
    outer_radius: Ruler.mm2pts(parameters.outer_radius), 
    inner_radius: Ruler.mm2pts(parameters.inner_radius), 
    beadSpacing: Ruler.mm2pts(parameters.beadSpacing)
  };
};

const createGrid = (paper, beadParameters) => {  
  const numCells = beadParameters.gridSize;
  const beadSpacing = beadParameters.beadSpacing;
  const cellSize = beadParameters.outer_radius * 2 + beadSpacing;
  const gridSize = cellSize * numCells;

  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const startPointX = centerX - (gridSize / 2);
  const startPointY = centerY - (gridSize / 2);
  const startPoint = new paper.Point(startPointX, startPointY);

  for (let i = 0; i <= numCells; i++) {
    console.log(". VERTICAL LINE", i);
    const y = startPoint.y + i * cellSize;
    const start = new paper.Point(startPoint.x, y);
    const end = new paper.Point(startPoint.x + gridSize, y);
    new paper.Path.Line({
      from: start,
      to: end,
      strokeColor: new paper.Color(0, 0, 0, 0.2),
      strokeWidth: .5,
      name: 'gridLine'
    });
  }

  for (let j = 0; j <= numCells; j++) {
    const x = startPoint.x + j * cellSize;
    const start = new paper.Point(x, startPoint.y);
    const end = new paper.Point(x, startPoint.y + gridSize);
    new paper.Path.Line({
      from: start,
      to: end,
      strokeColor: new paper.Color(0, 0, 0, 0.2),
      strokeWidth: .5,
      name: 'gridLine'
    });
  }

  for (let i = 0; i < numCells; i++) {
    for (let j = 0; j < numCells; j++) {
      const cellCenterX = startPointX + (i * cellSize) + (cellSize / 2);
      const cellCenterY = startPointY + (j * cellSize) + (cellSize / 2);
      const bead = createPerlerBead(paper, new paper.Point(cellCenterX, cellCenterY), beadParameters);
      bead.visible = true;
      bead.name = 'bead';
    }
  }
};

const createCircularGrid = (paper, beadParameters) => {
  const numCells = beadParameters.gridSize;
  const beadSpacing = beadParameters.beadSpacing;
  const cellSize = beadParameters.outer_radius * 2 + beadSpacing;
  const gridSize = cellSize * numCells;

  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const centerPoint = new paper.Point(centerX, centerY);

  for (let radius = cellSize; radius < gridSize; radius += cellSize) {
    const numBeads = Math.floor(2 * Math.PI * radius / cellSize);
    for (let i = 0; i < numBeads; i++) {
      const angle = (i * 360) / numBeads;
      const beadCenter = centerPoint.add(new paper.Point({
        length: radius,
        angle: angle
      }));
      const bead = createPerlerBead(paper, beadCenter, beadParameters);
      bead.visible = true;
      bead.name = 'bead';
    }
  }
  for (let radius = cellSize/2; radius < gridSize; radius += cellSize) {
    new paper.Path.Circle({
      center: centerPoint,
      radius: radius,
      strokeColor: new paper.Color(0, 0, 0, 0.2),
      strokeWidth: .5,
      name: 'gridLine'
    });
  }

  const centerBead = createPerlerBead(paper, centerPoint, beadParameters);
  centerBead.visible = true;
  centerBead.name = 'bead';
};


const createHexagonalGrid = (paper, beadParameters) => {
  const numCells = beadParameters.gridSize;
  const beadSpacing = beadParameters.beadSpacing;
  const cellSize = beadParameters.outer_radius * 2 + beadSpacing;
  const gridSize = cellSize * numCells;

  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const hexRadius = gridSize / 2;

  const isPointInHexagon = (point, radius) => {
    const dx = Math.abs(point.x - centerX);
    const dy = Math.abs(point.y - centerY);
    if (dx > radius * Math.sqrt(3) / 2 || dy > radius) return false;
    return radius * Math.sqrt(3) / 2 - dx / 2 >= dy;
  };

  for (let q = -numCells; q <= numCells; q++) {
    for (let r = -numCells; r <= numCells; r++) {
      const x = centerX + (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r) * (cellSize / 2);
      const y = centerY + (3 / 2 * r) * (cellSize / 2);
      const point = new paper.Point(x, y);
      if (isPointInHexagon(point, hexRadius)) {
        const hex = new paper.Path.RegularPolygon(point, 6, beadParameters.outer_radius + beadSpacing / 2);
        hex.strokeColor = new paper.Color(0, 0, 0, 0.2);
        hex.strokeWidth = .5;
        hex.name = 'gridLine';
        const bead = createPerlerBead(paper, point, beadParameters);
        bead.visible = true;
        bead.name = 'bead';
      }
    }
  }
};

const createPerlerBead = (paper, point, beadParameters) => {

  const outerCircle = new paper.Path.Circle({
    center: point,
    radius: beadParameters.outer_radius,
    fillColor: beadParameters.fillColor
  });

  const innerCircle = new paper.Path.Circle({
    center: point,
    radius: beadParameters.inner_radius,
    fillColor: beadParameters.fillColor
  });

  const bead = outerCircle.subtract(innerCircle);

  outerCircle.remove();
  innerCircle.remove();

  return bead;
};

const changeNearestBeadColor = (paper, clickPoint, color) => {
  let nearestBead = null;
  let minDistance = Number.MAX_VALUE;

  paper.project.activeLayer.children.forEach(item => {
    if (item.name === "bead") {
      const distance = item.position.getDistance(clickPoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBead = item;
      }
    }
  });

  if (nearestBead) {
    if (nearestBead.visible) {
      nearestBead.visible = false;
    } else {
      nearestBead.fillColor = color;
      nearestBead.visible = true;
    }
  }
};

const generalMouseFunctions = (paper, selectedColor) => {
  paper.view.onClick = function(event) {
    changeNearestBeadColor(paper, event.point, selectedColor);
  };
};

const DirectManipulation = ({ paper, paperReady, selectedColor, beadParametersMM, gridVisible }) => {
  useEffect(() => {
    if (paperReady && beadParametersMM) {
      console.log("Loading FuseBlock")
      const paper = paperReady;
      paper.project.clear();
      paper.view.zoom = 10;
      
      const beadParameters = convertBeadParameters(beadParametersMM);
      const createGridType = beadParameters.createGridType;
      
      switch (createGridType) {
        case 'circular':
          createCircularGrid(paper, beadParameters);
          break;
        case 'hexagonal':
          createHexagonalGrid(paper, beadParameters);
          break;
        case 'grid':
          console.log("GRID", beadParameters);
          createGrid(paper, beadParameters);
          break;
        default:
          console.log("DEFAULT", beadParameters);
          createGrid(paper, beadParameters);
          break;
      }
    }
  }, [paperReady, beadParametersMM]);

  useEffect(() => {
    if (paperReady) {
      generalMouseFunctions(paperReady, selectedColor);
    }
  }, [paperReady, selectedColor]);

  useEffect(() => {
    if (paperReady) {
      const paper = paperReady;
      paper.project.activeLayer.children.forEach(item => {
        if (item.name === "gridLine") {
          item.opacity = gridVisible;
        }
      });
    }
  }, [paperReady, gridVisible])

  return null;
};

export { DirectManipulation, createGrid, createCircularGrid, createHexagonalGrid };




