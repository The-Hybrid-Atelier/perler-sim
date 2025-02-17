import React from 'react';
import { Button, ButtonGroup, Icon } from 'semantic-ui-react';
import paper from 'paper';

const ZoomControls = () => {
    const zoomInteraction = (amount) => {
        paper.view.zoom *= amount;
    };

    return (
        <ButtonGroup>
            <Button aria-label='zoom out' primary icon onClick={() => zoomInteraction(0.9)}>
                <Icon name='zoom out' />
            </Button>
            <Button aria-label='zoom in' primary icon onClick={() => zoomInteraction(1.1)}>
                <Icon name='zoom in' />
            </Button>
        </ButtonGroup>
    );
};

export { ZoomControls };
