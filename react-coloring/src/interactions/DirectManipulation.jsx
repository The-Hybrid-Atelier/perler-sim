// DirectManipulation.jsx
import React, { useEffect } from 'react';
import Ruler from '../javascripts/ruler.js';
import paper from 'paper';

const createGrid = (gridSize, beadSpacing, beadParameters) => {
  const cellSpacing = beadParameters.outer_radius * 2 + beadSpacing;
  const gridSizePts = Ruler.mm2pts(gridSize * 10);
  const numCells = Math.floor(gridSizePts / cellSpacing);
  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const startPointX = centerX - (numCells * cellSpacing) / 2;
  const startPointY = centerY - (numCells * cellSpacing) / 2;
  const startPoint = new paper.Point(startPointX, startPointY);

  for (let i = 0; i <= numCells; i++) {
    const y = startPoint.y + i * cellSpacing;
    const start = new paper.Point(startPoint.x, y);
    const end = new paper.Point(startPoint.x + numCells * cellSpacing, y);
    new paper.Path.Line({
      from: start,
      to: end,
      strokeColor: new paper.Color(0, 0, 0, 0.2),
      strokeWidth: .5,
      name: 'gridLine'
    });
  }

  for (let j = 0; j <= numCells; j++) {
    const x = startPoint.x + j * cellSpacing;
    const start = new paper.Point(x, startPoint.y);
    const end = new paper.Point(x, startPoint.y + numCells * cellSpacing);
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
      const cellCenterX = startPointX + (i * cellSpacing) + (cellSpacing / 2);
      const cellCenterY = startPointY + (j * cellSpacing) + (cellSpacing / 2);
      const bead = createPerlerBead(new paper.Point(cellCenterX, cellCenterY), beadParameters);
      bead.visible = false;
      bead.name = 'bead';
    }
  }
};

const createCircularGrid = (gridRadius, beadSpacing, beadParameters) => {
  const cellSpacing = beadParameters.outer_radius * 2 + beadSpacing;
  const gridRadiusPts = Ruler.mm2pts(gridRadius * 10);
  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const centerPoint = new paper.Point(centerX, centerY);

  for (let radius = cellSpacing; radius < gridRadiusPts; radius += cellSpacing) {
    new paper.Path.Circle({
      center: centerPoint,
      radius: radius,
      strokeColor: new paper.Color(0, 0, 0, 0.2),
      strokeWidth: .5,
      name: 'gridLine'
    });

    const numBeads = Math.floor(2 * Math.PI * radius / cellSpacing);
    for (let i = 0; i < numBeads; i++) {
      const angle = (i * 360) / numBeads;
      const beadCenter = centerPoint.add(new paper.Point({
        length: radius,
        angle: angle
      }));
      const bead = createPerlerBead(beadCenter, beadParameters);
      bead.visible = false;
      bead.name = 'bead';
    }
  }

  const centerBead = createPerlerBead(centerPoint, beadParameters);
  centerBead.visible = false;
  centerBead.name = 'bead';
};

const createHexagonalGrid = (gridSize, beadSpacing, beadParameters) => {
  const cellSpacing = beadParameters.outer_radius * 2 + beadSpacing;
  const gridSizePts = Ruler.mm2pts(gridSize * 10);
  const centerX = paper.view.center.x;
  const centerY = paper.view.center.y;
  const hexRadius = gridSizePts / 2;

  const isPointInHexagon = (point, radius) => {
    const dx = Math.abs(point.x - centerX);
    const dy = Math.abs(point.y - centerY);
    if (dx > radius * Math.sqrt(3) / 2 || dy > radius) return false;
    return radius * Math.sqrt(3) / 2 - dx / 2 >= dy;
  };

  const numCells = Math.floor(gridSizePts / cellSpacing);

  for (let q = -numCells; q <= numCells; q++) {
    for (let r = -numCells; r <= numCells; r++) {
      const x = centerX + (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r) * (cellSpacing / 2);
      const y = centerY + (3 / 2 * r) * (cellSpacing / 2);
      const point = new paper.Point(x, y);
      if (isPointInHexagon(point, hexRadius)) {
        const hex = new paper.Path.RegularPolygon(point, 6, beadParameters.outer_radius + beadSpacing / 2);
        hex.strokeColor = new paper.Color(0, 0, 0, 0.2);
        hex.strokeWidth = .5;
        hex.name = 'gridLine';

        const bead = createPerlerBead(point, beadParameters);
        bead.visible = false;
        bead.name = 'bead';
      }
    }
  }
};

const createPerlerBead = (point, beadParameters) => {
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

const changeNearestBeadColor = (clickPoint, color) => {
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

const generalMouseFunctions = (selectedColor) => {
  paper.view.onClick = function(event) {
    changeNearestBeadColor(event.point, selectedColor);
  };
};

const DirectManipulation = ({ paperReady, selectedColor, gridSize, beadSpacing, beadParameters, createGridType }) => {
  useEffect(() => {
    if (paperReady && paper.project) {
      paper.project.clear();
      paper.view.zoom = 4;
      if (createGridType === 'circular') {
        createCircularGrid(gridSize, beadSpacing, beadParameters);
      } else if (createGridType === 'hexagonal') {
        createHexagonalGrid(gridSize, beadSpacing, beadParameters);
      } else {
        createGrid(gridSize, beadSpacing, beadParameters);
      }
    }
  }, [paperReady, gridSize, beadSpacing, beadParameters, createGridType]);

  useEffect(() => {
    if (paperReady && paper.project) {
      generalMouseFunctions(selectedColor);
    }
  }, [selectedColor]);

  return null;
};

export { DirectManipulation, createGrid, createCircularGrid, createHexagonalGrid };




