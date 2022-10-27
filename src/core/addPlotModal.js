function html2element(html){
  let template = document.createElement('template'); 
  template.innerHTML = html.trim(); // Never return a text node of whitespace as the result
  return template.content.firstChild;
} // html2element


let modalTemplate = `
<div class="modal fade" id="addPlotModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="background-color: rgba(0,0,0,0.4);">
  
  <div class="modal-dialog">
    <div class="modal-content">
	
      <div class="modal-header">
        <h5 class="modal-title"> Configure new plot </h5>
      </div>
	  
      <div class="modal-body" style="margin: 0px auto;">
	    
		<h6>Plot type</h6>
        <table class="static" style="margin-left: 30px;"></table>
		
		<h6>Data</h6>
		<table class="dynamic" style="margin-left: 30px;"></table>
		
		<h6>Layout</h6>
		<table class="optional" style="margin-left: 30px;"></table>
      </div>
      
	  <div class="modal-footer">
        <button type="button" class="btn btn-secondary closeModal" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary addPlot">Submit</button>
      </div>
	  
    </div>
  </div>
  
</div>
`;




/*
"d3LineSeries"
		"d3ContourStruct2d"
		"threeSurf3d"
*/


var dataProperties = ["Average f", "Std dev f"];
var metaDataProperties = ["Simulation type", "Model type"];

var modalConfig = {
	
	// Maybe this should be as below, name + options for the statis part.
	dynamic: [["select", "plot type", ["cfD3BarChart", "cfD3Scatter", "cfD3Histogram"], undefined]],
	
	// [type, name, options, default]
	cfD3BarChart: [
		["select", "property", metaDataProperties, undefined]
	],
	
	cfD3Histogram: [
		["select", "property", dataProperties, undefined]
	],
	
	cfD3Scatter: [
		["select", "xProperty", dataProperties, undefined],
		["select", "yProperty", dataProperties, undefined]
	],
	
	
	optional: [
		["text", "title", "", undefined],
		["number", "colWidth", [1,12], 3],
		["number", "height", [0, 600], 300],
		["checkbox", "highlightTasks", "", true]
	]
	
} // modalConfig





export default class addPlotModal{
	node = undefined
	currentPlotRow = undefined
	requiredSelections = []
	
	constructor(config){
		let obj = this;
		obj.node = html2element( modalTemplate );
		
		obj.config = config;
		
		
		// Create the static and optional menus here. Update will only handle the dynamic menus.
		let pt = new inputObject( obj.config.plotType );
		obj.node.querySelector("table.static").appendChild( pt.node );
		pt.node.onchange = function(){
			obj.update();
		} // onchange
		obj.config.plotType.inputobj = pt;
		
		
		
		// The optional menus should be at the bottom.
		obj.config.layout.forEach(d=>{
			let m = new inputObject(d);
			obj.node.querySelector("table.optional").appendChild( m.node );
			d.inputobj = m;
		}) // forEach
		
		
		
		// Basic functionality.
		obj.node.onclick = function(e){
			obj.hide();
		}; // onclick
		
		obj.node.querySelector("div.modal-dialog").onclick = function(e){
			// Stop the propagation past the dialogue.
			e.stopPropagation();
		}; // onclick
		
		
		obj.node.querySelector("button.closeModal").onclick = function(e){
			obj.hide();
		}; // onclick
		
		obj.node.querySelector("button.addPlot").onclick = function(e){
			obj.submit();
			obj.hide();
		}; // onclick
		
		obj.update();
		
	} // constructor
	
