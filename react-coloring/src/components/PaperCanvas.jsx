import './PaperCanvas.css';
import React, { useEffect, useRef } from 'react';
import { setupPaper } from "../javascripts/Paper.js";
import paper from 'paper';

function PaperCanvas({ setPaperReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      // Set canvas dimensions
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    const preventContextMenu = (event) => {
      event.preventDefault();
    };

    // Initial resize
    resizeCanvas();

    // Event listener for window resize
    window.addEventListener('resize', resizeCanvas);

    // Prevent context menu
    canvas.addEventListener("contextmenu", preventContextMenu);

    // Setup Paper.js
    setupPaper(canvasRef);
    setPaperReady(true);

    return () => {
      canvas.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (paper.project) {
      paper.view.zoom = 1;
    }
  }, []);

  return (
    <div id="canvas-wrapper">
      <canvas ref={canvasRef} resize="true"/>
    </div>
  );
}

export { PaperCanvas };




