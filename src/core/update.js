import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';
import { dbsliceData } from '../core/dbsliceData.js';
import * as d3 from 'd3';

function update( elementId = dbsliceData.elementId, session = dbsliceData.session ) {

	var element = d3.select( "#" + elementId );

    if (dbsliceData.filteredTaskIds !== undefined){
        element.select(".filteredTaskCount")
            .html("<p> Number of Tasks in Filter = " + dbsliceData.filteredTaskIds.length + "</p>" );
    } else {
        element.select(".filteredTaskCount").html("<p> Number of Tasks in Filter = All </p>");
    }

    var plotRows = element.selectAll( ".plotRow" )
    	.data( session.plotRows ); 

    var newPlotRows = plotRows.enter()
    	.append( "div" ).attr( "class", "card bg-light plotRow" )
    	.attr( "style" , "margin-bottom:20px")
        .attr( "plot-row-index", function(d, i) { return i; } );


    var newPlotRowsHeader = newPlotRows	
    	.append( "div" ).attr( "class", "card-header plotRowTitle" )
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

    var newPlots = newPlotRowsBody.selectAll( ".plot")
    	.data( function( d ) { return d.plots; } ) 
    	.enter().each( makeNewPlot );

    plotRows.selectAll( ".plotRowBody" ).selectAll( ".plot" )
		.data( function( d ) { return d.plots; } )
		.enter().each( makeNewPlot );

    var plotRowPlots = plotRows.selectAll( ".plot" )
    	.data( function( d ) { return d.plots; } )
    	.each( updatePlot );

   	var plotRowPlotWrappers = plotRows.selectAll( ".plotWrapper")
   		.data( function( d ) { return d.plots; } )
   		.each( function( plotData, index ) {
   			var plotWrapper = d3.select (this);
   			var plotTitle = plotWrapper.select(".plotTitle")
    	 	.html( plotData.layout.title );
   		});

    plotRows.exit().remove();
    plotRowPlotWrappers.exit().remove();



}



export { update };