import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

function update( elementId = dbsliceData.elementId, session = dbsliceData.session ) {

	var element = d3.select( "#" + elementId );


	// Update the exploration session title.
    if (dbsliceData.filteredTaskIds !== undefined){
        element.select(".filteredTaskCount")
            .html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>" );
    } else {
        element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
    }


	// First add/remove entire plot-rows.
    var plotRows = element.selectAll( ".plotRow" )
    	.data( session.plotRows, k => k._id ); 

    var newPlotRows = plotRows.enter()
    	.append( "div" )
		    .attr( "class", "card bg-light plotRow" )
    	    .attr( "style" , "margin-bottom:20px")
            .attr( "plot-row-index", function(d, i) { return i; } );


    var newPlotRowsHeader = newPlotRows	
    	.append( "div" )
		  .attr( "class", "card-header plotRowTitle" )
    	  .call( function(selection) {
    		  selection.html( function(d) {
                let html = "<h3 style='display:inline'>" + d.title + "</h3>";
                if ( d.headerButton !== undefined ){
                    html += "<button class='btn btn-success float-right' id='" + d.headerButton.id + "'>" + d.headerButton.label +"</button>"
                }
				
                return html;
              });
          });

    var newPlotRowsBody = newPlotRows
    	.append( "div" ).attr( "class", "row no-gutters g-1 plotRowBody" )
        .attr ("plot-row-index", function(d, i) { return i; });
		
		
	// ADD PLOT BUTTON
	// Add plot button option can be explicitly stated by the user as true/false, if not specified thedecision falls back on whether the plot row is metadata or on-demand.
	newPlotRowsHeader
	  //.filter(d=> d.addPlotButton == undefined ? !d.ctrl : d.addPlotButton )
	  .filter(d=> d.addPlotButton) 
	  .append("button")
	  .attr("class", "btn addPlot")
	  .attr("data-bs-toggle","modal")
	  .attr("data-bs-target","#addPlotModal")
	  .style("float", "right")
	  .style("cursor", "pointer")
	  .style("border", "2px solid gray")
	  .style("padding", "3px 6px 3px 6px")
	  .html('<box-icon name="plus" size="sm"></box-icon>')
	  .on("click", function(d){
		  d3.event.stopPropagation();
		  dbsliceData.modal.currentPlotRow = d;
		  dbsliceData.modal.show();
	  })
	  
	  
	// ADD COLLAPSE BUTTON
	newPlotRowsHeader.append("button")
	    .attr("class", "btn collapseRow")
		.style("float", "right")
		.style("cursor", "pointer")
		.style("border", "2px solid gray")
	    .style("padding", "3px 6px 3px 6px")
		.html('<box-icon name="collapse-alt" size="sm"></box-icon>')
		.on("click", function(){

			// Add in the functionality to collapse/expand the corresponding plotRowBody.
			let elementToCollapse = this.parentElement.parentElement.querySelector("div.plotRowBody");
			let isHidden = elementToCollapse.style.display === "none";
			elementToCollapse.style.display = isHidden ? "" : "none";
			
			// Change the button icon
			this.querySelector("box-icon").setAttribute("name", isHidden ? "collapse-alt" : "expand-alt");
			
			
			update()
			
		});
	 

	// After the plot rows have been handled update the actual plots.
    var newPlots = newPlotRowsBody.selectAll( ".plot")
    	.data( d => d.plots, k => k._id ) 
    	.enter().each( makeNewPlot );

    plotRows.selectAll( ".plotRowBody" ).selectAll( ".plot" )
		.data( d => d.plots, k => k._id  )
		.enter().each( makeNewPlot );

	
    var plotRowPlots = plotRows.selectAll( ".plot" )
    	.data( d => d.plots, k => k._id  )
		.filter(function(){
			// Existing plots may have been collapsed, which will impact rendering. Filter them out so they are not being updated when collapsed.
			let parentPlotRow = this.parentElement.parentElement.parentElement;
			return parentPlotRow.style.display != "none"
		})
    	.each( updatePlot );


	// Update the plot titles
   	var plotRowPlotWrappers = plotRows.selectAll( ".plotWrapper")
   		.data( d => d.plots, k => k._id  )
   		.each( function( plotData, index ) {
   			var plotWrapper = d3.select (this);
   			var plotTitleText = plotWrapper.select(".plotTitleText")
    	 	.html( plotData.layout.title );
   		});
	
	
	
	
	
	
	
	

    plotRows.exit().remove();
    plotRowPlotWrappers.exit().remove();



}











export { update };