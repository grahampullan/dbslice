import { refreshTasksInPlotRows } from './refreshTasksInPlotRows.js';

function makeSessionHeader(element, title, subtitle, config) {
  element.append("div").attr("class", "row sessionHeader").append("div").attr("class", "col-md-12 sessionTitle");
  var titleHtml = "<br/><h1 style='display:inline'>" + title + "</h1>";

  if (config.plotTasksButton) {
	titleHtml += "<button class='btn btn-success float-right' id='refreshTasks'>Plot Selected Tasks</button><br/>";
  } else {
	titleHtml += "<br/>";
  }

  if (subtitle === undefined) {
	titleHtml += "<br/>";
  } else {
	titleHtml += "<p>" + subtitle + "</p>";
  }

  element.select(".sessionTitle").html(titleHtml).append("div").attr("class", "filteredTaskCount");
  $("#refreshTasks").on("click", function () {
	refreshTasksInPlotRows();
  });
}
   

export { makeSessionHeader };