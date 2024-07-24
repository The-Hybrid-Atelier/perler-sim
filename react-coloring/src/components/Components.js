const Row = function({id, children, className}){
  return(
    <div id={id} className={`row ${className}`}>
      {children}
    </div>
  )
}

const Column = function({children, id, className}){
  return(
    <div id={id} className={`column ${className}`}>
      {children}
    </div>
  )
}

const Pill = function({children, type, profile, setProfiles, onClick, color=undefined}){
  const styleFill = {"background": color?color:"black"}

  return (
    <button className={`pill ${type} ${profile && profile.active ? "active":""}`} onClick={onClick}>
      { color && <span class="swatch" style={styleFill}></span>}
      <span>{profile && profile.name}</span>
      {children}     
    </button>

  )
}

export {Row, Column, Pill}