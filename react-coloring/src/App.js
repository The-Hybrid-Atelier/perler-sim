import './App.css';
import 'semantic-ui-css/semantic.min.css';

import { useState } from 'react';

import {PaperCanvas} from './components/PaperCanvas.jsx';
import {PaperToolBar} from './components/PaperToolBar.jsx';
import {View} from './components/View.jsx';



const START_SCREEN = "paper";

function App() {
  const [appScreen, setScreen] = useState(START_SCREEN);
  const [paperReady, setPaperReady] = useState(false);
  
  return (
    <div className="App">
      {appScreen === "paper" &&
        <View icon="" goToScreen="" screen={appScreen} setScreen={setScreen}>
          <PaperToolBar paperReady={paperReady} name="Coloring Book"/>
          <PaperCanvas setPaperReady={setPaperReady}/>
        </View>
      }
    </div>
  );
}

export default App;