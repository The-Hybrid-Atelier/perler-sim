// STYLE LIBRARIES
import { Button, ButtonGroup, Label} from 'semantic-ui-react';
import { FaRegSquare, FaRegCircle } from "react-icons/fa"; 
import { FiHexagon } from "react-icons/fi";
import { LuPaintBucket } from "react-icons/lu";

// COMPONENTS
import { ToolBarSubMenu } from './ToolBarSubMenu.jsx';
import { ParameterSlider, LabeledParameter } from './ParameterSlider'; 
import { fillTool } from '../interactions/FillTool.jsx';
import { ZoomControls } from './ZoomControls.jsx';
import { PaperControls } from './PaperControls.jsx';

// PARAMETERS
import { BEAD_COLORS} from '../AppConfig.jsx';


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
          >
            <div className='hole'></div>
          </button>
        ))}
      </div>
    );
  };

const Menus = ({beadParameters, setBeadParameters, selectedColor, setSelectedColor, gridVisible, setGridVisible}) => {
    const setGridSize = (value)=> setBeadParameters({...beadParameters, gridSize: value});
    const setBeadSpacing = (value)=>setBeadParameters({...beadParameters, beadSpacing: value});
    const setCreateGridType = (value)=>setBeadParameters({...beadParameters, createGridType: value});
    const setThickness = (value)=>setBeadParameters({...beadParameters, thickness: value, inner_radius: beadParameters.outer_radius - value});
  
    return (
        <>
         
        {/* TOOLS */}
        <ToolBarSubMenu id="Tools" name='Tools'>
          <LabeledParameter label='Controls'>
            <PaperControls/>
          </LabeledParameter>
          <LabeledParameter label='Zoom'>
            <ZoomControls />
          </LabeledParameter>
          <LabeledParameter label='QuickPlace'>
            <Button color='green' icon onClick={() => fillTool(selectedColor)}><LuPaintBucket /></Button>
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
                />
                {beadParameters.gridSize.toFixed(0)} x {beadParameters.gridSize.toFixed(0)}
            </LabeledParameter>


            <LabeledParameter label='Spacing'>
                <ParameterSlider 
                    value={beadParameters.beadSpacing} 
                    setValue={setBeadSpacing} 
                    minValue={-1} 
                    maxValue={1.5}
                    stepValue={0.1}
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
                />
                <Button basic icon={`eye ${gridVisible ? "" : "slash"}`} onClick={()=>setGridVisible(!gridVisible)}/>
            </LabeledParameter>

            
            <LabeledParameter label='Shape'>
                <ButtonGroup>
                    <Button color='red' icon onClick={() => setCreateGridType('square')}><FaRegSquare /></Button>
                    <Button color='green' icon onClick={() => setCreateGridType('circular')}><FaRegCircle /></Button>
                    <Button color='blue' icon onClick={() => setCreateGridType('hexagonal')}><FiHexagon /></Button> 
                </ButtonGroup>
                <Label basic>{beadParameters.createGridType}</Label>
            </LabeledParameter>


        </ToolBarSubMenu>
        



        {/* BEADS */}
        <ToolBarSubMenu id="BeadControls" name='Beads'>
            <LabeledParameter label='Bead Thickness'>

            <ParameterSlider 
                value={beadParameters.thickness} 
                setValue={setThickness} 
                minValue={0.1} 
                maxValue={beadParameters.outer_radius}
                stepValue={0.1}
            />
            {beadParameters.thickness.toFixed(2)} mm
            </LabeledParameter>
            
          <ColorPicker selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
        </ToolBarSubMenu>
        </>
    )
}

export {Menus};