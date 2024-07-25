import React, { useState, useEffect } from 'react';


import { Button, ButtonGroup, Label} from 'semantic-ui-react';
import GridSizeSlider from '../archive/GridSizeSlider.jsx';
import { LuPaintBucket } from "react-icons/lu";
import Ruler from '../javascripts/ruler.js';
import paper from 'paper';
import { MdGridOff } from "react-icons/md";
import { FaRegSquare, FaRegCircle } from "react-icons/fa"; 
import { FiHexagon } from "react-icons/fi";

import { ToolBarSubMenu } from './ToolBarSubMenu.jsx';
import { BEAD_COLORS, GRID_SIZES} from '../AppConfig.jsx';

import '../PaperToolBar.css';
import { ParameterSlider } from './ParameterSlider'; 




function PaperToolBar({ name, paperReady }) {
  


  return (
    <div className='paper-toolbar-container'>
      <div className='paper-toolbar fw'>
        <h1>{name}</h1>
       
        
      </div>
    </div>
  );
}

export { PaperToolBar };












