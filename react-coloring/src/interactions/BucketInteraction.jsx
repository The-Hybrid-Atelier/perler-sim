import { Icon, Button } from 'semantic-ui-react';
import { setTool } from '../javascripts/Paper'; 
const paper = require('paper');
const _ = require('underscore');


const BucketInteraction = ({ setHistory }) => {
    const hitOptions = {
        stroke: false,
        fill: true,
        tolerance: 1,
        minDistance: 10
    };

    const bucket = new paper.Tool({
        name: "bucket",
        onMouseDown: function (event) {
            var scope = this;
            var hitResults = paper.project.hitTestAll(event.point, hitOptions);
            _.each(hitResults, function (h) {
                console.log(h.item.name)
                if(h.item.name === "well"){
                    return;
                }
                // Don't color black lines
                if (h.item.fillColor.brightness === 0) {
                    return;
                }
                let action = function () {
                    h.item.set({
                        fillColor: paper.activeColor
                    });
                };
                let inverse = function () {
                    h.item.set({
                        fillColor: this.previousState.fillColor
                    });
                };
                setHistory({ fillColor: h.item.fillColor }, action, inverse);

            });
        }
    });

    return (
        <Button icon onClick={() => setTool("bucket")}>
            <Icon name='tint' />
        </Button>
    );
};

export { BucketInteraction };