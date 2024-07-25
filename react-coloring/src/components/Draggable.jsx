const defaultCoordinates = {
    x: 0,
    y: 0,
  };

  
function DraggableStory({
    axis,
    handle,
    label = 'Go ahead, drag me.',
    modifiers,
    style,
    buttonStyle,
  }) {
    const [{x, y}, setCoordinates] = useState(defaultCoordinates);
 
    return (
      <DndContext
        onDragEnd={({delta}) => {
          setCoordinates(({x, y}) => {
            return {
              x: x + delta.x,
              y: y + delta.y,
            };
          });
        }}
        modifiers={modifiers}
      >
        <Wrapper>
          <DraggableItem
            axis={axis}
            label={label}
            handle={handle}
            top={y}
            left={x}
            style={style}
            buttonStyle={buttonStyle}
          />
        </Wrapper>
      </DndContext>
    );
  }
  