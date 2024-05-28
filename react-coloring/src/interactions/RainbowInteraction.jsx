import { setTool } from '../javascripts/Paper'; 
import { Icon, Button } from 'semantic-ui-react';

const paper = require('paper');
const _ = require('underscore');

const RainbowInteraction = ({ setHistory}) => {
    const hitOptions = {
        stroke: false,
        fill: true,
        tolerance: 1,
        minDistance: 10
    };

    new paper.Tool({
        name: "rainbow",
        onMouseDown: function (event) {
            var hitResults = paper.project.hitTestAll(event.point, hitOptions);
            _.each(hitResults, function (h) {
                // Don't color black lines
                if (h.item.fillColor.brightness === 0) {
                    return;
                }

                let action = function () {
                    h.item.set({
                        fillColor: {
                            gradient: {
                                stops: ['yellow', 'red', 'blue']
                            },
                            origin: h.item.bounds.topLeft,
                            destination: h.item.bounds.bottomRight
                        }
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
        <Button icon onClick={() => setTool("rainbow")}>
            <Icon name='braille' />
        </Button>
    );
};

export { RainbowInteraction };