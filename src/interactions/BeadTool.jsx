import paper from 'paper';
const changeNearestBeadColor = (paper, clickPoint) => {
    let nearestBead = null;
    let minDistance = Number.MAX_VALUE;
  
    // paper.project.getItems makes it so not EVERYTHING in the project is queried. 
    paper.project.getItems({name: 'bead'}).forEach(item => {
      const distance = item.position.getDistance(clickPoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBead = item;
      }
    });
  
    return nearestBead;
  };

  
const beadTool = (selectedColor, isEraseActive = (event) => event.modifiers.shift) => {
    return new paper.Tool({
        name: 'beadTool',
        color: selectedColor,
        activeBead: null,
        setColor: function (color) {
            this.color = color;
        },
        onMouseDown: function(event) {
            this.activeBead = changeNearestBeadColor(paper, event.point);
        },
        onMouseUp: function(event){
            if (this.activeBead ) {
                // IF BEAD IS NOT THERE, ADD IT
                if(!this.activeBead.visible){
                    this.activeBead.visible = true;
                    this.activeBead.fillColor = this.color;
                }
                // IF BEAD IS THERE, ONLY REMOVE IT IN ERASE MODE
                else if(this.activeBead.visible && isEraseActive(event)){
                    this.activeBead.visible = false;
                    this.activeBead.fillColor = this.color;
                }
                else{
                    this.activeBead.fillColor = this.color;
                }
            }
        }
    });
};

export {beadTool};
