import paper from 'paper';

export const fillTool = (selectedColor) => {
    const tool = new paper.Tool();
    let dragging = false;
    let startRect;
    let area = null;

    tool.onMouseDown = function (event) {
        startRect = new paper.Rectangle(event.point, new paper.Size(0, 0));
        dragging = true;
    };

    tool.onMouseDrag = function(event) {
        if (!dragging) {
            startRect = event;
            dragging = true;
        }
    
        // Remove previous area
        if (area) {
            area.remove();
        }
    
        // Create new area
        const rect = new paper.Rectangle(startRect.point, event.point);
        area = new paper.Path.Rectangle(rect);
        area.strokeColor = 'black';
        area.fillColor = null;
        area.dashArray = [5, 5];
    };

    tool.onMouseUp = function (event) {
        if (dragging) {
            dragging = false;

            // Get all beads within the selected area and toggle their visibility
            const rect = new paper.Rectangle(startRect.point, event.point);
            paper.project.getItems({ name: 'bead' }).forEach(bead => {
                if (rect.contains(bead.position)) {
                    if (bead.visible) {
                        bead.visible = false;
                    } else {
                        bead.fillColor = selectedColor;
                        bead.visible = true;
                    }
                }
            });

            // Remove the selection rectangle
            if (area) {
                area.remove();
            }

            dragging = false;
            startRect = null;
            area = null;
        }
    };

    tool.activate();
};

export default fillTool;

