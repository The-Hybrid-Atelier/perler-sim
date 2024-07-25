import './App.css';
import 'semantic-ui-css/semantic.min.css';

import { DirectManipulation} from './interactions/DirectManipulation.jsx';
import { useState } from 'react';
import {PaperCanvas} from './components/PaperCanvas.jsx';
import {View} from './components/View.jsx';
import { BEAD_COLORS} from './AppConfig.jsx';
import { Menus } from './components/Menus.jsx';

const START_SCREEN = "paper";
const defaultBeadParameters = {
  name: "bead",
  outer_radius: 0.9,
  inner_radius: 0.57,
  gridSize: 5,
  beadSpacing: 0.5,
  createGridType: 'square',
  fillColor: 'black',
  strokeColor: 'black',
  strokeWidth: 0,
  selectionStrokeWidth: 1,
  thickness: 0.33
};

function App() {
  const [appScreen, setScreen] = useState(START_SCREEN);
  const [paperReady, setPaperReady] = useState(false);
  const [selectedColor, setSelectedColor] = useState(BEAD_COLORS[0]);
  const [beadParameters, setBeadParameters] = useState(defaultBeadParameters);
  const [gridVisible, setGridVisible] = useState(true);

  return (
    <div className="App">
      <div className="controls fh">
        <Menus
            paper={paperReady}
            beadParameters={beadParameters}
            setBeadParameters={setBeadParameters}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            gridVisible={gridVisible}  
            setGridVisible={setGridVisible}
          />
      </div>
      {appScreen === "paper" &&
        <View icon="" goToScreen="" screen={appScreen} setScreen={setScreen}>
          
          <DirectManipulation
            paperReady={paperReady}
            selectedColor={selectedColor}
            beadParametersMM={beadParameters}
            gridVisible={gridVisible}  
          />

          <PaperCanvas setPaperReady={setPaperReady}></PaperCanvas>
        </View>
      }
    </div>
  );
}

export default App;