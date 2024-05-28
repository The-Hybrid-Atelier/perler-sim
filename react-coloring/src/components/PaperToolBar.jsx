import React, {useEffect, useState} from 'react';

import { HistoryTracker } from '../interactions/HistoryTracker.jsx';
import { ZoomControls } from './ZoomControls.jsx';
import { PaperControls } from './PaperControls.jsx';
import {DEFAULT_COLORING_PAGE, MY_NAME, ACTIVE_PROBLEM} from '../AppConfig.jsx';
import { Dropdown, Form, FormField } from 'semantic-ui-react';
import { DirectManipulation } from '../interactions/DirectManipulation.jsx';
import { ColoringPage } from './ColoringPage.jsx';  
import { ConnectionTool } from '../interactions/ConnectionTool.jsx';
import { FlowChartScene } from '../scenes/FlowChartScene.jsx';
import { BucketInteraction } from '../interactions/BucketInteraction.jsx';
import { RainbowInteraction } from '../interactions/RainbowInteraction.jsx';
import { MarkingMenuInteraction } from '../interactions/MarkingMenuInteraction.jsx';
import { ClassicColoring } from '../interactions/ClassicColoring.jsx';

let _ = require('underscore');
let paper = require('paper');

function PaperToolBar({name, paperReady}) {
    const [activeColoringPage, setActiveColoringPage] = useState(DEFAULT_COLORING_PAGE);
    const [problem, setProblem] = useState(ACTIVE_PROBLEM);

    const [redoStack, setRedoStack] = useState([]);
    const [undoStack, setUndoStack] = useState([]);


    const setHistory = (previousState, action, inverse) => {
        setUndoStack((prev)=>[{ previousState, action, inverse }, ...prev]);
        action();
        setRedoStack([]);    
    }
    
    return (
        <div className='paper-toolbar fw'>
            <h1>{name}
                <br></br>
                <span className="subtitle"> Problem {problem} - {MY_NAME} </span>
            </h1>
            <Form>
                <FormField>
                <label>Problem</label>
                <Dropdown
                    selection
                    options={[
                        { key: 1, text: 'Direct Manipulation', value: 1 },
                        { key: 2, text: 'Circle Tool', value: 2 },
                        { key: 3, text: 'Undo/Redo', value: 3 },
                        { key: 4, text: 'Marking Menu', value: 4 },
                        { key: 5, text: 'Classic Color', value: 5 },
                    ]}
                    value={problem}
                    onChange={(e, { value }) => setProblem(value)}
                />
                </FormField>
            </Form>
            
            {/* DIRECT MANIPULATION */}
            {problem === 1 && (
                <div className='belt crsb'>
                    <DirectManipulation paperReady={paperReady}/>
                    <ZoomControls></ZoomControls>
                    <PaperControls activeColoringPage={activeColoringPage}></PaperControls> 
                </div>
            )}

            {/* CIRCLE TOOL */}
            {problem === 2 && (
                <div className='belt crsb'>
                    <FlowChartScene paperReady={paperReady}/>
                    <ConnectionTool paperReady={paperReady}/>
                    <ZoomControls></ZoomControls>
                    <PaperControls activeColoringPage={activeColoringPage}></PaperControls> 
                </div>
            )}

            {/* UNDO/REDO */}
            {problem === 3 && (
                <div className='belt crsb'>
                   <ColoringPage paperReady={paperReady} page={activeColoringPage}></ColoringPage>
                   <BucketInteraction setHistory={setHistory} />
                   <RainbowInteraction setHistory={setHistory} />
                   <HistoryTracker paperReady={paperReady} undoStack={undoStack} setUndoStack={setUndoStack} redoStack={redoStack} setRedoStack={setRedoStack} ></HistoryTracker>
                   <ZoomControls></ZoomControls>
                   <PaperControls activeColoringPage={activeColoringPage}></PaperControls> 
                </div>
            )}

            {/* MARKING MENU */}
            {problem === 4 && (
                <div className='belt crsb'>
                   <MarkingMenuInteraction paperReady={paperReady} setHistory={setHistory} />
                   <ColoringPage paperReady={paperReady} page={activeColoringPage}></ColoringPage>
                   <ZoomControls></ZoomControls>
                   <PaperControls activeColoringPage={activeColoringPage}></PaperControls> 
                </div>
            )}

            {/* TESTING */}
            {problem === 5 && (
                <div className='belt crsb'>
                   <ColoringPage paperReady={paperReady} page={activeColoringPage}></ColoringPage>
                   <BucketInteraction setHistory={setHistory} />
                   <ClassicColoring paperReady={paperReady}></ClassicColoring>
                   <ZoomControls></ZoomControls>
                   <PaperControls activeColoringPage={activeColoringPage}></PaperControls> 
                </div>
            )} 

        </div>
    );
}    

export {PaperToolBar};