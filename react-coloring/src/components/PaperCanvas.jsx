import './PaperCanvas.css';
import React, { useEffect, useRef} from 'react';
import {setupPaper} from "../javascripts/Paper.js"

let paper = require('paper');


function PaperCanvas({setScreen, paperReady, setPaperReady}) {
  
    const canvasRef = useRef(null);  
    useEffect(() => {
      const preventContextMenu = (event) => {
        event.preventDefault();
      };

      const canvas = canvasRef.current;
      canvas.addEventListener("contextmenu", preventContextMenu);
      setupPaper(canvasRef);
      setPaperReady(true);
      return () => {
        canvas.removeEventListener("contextmenu", preventContextMenu);
      };
    }, []);


    useEffect(()=>{
      if(paperReady && paper.project){
        paper.view.zoom = 1;
      }
    }, [paperReady])
  
    return (
     
      <div id="canvas-wrapper">
        <canvas ref={canvasRef} resize="true" width="100%" height="100%"/>
      </div>
 
    );
}

export {PaperCanvas};

