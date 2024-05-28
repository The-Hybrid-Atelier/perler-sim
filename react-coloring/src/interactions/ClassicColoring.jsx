import React, { useEffect } from 'react';
import { Icon, Button } from 'semantic-ui-react';
import { setTool } from '../javascripts/Paper'; 

const paper = require('paper');
const _ = require('underscore');

const ClassicColoring = ({paperReady}) => {

    useEffect(() => {
        if (paperReady) {
            const g = new paper.Group({name: "swatches"});
            _.each(_.range(0, 360, 45), function(el, i){
                new paper.Path.Circle({
                    parent: g,
                    name: "well",
                    fillColor: new paper.Color({brightness: 0.8, hue: el, saturation: 0.8}),
                    strokeColor: "black",
                    strokeWidth: 3, 
                    position: paper.view.center.add(new paper.Point({length: 100 * i, angle: 0})),
                    radius: 30, 
                    onMouseDown: function(event){
                        paper.activeColor = this.fillColor;
                    }
                });
            });
            g.position = paper.view.bounds.topCenter.add(new paper.Point({x: 0, y: 50}));
        }
    }, [paperReady]);

    return (
        <></>
    );
};

export { ClassicColoring };