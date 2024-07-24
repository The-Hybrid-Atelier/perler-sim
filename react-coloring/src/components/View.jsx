import {Column} from './Components.js';

function View({children, icon, screen, goToScreen, setScreen}){
  const handleCancel = (event)=>{setScreen(goToScreen)}

  return (
    <Column className={`view fw fh ${screen}`}>
      {children}
    </Column>
  );
}


export {View};