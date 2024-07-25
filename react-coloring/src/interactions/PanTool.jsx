import paper from 'paper';

const panTool = (selectedColor) => {
    return new paper.Tool({
        name: 'panTool',
        color: selectedColor,
        downPoint: null,
        setColor: function (color) {
            console.log('UPDATING COLOR', new paper.Color(color).toCSS(true));
            this.color = color;
        },
        onMouseDown: function(event) {
           this.downPoint = event.point;
        },
        onMouseDrag: function(event){
            const delta = this.downPoint.subtract(event.point);
            paper.view.translate(delta);
        },
        onMouseUp: function(event){
            this.downPoint = null;
        }
    });
};

export {panTool};

