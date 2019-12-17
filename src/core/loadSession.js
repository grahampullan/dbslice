import { render } from '../core/render.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { cfD3BarChart } from '../plot/cfD3BarChart.js';
import { cfD3Histogram } from '../plot/cfD3Histogram.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';

const loadSession = {
		
	handler: function handler(file){
		
		// Split the name by the '.', then select the last part.
		var extension = file.name.split(".").pop();
		
		switch(extension){
			
			case "json":
				loadSession.json(file.name);
				break;
				
			default:
				window.alert("Selected file must be either .csv or .json")
				break;
		}; // switch
		
	}, // handler
	
	json: function json(filename){
		
		// To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. NOT THE MOST ELEGANT, OR NICE TO SEE IN ACTION, BUT IT GETS THE JOB DONE.
		d3.selectAll(".plotRow").remove();
		
		d3.json(filename, function(sessionData){
			
			// Check if it is a session file!
			if (sessionData.isSessionObject === "true"){
				
				
				var plotRows = loadSession.helpers.assemblePlotRows(sessionData.plotRows);
				
				// Finalise the session object.
				var session = {
					title : sessionData.title,
					plotRows: plotRows
				};
				
				// Store into internal object
				dbsliceData.session = session;
				
				// Render!
				render(dbsliceData.elementId, dbsliceData.session)
				
			} else {
				window.alert("Selected file is not a valid session object.")
			}; // if
			
			
			
		}) // d3.json
		
	}, // json
	
	helpers: {
		
		string2function: function string2function(string){
			
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
			
		}, // string2function
		
		assemblePlots: function assemblePlots(plotsData){
			
			// Assemble the plots.
			var plots = [];
			for(var j=0;j<plotsData.length;j++){
				
				var plotToPush = {
				  plotFunc : loadSession.helpers.string2function( plotsData[j].type ),
				  layout : { title : plotsData[j].title, 
						  colWidth : 4, 
							height : 300 }, 
				  data : {  cfData : dbsliceData.data, 
						 xProperty : plotsData[j].xProperty, 
						 yProperty : plotsData[j].yProperty, 
						 cProperty : plotsData[j].cProperty}
				};
				plots.push(plotToPush);
				
			}; // for
			
			return plots;
			
		}, // assemblePlots
		
		assemblePlotRows: function assemblePlotRows(plotRowsData){
			
			// Loop over all the plotRows.
			var plotRows = [];
			for(var i=0;i<plotRowsData.length;i++){
				
				var plotRowToPush = {title: plotRowsData[i].title, 
									 plots: loadSession.helpers.assemblePlots(plotRowsData[i].plots), 
									  type: plotRowsData[i].type,
							addPlotButton : true	}
				plotRows.push(plotRowToPush);
			}; // for
			
			return plotRows;
			
		} // assemblePlotRows
		
	} // helpers
	
} // loadSession

export { loadSession };