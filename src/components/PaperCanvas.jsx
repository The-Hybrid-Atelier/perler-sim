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
    };

    const preventContextMenu = (event) => {
      event.preventDefault();
    };

    const onWheel = (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      paper.view.zoom *= factor;
    };

    // Initial resize
    resizeCanvas();

    // Event listener for window resize
    window.addEventListener('resize', resizeCanvas);

    // Prevent context menu
    canvas.addEventListener("contextmenu", preventContextMenu);
    canvas.addEventListener("wheel", onWheel, { passive: false });

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
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener('resize', resizeCanvas);
      setPaperReady(false);
    };
  }, [setPaperReady]);


  return (
    <div id="canvas-wrapper">
      {children}
      <canvas ref={canvasRef} resize="true"/>
    </div>
  );
}

export { PaperCanvas };



