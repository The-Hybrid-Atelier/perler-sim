import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import paper from 'paper';

const ZoomControls = () => {
    const zoomInteraction = (amount) => {
        paper.view.zoom *= amount;
    };

    return (
        <div>
            <Button icon onClick={() => zoomInteraction(1.1)}>
                <Icon name='zoom in' />
            </Button>
            <Button icon onClick={() => zoomInteraction(0.9)}>
                <Icon name='zoom out' />
            </Button>
        </div>
    );
};

export { ZoomControls };
