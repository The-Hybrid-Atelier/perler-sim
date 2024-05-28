import { useEffect } from 'react';

let _ = require('underscore');
let paper = require('paper');

const createScene = ()=>{
    makeFlowBox("Start", 
      {"padding": 50}, 
      {position: paper.view.center.add(new paper.Point(-100, 100))});
      makeFlowBox("End", 
      {"padding": 50}, 
      {position: paper.view.center.add(new paper.Point(100, -100))});
}
const makeFlowBox = (text, boxStyle, textStyle)=>{

    const g = new paper.Group({"name": "flowBox"});
    const textItem = new paper.PointText({
        point: paper.view.center,
        content: text,
        fillColor: 'black',
        fontSize: 20, 
        parent: g
    });
    textItem.set(textStyle);

    const box = new paper.Path.Rectangle({
        point: textItem.position,
        size: textItem.bounds.expand(boxStyle.padding),
        strokeColor: 'black',
        fillColor: 'white',
        radius: 10, 
        parent: g
    });
    box.pivot = box.bounds.center;
    box.position = textItem.position;
    
    box.set(boxStyle);
    box.sendToBack();
    return g;
}

const FlowChartScene = (paperReady) => {
  useEffect(() => {
    if(paperReady && paper.project){ 
      paper.project.clear();
      createScene();
    }
  }, [paperReady])
}

export {FlowChartScene};