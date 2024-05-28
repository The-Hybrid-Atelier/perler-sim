let paper = require('paper');
let FileSaver = require('file-saver');

const setTool = (interaction) => {
  const tool = paper.tools.find(tool => tool.name === interaction);
  if (tool) {
      tool.activate();
  } else {
      console.error(`Tool with name ${interaction} not found.`);
  }
};

function setupPaper(canvasRef){
  // explicitly set the attr width/height
  canvasRef.current.height = canvasRef.current.parentElement.height
  canvasRef.current.width = canvasRef.current.parentElement.width
  paper.setup(canvasRef.current);
  paper.view.zoom = 1
  // paper.install(window)
  return paper;
  // console.log(paper.view.size);
}
function exportSVG(){
  let prev = paper.view.zoom;
  console.log("Exporting file as SVG");
  paper.view.zoom = 1;
  paper.view.update();
  let exp = paper.project.exportSVG({
    asString: true,
    precision: 5
  })
  FileSaver.saveAs(new Blob([exp], {type:"application/svg+xml"}), "test.svg")
  paper.view.zoom = prev
}

export {setupPaper, exportSVG, setTool};