import { update } from './update.js';
import { dbsliceData } from './dbsliceData.js';
import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';

function render( elementId, session, redraw, animate, preserveScrollPosition ) {

	// save layout object into the global namespace
	//_dbslice.layout = layout;

	dbsliceData.session = session;
	dbsliceData.elementId = elementId;
	//console.log(dbsliceData.elementId);

	var element = d3.select( "#" + elementId );

	var sessionHeader = element.select(".sessionHeader");
    if ( sessionHeader.empty() ) {
        element.append("div")
        	.attr("class", "row sessionHeader")
        	.append("div")
        		.attr("class", "col-md-12 sessionTitle");

        if (session.subtitle === undefined) {
        	element.select(".sessionTitle")
        	.html("<br/><h1 style='display:inline'>"+session.title+"</h1><button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/><br/>");
        } else {
        	element.select(".sessionTitle")
        	.html("<br/><h1 style='display:inline'>"+session.title+"</h1><button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/><p>"+session.subtitle+"</p>");
        }
        element.select(".sessionTitle").append("div")
        	.attr("class","filteredTaskCount");	
        $("#refreshTasks").on("click", function() { refreshTasksInPlotRows() });
    }

    if (session.filteredTaskIds !== undefined){
    	element.select(".filteredTaskCount")
    		.html("<p> Number of tasks in Filter = "+session.filteredTaskIds.length+"</p>");
    }


	// handle optional arguments
	var redraw = ( typeof redraw === 'undefined' ) ? false : redraw;
	var animationEnabled = ( typeof animate === 'undefined' ) ? true : animate;
	var preserveScrollPosition = ( typeof preserveScrollPosition === 'undefined' ) ? true : preserveScrollPosition;

	if ( preserveScrollPosition ) var currentScroll = document.body.scrollTop;
	if ( redraw ) animationEnabled = false;

	if ( redraw ) {
		// redraws the entire plot container
		//_allPlotsContainer.remove();
		//_allPlotsContainer = d3.select( "body" ).append( "div" )
		//  .attr( "id", "_allPlotsContainer" )
		//  .attr( "class", "container-fluid" );
		element.selectAll("div").remove();
	}

	update( elementId, session );
	if ( preserveScrollPosition ) document.body.scrollTop = currentScroll;

  }

export { render };