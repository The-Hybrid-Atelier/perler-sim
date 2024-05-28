import React from 'react';
import {exportSVG} from '../javascripts/Paper.js';
import {Icon, Button, Modal} from 'semantic-ui-react';
import {loadPage} from './ColoringBook.jsx';


import paper from 'paper';

const PaperControls = ({activeColoringPage}) => {
    const trashInteraction = () => {
        paper.project.clear();
        loadPage({url: activeColoringPage});
    }

    return (       
            <div>
                <Modal
                    trigger={<Button icon><Icon name='trash' /></Button>}
                    header='Are you sure you want to destroy your masterpiece?'
                    content='This action cannot be undone.'
                    actions={['Keep It', { key: 'done', content: 'Nuke It', positive: true, onClick: trashInteraction}]}
                    
                    />
                <Button icon onClick={exportSVG}>
                    <Icon name='download' />
                </Button>
            </div>
    );
};

export { PaperControls };
