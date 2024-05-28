import { useEffect } from 'react';

let _ = require('underscore');
let paper = require('paper');

const createDMCircle = ()=>{
    const t = new paper.PointText({
      point: paper.view.center,
      content: 'TODO: Direct Manipulation.jsx',
      fillColor: 'black',
      fontSize: 20, 
      onMouseDown: function(event){
        //TODO
      }, 
      oneMouseMove: function(event){
        //TODO
      },
      onMouseUp: function(event){
        //TODO
      }
    });
    t.position = paper.view.center;
}

const DirectManipulation = (paperReady) => {
  useEffect(() => {
    if(paperReady && paper.project){ 
      paper.project.clear();
      createDMCircle();
    }
  }, [paperReady])
}

export {DirectManipulation};