	update(){
		let obj = this;
		
		// Now collect all the menus that are required
		obj.requiredSelections = [];
		obj.node.querySelector("table.static").querySelectorAll("select").forEach(m=>{
			obj.requiredSelections = obj.requiredSelections.concat( obj.config.data[m.value] )
		})
		
		
		obj.clear();
		
		// Now make them
		obj.requiredSelections.forEach(d=>{
			let m = new inputObject(d);
			obj.node.querySelector("table.dynamic").appendChild( m.node );
			d.inputobj = m;
		})
		
		
	} // update
	
	
	populateFrom(c){
		let obj = this;
		
		// Run through the properties provided by c, and set existing corresponding menus to that value. This class expects a plotType, a layout, and data to be set.
		obj.config.plotType.inputobj.value = c.plotType;
		
		
		
		// Data selections
		obj.update();
		obj.requiredSelections.forEach(d=>{
			d.inputobj.value = c.data[d[1]];
		}) // forEach
		
		
		
		// Optional selections
		obj.config.layout.forEach(d=>{
			// d = [input type, variable name, default value]
			d.inputobj.value = c.layout[d[1]];
		}) // forEach
		
		
	} // populateFrom
	
	
	populateTo(c){
		let obj = this;
		
		c.plotType = obj.config.plotType.inputobj.value;
		
		
		obj.requiredSelections.forEach(d=>{
			c.data[d[1]] = d.inputobj.value;
		}) // forEach
		
		
		obj.config.layout.forEach(d=>{
			// d = [input type, variable name, default value]
			c.layout[d[1]] = d.inputobj.value;
		}) // forEach
		
		
	} // populateTo
	
	
	clear(){
		let obj = this;
		let div = obj.node.querySelector("table.dynamic");
		while(div.firstChild){
			div.removeChild(div.firstChild);
		} // while
	}
	
	show(){
		let obj = this;
		obj.node.style.display = "block";
		obj.node.className="modal fade show";
	} // show
	
	hide(){
		let obj = this;
		obj.node.style.display = "none";
        obj.node.className="modal fade";
		obj.update();
	} // hide
	
	
	submit(){
		let obj = this;
		
		
		let c = {
			plotType: undefined,
			data: {},
			layout: {},
		};
		
		// The plot is always selected anyway
		c.plotType = obj.config.plotType.inputobj.value;
		
		// An option is always selected, so no checking needed.		
		obj.config.data[c.plotType].forEach(d=>{
			c.data[d[1]] = d.inputobj.value;
		})


		// Copy the layout on it as well.
		obj.config.layout.forEach(d=>{
			c.layout[d[1]] = d.inputobj.value;
		})



		// We are using d3 to continually merge the plot data object to the corresponding DOM. To prevent plots migrating between DOMs they are joined using the unique '_id' key. This also has to be assigned here therefore, and the plotRow max '_id' needs to be adjusted also.
		c._id = obj.currentPlotRow._maxPlotId + 1;
		obj.currentPlotRow._maxPlotId = c._id;



		// Add this plot to the current plot row.	
		obj.currentPlotRow.plots.push( c );
			
		obj.onsubmit( c );
	} // submit
	
	onsubmit(c){
		// Dummy function
		console.log("submit", c)
	} // onsubmit
};




class inputObject{
	
	node = undefined
	type = undefined
	
	constructor(d){
		let obj = this;
		
		obj.type = d[0];
		
		let m;
		switch(d[0]){
			case "select":
				let options = d[2].map(n=>obj.getOption(n));
				m = `<select>${ options }</select>`;
			  break;
			  
			case "number":
			    m =`<input type="number" step="1" value="${ d[3] }" min="${ d[2][0] }" max="${ d[2][1] }"></input>`;
			  break;
			  
			case "text":
			    m = `<input type="text"></input>`;
			  break;
			  
			case "checkbox":
			    m =`<input type="checkbox" ${ d[3] ? "checked" : "" }></input>`;
			  break;
		} // switch
		
		
		
		obj.node = html2element(  `<tr>
		  <td style="padding-right: 10px;"><label>${ d[1] }</label></td>
		  <td>${ m }</td>
		</tr>` );
			
	} // constructor
	
	getOption(n){
		return `<option value="${n}">${n}</option>`
	}
	
	set value(v){
		let obj = this;
		
		let n = obj.node.querySelector( ["number", "text", "checkbox"].includes( obj.type ) ? "input" : "select" );
		if(obj.type == "checkbox"){
			n.checked = v;
		} else {
			n.value = v;
		} // if
	} // set value
	
	get value(){
		let obj = this;
		
		
		let n = obj.node.querySelector( ["number", "text", "checkbox"].includes( obj.type ) ? "input" : "select" );
		let v = obj.type == "checkbox" ? n.checked : n.value; 
		
		
		return Number(v) ? Number(v) : v;
	}
	
} // inputObject


