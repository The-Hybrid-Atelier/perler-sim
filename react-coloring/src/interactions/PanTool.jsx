import paper from 'paper';

const panTool = (selectedColor) => {
    return new paper.Tool({
        name: 'panTool',
        color: selectedColor,
        lastPoint: null,
        setColor: function (color) {
            this.color = color;
        },
        onMouseDown: function(event) {
           
            this.lastPoint = paper.view.projectToView(event.point);
            return;

        },
        onMouseDrag: function(event) {
         
            var point = paper.view.projectToView(event.point),
            last = paper.view.viewToProject(this.lastPoint);
            paper.view.scrollBy(last.subtract(event.point));
            this.lastPoint = point;
            
        }
    });
};

export {panTool};

