import { cfUpdateFilters } from '../core/cfUpdateFilters.js';
import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { cfD3Scatter } from '../plot/cfD3Scatter.js';

function makeNewPlot( plotData, index ) {

    
        var plotRowIndex = d3.select(this._parent).attr("plot-row-index");
          
        var plot = d3.select(this)
          .append("div")
            .attr("class", "col-md-" + plotData.layout.colWidth + " plotWrapper")
            .attr("plottype", plotData.plotFunc.name)
          .append("div")
            .attr("class", "card");
          
          
        var plotHeader = plot
          .append("div")
            .attr("class", "card-header plotTitle");
        
        
        plotHeader
          .append("div")
            .attr("style","display:inline")
            .html(plotData.layout.title)
            .attr("spellcheck", "false")
            .attr("contenteditable", true);
            
			
			
		// Add a div to hold all the control elements.
		var controlGroup = plotHeader
		  .append("div")
		    .attr("class", "ctrlGrp float-right")
			.attr("style", "display:inline-block")
		
          
        var plotBody = plot
          .append("div")
            .attr("class", "plot")
            .attr("plot-row-index", plotRowIndex)
            .attr("plot-index", index);
              
        plotData.plotFunc.make(plotBody.node(), plotData.data, plotData.layout);
		
		
		
        // Redraw the plot on window resize!
        $(window).resize(  function(){
			// Check if the element containing the plot to be resized is still in the visible dom (document). If not, then do not resize anything, as that will cause errors.
			if( document.body.contains(plotBody.node()) ){
				
				// Use the data assigned to the node to execute the redraw.
				d3.select(plotBody.node()).each(function(d){
					d.layout.isWindowResized = true
					d.plotFunc.update( plotBody.node(), d.data, d.layout );
					d.layout.isWindowResized = false
				}) // each
				
			    
			} // if
            
        }  );
		

    } // makeNewPlot


export { makeNewPlot };