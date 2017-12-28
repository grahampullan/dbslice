import { makeNewPlot } from './makeNewPlot.js';
import { updatePlot } from './updatePlot.js';

function update( elementId, session ) {

  	// this is the DOM element into which the plotRows will be inserted
	var element = d3.select( "#" + elementId );

    // select all the divs WITHIN the elmement. Each div here is a plotRow.
    // this selects all plot rows
    var plotRows = element.selectAll( ".plotRow" )
    	.data( session.plotRows ); // bind the data in the array session.plotRows with this selection

    // this makes new plot rows and selects all the plots within the plot row
    var newPlotRows = plotRows.enter()
    	.append( "div" ).attr( "class", "card bg-light plotRow" )
    	.attr( "style" , "margin-bottom:20px")
		.attr( "plotRow-id", function ( d, i ) { return i; } );

    var newPlotRowsHeader = newPlotRows	
    	.append( "div" ).attr( "class", "card-header plotRowTitle" )
    	.call( function(selection) {
    		console.log (selection);
    		selection.html( function(d) { return "<h3 style='display:inline'>"+d.title+"</h3>"});
    	});
    	//.html( "<h3 style='display:inline'>Plot row title</h3>")

    	//.call( _makePlotRowTitle )
      	//.call( _animateEnter );

    // make settings pane
    // newPlotRowsHeader.call( _makeSettingsPane );

    var newPlotRowsBody = newPlotRows
    	.append( "div" ).attr( "class", "row no-gutters plotRowBody" );

    //var noPlotsYet = newPlotRowsBody.append( "div" ).attr( "class", "noPlotsYet").html( "<p>No plots yet</p>");

    var newPlots = newPlotRowsBody
    	.selectAll( ".plot")
    	.data( function( d ) { return d.plots; } ) 
    	.enter().each( makeNewPlot );


    /////////////////////////////////////////
    // Code for updating existing elements //
    /////////////////////////////////////////

    // for updating plot type
    //// plotRows.attr( "plot-type", d => d.type );

    // for updating the plot row id
    plotRows.attr( "plotRow-id", ( d, i ) => i );

    // for existing plot rows, update header to match the data that have been changed
    // plotRows.selectAll( "div._plotRowTitle" ).call( _makePlotRowTitle );

    // update plot title
    // plotRows.selectAll( "._plotHeader" ).html( function( d ) { return d.name; } );

    // for new plots within existing plot rows
    plotRows.selectAll( ".plotRowBody" ).selectAll( ".plot" )
		.data( function( d ) { return d.plots;} )
		.enter().each( makeNewPlot );


    // for existing plots, use plotRowPlots as the update method
    var plotRowPlots = plotRows.selectAll( ".plot" )
    	.data( function( d ) { return d.plots;} )
    	.each( updatePlot );

   	var plotRowPlotWrappers = plotRows.selectAll( ".plotWrapper")
   		.data( function( d ) {return d.plots;} )
   		.each( function( plotData, index ) {
   			var plotWrapper = d3.select (this);
   			var plotTitle = plotWrapper.select(".plotTitle")
    	 	.html( `${plotData.layout.title}` );
   		});



    ////////////////////////////////
    // Code for removing elements //
    ////////////////////////////////

    // remove routine to remove plot rows and plots that are removed from layout
    plotRows.exit().remove();
    //plotRowPlots.exit().remove();
    plotRowPlotWrappers.exit().remove();
 }


export { update };