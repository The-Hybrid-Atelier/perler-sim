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
  outer_radius: (4.5/2),
  inner_radius: ((4.5/2) - (0.79)),
  gridSize: 5,
  beadSpacing: 0.5,
  createGridType: 'square',
  fillColor: BEAD_COLORS[0],
  strokeColor: BEAD_COLORS[0],
  strokeWidth: 0,
  selectionStrokeWidth: 1,
  thickness: (0.79),
  beadHeight: 5.2
};

function App() {
  const [appScreen, setScreen] = useState(START_SCREEN);
  const [paperReady, setPaperReady] = useState(false);
  const [selectedColor, setSelectedColor] = useState(BEAD_COLORS[0]);
  const [beadParameters, setBeadParameters] = useState(defaultBeadParameters);
  const [gridVisible, setGridVisible] = useState(true);

  return (
    <div className="App">
      <header>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <h1 className="visually-hidden">Perler Bead Design Tool</h1>
      </header>
      <aside className="controls fh" aria-label="Design controls">
        <Menus
            paper={paperReady}
            beadParameters={beadParameters}
            setBeadParameters={setBeadParameters}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            gridVisible={gridVisible}  
            setGridVisible={setGridVisible}
          />
      </aside>
      {appScreen === "paper" &&
        <main id="main-content" className="fw fh" tabIndex="-1">
          <View icon="" goToScreen="" screen={appScreen} setScreen={setScreen}>
            
            <DirectManipulation
              paperReady={paperReady}
              selectedColor={selectedColor}
              beadParametersMM={beadParameters}
              gridVisible={gridVisible}  
            />

            <PaperCanvas setPaperReady={setPaperReady}></PaperCanvas>
          </View>
        </main>
      }
    </div>
  );
}

export default App;
