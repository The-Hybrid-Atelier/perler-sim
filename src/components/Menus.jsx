import { useState, useRef } from 'react';
// STYLE LIBRARIES
import { Button, ButtonGroup, Label, Input} from 'semantic-ui-react';
import { FaRegSquare, FaRegCircle, FaEraser } from "react-icons/fa";
import { FiHexagon } from "react-icons/fi";
import { LuPaintBucket } from "react-icons/lu";
import { IoBrushOutline } from "react-icons/io5";
import { PiCylinderFill } from "react-icons/pi";
import { IoMoveSharp } from "react-icons/io5";
// COMPONENTS
import { ToolBarSubMenu } from './ToolBarSubMenu.jsx';
import { ParameterSlider, LabeledParameter } from './ParameterSlider'; 
import { fillTool } from '../interactions/FillTool.jsx';
import { lineTool } from '../interactions/LineTool.jsx';
import { beadTool } from '../interactions/BeadTool.jsx';
import { panTool } from '../interactions/PanTool.jsx';
import { ZoomControls } from './ZoomControls.jsx';
import { PaperControls } from './PaperControls.jsx';

// PARAMETERS
import { BEAD_COLORS} from '../AppConfig.jsx';
import { useEffect } from 'react';


const ColorPicker = ({ selectedColor, setSelectedColor }) => {
    return (
      <div className='fwh cr'>
        {BEAD_COLORS.map((color, i) => (
          <div key={color} className='color-swatch'>
            <button
              className={`bead ${selectedColor === color ? "active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Select color ${i + 1}`}
            >
              <div className='hole'></div>
            </button>
            <span className='color-key'>{i + 1}</span>
          </div>
        ))}
      </div>
    );
  };

