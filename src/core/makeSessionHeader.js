import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';
import { downloadCurrentTasks } from './downloadCurrentTasks.js';

function makeSessionHeader( element, title, subtitle, config ) {

	element.append( "div" )
		.attr( "class" , "row sessionHeader" )
		.append( "div" )
			.attr( "class" , "col-md-12 sessionTitle" );

	let titleHtml="";

	if (title !== undefined) {

		titleHtml += `<br/><h1 style='display:inline'>${title}</h1>`;

	}

	if ( config.plotTasksButton ) {

		let buttonLabel = "Plot Selected Tasks";
        if (config.replaceTasksNameWith !== undefined) {
            buttonLabel = `Plot Selected ${config.replaceTasksNameWith}`;
        }

		titleHtml += `<button class='btn btn-success mr-1 float-right float-end' id='refreshTasks'>${buttonLabel}</button>`;

	}

	if ( config.saveTasksButton ) {

		let buttonLabel = "Save Selected Tasks";
        if (config.replaceTasksNameWith !== undefined) {
            buttonLabel = `Save Selected ${config.replaceTasksNameWith}`;
        }

		titleHtml += `<button class='btn btn-success mr-1 float-right float-end' id='downloadTasks'>${buttonLabel}</button>`;

	}

	titleHtml += "<br/>";
	
	if ( subtitle === undefined ) {

		titleHtml += "<br/>";

	} else {

		titleHtml += "<p>" + subtitle + "</p>";

	}

	element.select( ".sessionTitle" )
		.html( titleHtml )
		.append( "div" )
			.attr( "class" , "filteredTaskCount" );	


	if ( config.plotTasksButton ) {
		document.getElementById("refreshTasks").onclick = function() { refreshTasksInPlotRows() };
	}

	if ( config.downloadCurrentTasks) {
		document.getElementById("downloadTasks").onclick = function() { downloadCurrentTasks() };
	}

}

export { makeSessionHeader };