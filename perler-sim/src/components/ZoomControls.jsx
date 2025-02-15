import React from 'react';
import { Button, ButtonGroup, Icon } from 'semantic-ui-react';
import paper from 'paper';

const ZoomControls = () => {
    const zoomInteraction = (amount) => {
        paper.view.zoom *= amount;
    };

    return (
        <ButtonGroup>
            <Button primary icon onClick={() => zoomInteraction(0.9)}>
                <Icon name='zoom out' />
            </Button>
            <Button primary icon onClick={() => zoomInteraction(1.1)}>
                <Icon name='zoom in' />
            </Button>
        </ButtonGroup>
    );
};

export { ZoomControls };
