import './PaperCanvas.css';
import React, { useEffect, useRef } from 'react';
import { setupPaper } from "../javascripts/Paper.js";
// import paper from 'paper';

function PaperCanvas({ setPaperReady, children}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      // Set canvas dimensions
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      console.log(`Canvas resized: ${canvas.width}x${canvas.height}`);
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
    
    const paper = setupPaper(canvasRef);
    setPaperReady(paper);
    
    paper.view.zoom = 1;
    // const c = new paper.Path.Circle({
    //   center: paper.view.center,
    //   radius: 100,
    //   fillColor: 'black'
    // })
    // console.log("Circle created", c);

    return () => {
      canvas.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);


  return (
    <div id="canvas-wrapper">
      {children}
      <canvas ref={canvasRef} resize="true"/>
    </div>
  );
}

export { PaperCanvas };




