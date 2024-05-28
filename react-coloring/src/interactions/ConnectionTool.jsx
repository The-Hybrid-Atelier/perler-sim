import { Icon, Button } from 'semantic-ui-react';
import { setTool } from '../javascripts/Paper'; 

const paper = require('paper');
const _ = require('underscore');

const ConnectionTool = () => {
    // define your hitOptions
    // use match to filter out the items you want to interact with

    const cT = new paper.Tool({
        name: "connection",
        onMouseDown: function(){ 
          // TODO
        },
        onMouseMove: function(){ 
          // TODO
        },
        onMouseUp: function(){ 
          // TODO
        }
    });

    return (
        <Button icon onClick={() => setTool("circle")}>
            <Icon name='sitemap' />
        </Button>
    );
};

export { ConnectionTool };