import paper from 'paper';

const lineTool = (selectedColor, isEraseActive = (event) => event.modifiers.shift) => {
    return new paper.Tool({
        name: 'brushTool',
        color: selectedColor,
        reset: function () {
            if (this.path) this.path.remove();
            this.path = null;
        },
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

            const beads = paper.project.getItems({name: 'bead', visible: isEraseActive(event)});
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
            this.reset();
        }
    });
};

export {lineTool};

