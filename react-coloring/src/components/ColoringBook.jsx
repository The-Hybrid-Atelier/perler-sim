const _ = require('underscore');
const paper = require('paper');

const loadPage = (ops) =>{
    console.log("\t> Coloring Page Loading:", ops.url);

    // POSITION HANDLING
    if (!ops.position) {
      ops.position = paper.view.center;
    }
    ops.position = ops.position.clone();
    if (_.isUndefined(ops.fitBounds)) {
      ops.fitBounds = true;
    }
    if (_.isUndefined(ops.extract)) {
      ops.extract = false;
    }

    paper.project.importSVG(ops.url, {
      expandShapes: false,
      insert: true,
      onError: (e) => {
        console.error(e.message);
        console.error("Could not load", ops.url);
      },
      onLoad: (item) => {
        item.position = ops.position;
        if(ops.fitBounds){
          item.fitBounds(paper.view.bounds.expand(-100));
        }
        
        if(ops.onLoaded){
          ops.onLoaded(item);
        }
        if(ops.extract){
          item.remove();
          
          const extractedItem = item.children[ops.extract]
          if(extractedItem){
            item = paper.project.activeLayer.addChild(extractedItem);
          }
        }
        if(ops.postProcess){
          ops.postProcess(item);
        }
        console.error("Loaded", ops.url);
      }
    });
}

export {loadPage};