const Menus = ({paper, beadParameters, setBeadParameters, selectedColor, setSelectedColor, gridVisible, setGridVisible, onClearDesign}) => {
    const setGridSize = (value)=> setBeadParameters({...beadParameters, gridSize: value});
    const setBeadSpacing = (value)=>setBeadParameters({...beadParameters, beadSpacing: value});
    const setCreateGridType = (value)=>setBeadParameters({...beadParameters, createGridType: value});
    const setThickness = (value)=>setBeadParameters({...beadParameters, thickness: value, inner_radius: beadParameters.outer_radius - value});
    const setBeadHeight = (value) => setBeadParameters({...beadParameters, beadHeight: value});
    const [currentTool, setCurrentTool] = useState('beadTool');
    const spaceRestoreTool = useRef('beadTool');
    const [isEraseToggled, setIsEraseToggled] = useState(false);
    const [isShiftHeld, setIsShiftHeld] = useState(false);
    const isEraseActive = isEraseToggled || isShiftHeld;
    // Paper tools live outside React; read the current mode without recreating them.
    const eraseActiveRef = useRef(isEraseActive);
    eraseActiveRef.current = isEraseActive;
    const gridVisibilityValue = Number(gridVisible);
    const isGridVisible = gridVisibilityValue > 0;

    useEffect(() => { 
      if(paper){
        const lineT = lineTool(selectedColor, () => eraseActiveRef.current);
        const fillT = fillTool(selectedColor);
        const beadT = beadTool(selectedColor, () => eraseActiveRef.current);
        const panT = panTool(selectedColor);
      }
    }, [paper]);

    useEffect(() => {
      if(paper && currentTool){
        paper.tools.forEach(tool =>{
          if(tool.name === currentTool){
            tool.activate();
          }
        });
      }
    }, [paper, currentTool]);

    useEffect(() => {
      const heldShiftKeys = new Set();
      const isEditing = (target) => target instanceof Element &&
        Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
      const resetShift = () => {
        heldShiftKeys.clear();
        setIsShiftHeld(false);
      };
      const onKeyDown = (event) => {
        if (event.key === 'Shift' && !isEditing(event.target)) {
          heldShiftKeys.add(event.code || event.key);
          setIsShiftHeld(true);
        }
      };
      const onKeyUp = (event) => {
        if (event.key === 'Shift') {
          heldShiftKeys.delete(event.code || event.key);
          setIsShiftHeld(heldShiftKeys.size > 0);
        }
      };
      const onFocusIn = (event) => {
        if (isEditing(event.target)) resetShift();
      };
      const onVisibilityChange = () => {
        if (document.hidden) resetShift();
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', resetShift);
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', resetShift);
        document.removeEventListener('focusin', onFocusIn);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }, []);

    useEffect(() => {
      const onKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'm' || e.key === 'M') setCurrentTool('fillTool');
        if (e.key === 'b' || e.key === 'B') setCurrentTool('brushTool');
        if (e.key === 'p' || e.key === 'P') setCurrentTool('beadTool');
        if (e.key === ' ' && !e.repeat) setCurrentTool(prev => { spaceRestoreTool.current = prev; return 'panTool'; });
        const n = parseInt(e.key);
        if (n >= 1 && n <= BEAD_COLORS.length) setSelectedColor(BEAD_COLORS[n - 1]);
      };
      const onKeyUp = (e) => {
        if (e.key === ' ') setCurrentTool(spaceRestoreTool.current);
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, []);

    return (
        <>
         
        {/* TOOLS */}
        <ToolBarSubMenu id="Tools" name='Tools'>
          <LabeledParameter label='Controls'>
            <PaperControls selectedColor={selectedColor} beadParameters={beadParameters} onClearDesign={onClearDesign} />
          </LabeledParameter>
          <LabeledParameter label='Zoom'>
            <ZoomControls />
          </LabeledParameter>
          <LabeledParameter label='MarqueePlace' hotkey='M'>
            <Button aria-label='Marquee Place' color={currentTool === "fillTool" ? "green" : ""} icon onClick={() => setCurrentTool("fillTool")}><LuPaintBucket /></Button>
          </LabeledParameter>
          <LabeledParameter label='BrushPlace' hotkey='B'>
            <Button aria-label='Brush Place' color={currentTool === "brushTool" ? "green" : ""} icon onClick={() => setCurrentTool("brushTool")}><IoBrushOutline /></Button>
          </LabeledParameter>
          <LabeledParameter label='BeadPlace' hotkey='P'>
            <Button aria-label='Bead Place' color={currentTool === "beadTool" ? "green" : ""} icon onClick={() => setCurrentTool("beadTool")}><PiCylinderFill /></Button>
          </LabeledParameter>
          <LabeledParameter label='Erase' hotkey='Shift'>
            <Button aria-label='Erase' toggle active={isEraseActive} aria-keyshortcuts='Shift'
              color={isEraseActive ? "green" : undefined} icon
              onClick={() => setIsEraseToggled(previous => !previous)}><FaEraser /></Button>
          </LabeledParameter>
          <LabeledParameter label='Pan' hotkey='Space'>
            <Button aria-label='Pan' color={currentTool === "panTool" ? "green" : ""} icon onClick={() => setCurrentTool("panTool")}><IoMoveSharp /></Button>
          </LabeledParameter>
        </ToolBarSubMenu>


         
         {/* PEGBOARD */}
         <ToolBarSubMenu id="PegboardControls" name='Pegboard Controls' initVisible={false}>
 
            <LabeledParameter label='Size'>
                <ParameterSlider 
                    value={beadParameters.gridSize} 
                    setValue={setGridSize} 
                    minValue={5} 
                    maxValue={25}
                    stepValue={1}
                    parser={parseInt}
                    label='Size'
                />
                {beadParameters.gridSize.toFixed(0)} x {beadParameters.gridSize.toFixed(0)}
            </LabeledParameter>


            <LabeledParameter label='Spacing'>
                <ParameterSlider 
                    value={beadParameters.beadSpacing} 
                    setValue={setBeadSpacing} 
                    minValue={-1} 
                    maxValue={1.5}
                    stepValue={0.05}
                    label='Spacing'
                />
                {beadParameters.beadSpacing.toFixed(2)} mm
            </LabeledParameter>


            <LabeledParameter label='Visibility'>
                <ParameterSlider 
                    value={gridVisibilityValue} 
                    setValue={setGridVisible} 
                    minValue={0} 
                    maxValue={1}
                    stepValue={0.1}
                    label='Visibility'
                />
                <Button
                    aria-label={isGridVisible ? 'Hide grid' : 'Show grid'}
                    basic
                    icon={`eye ${isGridVisible ? "" : "slash"}`}
                    onClick={()=>setGridVisible(isGridVisible ? 0 : 1)}
                />
            </LabeledParameter>

            
            <LabeledParameter label='Shape'>
                <ButtonGroup>
                    <Button aria-label='Square Pegboard' color='red' icon onClick={() => setCreateGridType('square')}><FaRegSquare /></Button>
                    <Button aria-label='Circle Pegboard'color='green' icon onClick={() => setCreateGridType('circular')}><FaRegCircle /></Button>
                    <Button aria-label='Hexagonal Pegboard' color='blue' icon onClick={() => setCreateGridType('hexagonal')}><FiHexagon /></Button> 
                </ButtonGroup>
                <Label basic>{beadParameters.createGridType}</Label>
            </LabeledParameter>


        </ToolBarSubMenu>
        

        {/* BEADS */}
        <ToolBarSubMenu id="BeadControls" name='Bead Controls' initVisible={false}>
            <LabeledParameter label='Thickness'>

            <ParameterSlider 
                value={beadParameters.thickness} 
                setValue={setThickness} 
                minValue={0.1} 
                maxValue={beadParameters.outer_radius}
                stepValue={0.05}
                label='Thickness'
            />
            {beadParameters.thickness.toFixed(2)} mm
            </LabeledParameter>

            <LabeledParameter label='Height'>
                <ParameterSlider 
                    value={beadParameters.beadHeight} 
                    setValue={setBeadHeight} 
                    minValue={1} 
                    maxValue={50} 
                    stepValue={0.1}
                    label='Height'
                />
                {beadParameters.beadHeight.toFixed(2)} mm
            </LabeledParameter>
            
          <ColorPicker selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
        </ToolBarSubMenu>
        </>
    )
}

export {Menus};
