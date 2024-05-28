const Ruler = function(){
}
Ruler.DPI = 96;
Ruler.pts2in = function(v){
	return parseFloat(v)/72;
}
Ruler.pts2mm = function(v){
	return parseFloat(v)/2.83464567;
}
Ruler.mm2pts = function(v){
	return 2.83464567 * parseFloat(v);
}
Ruler.in2pts = function(v){
	return parseFloat(v) * 72;
}

Ruler.convert = function(v, unit){
	let conversion = unit === "mm" ? Ruler.mm2pts : Ruler.in2pts;
	return conversion(v);
}

Ruler.gauge2mm = function(v){
	return 0.127 * Math.pow(92, (36 - v) / 39);
}

Ruler.mm2gauge = function(v){
	var c = v / 0.127;
	return Math.round(-1 * ((39 * Math.log(c) / Math.log(92)) - 36));
}

Ruler.pts2gauge = function(v){
	return Ruler.mm2gauge(Ruler.pts2mm(v));
}

Ruler.gauge2pts = function(v){
	return Ruler.mm2pts(Ruler.gauge2mm(v));
}

Ruler.ringsize2mm = function(v){
	return 11.63 + 0.8128 * v;
}

export default Ruler;