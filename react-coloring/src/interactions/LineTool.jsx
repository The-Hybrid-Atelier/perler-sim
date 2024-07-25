import paper from 'paper';

const lineTool = (selectedColor) => {
    return new paper.Tool({
        name: 'brushTool',
        color: selectedColor,
        setColor: function (color) {
            this.color = color;
        },
        onMouseDown: function(event) {
            this.path = new paper.Path({
                strokeColor: this.color,
                strokeWidth: 1,
                points: [event.point]
            });
            this.path.simplify();
        },
        onMouseDrag: function(event){
            const color = this.color;
            this.path.add(event.point);

            const beads = paper.project.getItems({name: 'bead', visible: event.modifiers.shift});
            beads.forEach(bead => {
                if (this.path.intersects(bead)) {
                    bead.visible = !bead.visible;
                    bead.fillColor = color;
                }
                
            });
            const beadsAll = paper.project.getItems({name: 'bead'});
            beadsAll.forEach(bead => {
                if (this.path.intersects(bead)) {
                    bead.fillColor = color;
                }
            });
        },
        onMouseUp: function(event){
            if(this.path){
                this.path.remove();
                this.path = null;
            }
        }
    });
};

export {lineTool};

