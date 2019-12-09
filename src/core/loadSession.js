import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';

function loadSession(){
		
	d3.json('/examples/comp3row/session.json', function(sessionData){
		
		
		
		// Loop over all the plotRows.
		var plotRows = [];
		for(var i=0;i<sessionData.plotRows.length;i++){
			var s = sessionData.plotRows[i];
			
			// Assemble the plots.
			var plots = [];
			for(var j=0;j<s.plots.length;j++){
				
				var plotToPush = {
				  plotFunc : string2function( s.plots[j].type ),
				  layout : { title : s.plots[j].title, 
						  colWidth : 4, 
							height : 300 }, 
				  data : {  cfData : dbsliceData.data, 
						 xProperty : s.plots[j].xProperty, 
						 yProperty : s.plots[j].yProperty, 
						 cProperty : s.plots[j].cProperty}
				};
				plots.push(plotToPush);
				
			}; // for
			
			var plotRowToPush = {title: s.title, 
								 plots: plots, 
								  type: s.type,
						addPlotButton : {id : "undefined", label : "Add plot"}};
			plotRows.push(plotRowToPush);
		}; // for
		
		// Finalise the session object.
		var session = {
			title : sessionData.title,
			plotRows: plotRows
		};
		
		// Store into internal object
		dbsliceData.session = session;
		
		// Render!
		render(dbsliceData.elementId, dbsliceData.session)
		
	}) // d3.json
	
	function string2function(string){
		
		var func;
		switch(string){
			case "cfD3BarChart":
				func = cfD3BarChart;
				break;
			case "cfD3Histogram":
				func = cfD3Histogram;
				break;
			case "cfD3Scatter":
				func = cfD3Scatter;
				break;
			default :
				func = undefined;
				break;
		}; // switch
		return func;
	}; // stringToFunction
	
} // loadSession

export { loadSession };