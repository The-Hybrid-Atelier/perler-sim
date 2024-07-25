import React, { useEffect, useState } from 'react';
import { Label, Button } from 'semantic-ui-react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';

const ToolBarSubMenu = ({ name, children, initVisible = true}) => {
  const [isVisible, setIsVisible] = useState(initVisible);

  return (
    <Draggable
        axis="both"
        handle=".handle"
        positionOffset={{x: 15, y: 15}}
        scale={1}
        
    >
      <div className={`submenu ${name.toLowerCase()}`}>
        <div className="submenu-label handle crsb">
          {name.toUpperCase()}
          <Button 
            size="mini"
            floated="right"
            basic
            icon={`${isVisible ? "minus" : "plus"}`}
            onClick={() => setIsVisible(!isVisible)} 
            />
        </div>
        <div className={`submenu-content ccfs ${isVisible ? 'visible' : 'hidden'}`}>
          {children}
        </div>
      </div>
    </Draggable>
  );
};

export { ToolBarSubMenu };
