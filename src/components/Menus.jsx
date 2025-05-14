import { useState } from 'react';
// STYLE LIBRARIES
import { Button, ButtonGroup, Label, Input} from 'semantic-ui-react';
import { FaRegSquare, FaRegCircle } from "react-icons/fa"; 
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
    const colors = BEAD_COLORS;
  
    return (
      <div className='fwh cr'>
        {colors.map(color => (
          <button
            key={color}
            className={`bead ${selectedColor === color ? "active" : ""}`}
            style={{ backgroundColor: color}}
            onClick={() => setSelectedColor(color)}
            aria-label={`Select ${color} color`}
          >
            <div className='hole'></div>
          </button>
        ))}
      </div>
    );
  };

const Menus = ({paper, beadParameters, setBeadParameters, selectedColor, setSelectedColor, gridVisible, setGridVisible}) => {
    const setGridSize = (value)=> setBeadParameters({...beadParameters, gridSize: value});
    const setBeadSpacing = (value)=>setBeadParameters({...beadParameters, beadSpacing: value});
    const setCreateGridType = (value)=>setBeadParameters({...beadParameters, createGridType: value});
    const setThickness = (value)=>setBeadParameters({...beadParameters, thickness: value, inner_radius: beadParameters.outer_radius - value});
    const setBeadHeight = (value) => setBeadParameters({...beadParameters, beadHeight: value});
    const [currentTool, setCurrentTool] = useState('beadTool');
    const [projectName, setProjectName] = useState('MyBeadProject');
    const [version, setVersion] = useState("1");

    useEffect(() => { 
      if(paper){
        const lineT = lineTool(selectedColor);
        const fillT = fillTool(selectedColor);
        const beadT = beadTool(selectedColor);
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

    return (
        <>
         
        {/* TOOLS */}
        <ToolBarSubMenu id="Tools" name='Tools'>
          <LabeledParameter label='Project Name'>
            <Input id="project-name" type="text" value={projectName} onChange={(e)=>setProjectName(e.target.value)}/>
          </LabeledParameter>
          <LabeledParameter label='Version'>
            <Input id="version" type="number" value={version} onChange={(e)=>setVersion(e.target.value)}/>
          </LabeledParameter>
          <LabeledParameter label='Controls'>
          <PaperControls projectName={projectName} version={version} selectedColor={selectedColor} beadParameters={beadParameters} />
          </LabeledParameter>
          <LabeledParameter label='Zoom'>
            <ZoomControls />
          </LabeledParameter>
          <LabeledParameter label='MarqueePlace'>
            <Button aria-label='Marquee Place' color={currentTool === "fillTool" ? "green" : ""} icon onClick={() => setCurrentTool("fillTool")}><LuPaintBucket /></Button>
          </LabeledParameter>
          <LabeledParameter label='BrushPlace'>
            <Button aria-label='Bursh Place'color={currentTool === "brushTool" ? "green" : ""} icon onClick={() => setCurrentTool("brushTool")}><IoBrushOutline /></Button>
          </LabeledParameter>
          <LabeledParameter label='BeadPlace'>
            <Button aria-label='Bead Place' color={currentTool === "beadTool" ? "green" : ""} icon onClick={() => setCurrentTool("beadTool")}><PiCylinderFill /></Button>
          </LabeledParameter>
          <LabeledParameter label='Pan'>
            <Button aria-label='Pan' color={currentTool === "panTool" ? "green" : ""} icon onClick={() => setCurrentTool("panTool")}><IoMoveSharp /> </Button>
          </LabeledParameter>
        </ToolBarSubMenu>


         
         {/* PEGBOARD */}
         <ToolBarSubMenu id="PegboardControls" name='Pegboard' initVisible={true}>
 
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
                    value={gridVisible} 
                    setValue={setGridVisible} 
                    minValue={0} 
                    maxValue={1}
                    stepValue={0.1}
                    label='Visibility'
                />
                <Button basic icon={`eye ${gridVisible ? "" : "slash"}`} onClick={()=>setGridVisible(!gridVisible)}/>
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
        <ToolBarSubMenu id="BeadControls" name='Beads'>
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