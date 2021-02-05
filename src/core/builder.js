var builder = {
		
		update: {
			
			sessionHeader: function(){
			
				let all = dbsliceData.data.cf.all()
				let filtered = dbsliceData.data.taskDim.top(Infinity)
				
				let msg = "Number of Tasks in Filter = "
				msg += filtered && filtered.length != all.length ? ( filtered.length + " / " + all.length) : "All (" + all.length + ")"
				d3.select( "#" + dbsliceData.session.elementId )
				  .select("#filteredTaskCount")
				  .html(msg)
				
				// Update the session title.
				d3.select("#sessionTitle")
				  .html(dbsliceData.session.title)
				
			}, // sessionHeader
			
			sessionBody: function(){
				
				var plotRows = d3.select("#" + dbsliceData.session.elementId)
				  .select("#sessionBody")
				  .selectAll(".plotRow")
				  .data(dbsliceData.session.plotRows);
			  
				// HANDLE ENTERING PLOT ROWS!
				var newPlotRows = builder.makePlotRowContainers(plotRows)
				
				// Make this an input box so that it can be change on te go!
				builder.makePlotRowHeaders(newPlotRows)
				
				// Give all entering plot rows a body to hold the plots.
				builder.makePlotRowBodies(newPlotRows)
			  
				// In new plotRowBodies select all the plots. Selects nothing from existing plotRows.
				builder.makeUpdatePlotRowPlots(newPlotRows)
			  			  
				// UPDATE EXISTING PLOT ROWS!!
				builder.makeUpdatePlotRowPlots(plotRows)

				
			}, // sessionBody
			
		}, // update
		
		makeSessionHeader: function makeSessionHeader() {
		
			// Check if there was a previous session header already existing. 
			var element = d3.select("#" + dbsliceData.session.elementId);
			var sessionHeader = element.select("#sessionHeader");
			

			// Add interactivity to the title. MOVE TO INIT??
			element.select("#sessionTitle")
			  .html(dbsliceData.session.title)
			  .each(function(){
				this.addEventListener("input", function(){
					dbsliceData.session.title = this.innerHTML
				})
			  }) // each
			
		  
		  
			// Plot all tasks interactivity
			element.select("#refreshTasksButton")
			  .on("click", function () {
				sessionManager.refreshTasksInPlotRows();
			  }); // on
		

			if (dbsliceData.session.subtitle !== undefined) {
				element.select("#sessionSubtitle")
				  .html(dbsliceData.session.subtitle);
			} // if
		  
			

			// Add some options.
			var sessionMenu = d3.select("#sessionOptions")
			  .select("div.dropdown-menu")
			  
			
			// Downloading a session file
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "saveSession")
				.html("Save session")
				.on("click", fileManager.exporting.session.download )
			
				
			// Bring up teh metadata creation.
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "metadataMerging")
				.html("Metadata")
				.on("click", dbsliceDataCreation.show )
			


			
		}, // makeSessionHeader
		
		updateSessionHeader: function updateSessionHeader(element){
			
			var metadata = dbsliceData.data.taskDim.top(Infinity)
			if (metadata !== undefined) {
				element.select("#filteredTaskCount")
				  .html("Number of Tasks in Filter = " + metadata.length);
			} else {
				element.select("#filteredTaskCount")
				  .html("<p> Number of Tasks in Filter = All </p>");
			}; // if
			
			// Update the session title.
			element.select("#sessionTitle")
			    .html(dbsliceData.session.title)
			
		}, // updateSessionHeader
		
		makePlotRowContainers: function makePlotRowContainers(plotRows){
			// This creates all the new plot rows.
			
			var width = d3.select( "#" + dbsliceData.session.elementId ).node().offsetWidth - 45
			
			// HANDLE ENTERING PLOT ROWS!
			var newPlotRows = plotRows.enter()
			  .append("div")
				.attr("class", "card bg-light plotRow")
				.style("margin-bottom","20px")
				.style("width", width + "px")
				.attr("plot-row-index", function (d, i) {return i;})
				.each(function(d){
					d.element = this
				})
			
			return newPlotRows
		}, // makePlotRowContainers
		
		makePlotRowHeaders: function makePlotRowHeaders(newPlotRows){
			
			var newPlotRowsHeader = newPlotRows
			  .append("div")
				.attr("class", "card-header plotRowTitle")
				.attr("type", function (d){return d.type});
				
			// Text
			newPlotRowsHeader
			  .append("h3")
				.attr("style","display:inline")
				.html( function(data){return data.title} )
				.attr("spellcheck", "false")
				.attr("contenteditable", true)
				.each(function(){
				  // Store the typed in text in the central object.
				  this.addEventListener("input", function() {
					  var newTitle = this.innerText
					  d3.select(this).each(function(obj){ obj.title = newTitle })
				  }, false);
			  }) // each
			  
			// Buttons
			newPlotRowsHeader.each(function(plotRowCtrl){
				
				var removePlotRowButton = d3.select(this)
				  .append("button")
					.attr("class", "btn btn-danger float-right removePlotButton")
					.html("x")
					.on("click", builder.interactivity.removePlotRow)
				
				// Make the 'add plot' button
				var addPlotButton = d3.select(this)
				  .append("button")
					.attr("style","display:inline")
					.attr("class", "btn btn-success float-right")
					.html("Add plot");
				addMenu.addPlotControls.make( addPlotButton, plotRowCtrl );
				
			}); // each
			
			
		}, // makePlotRowHeaders
		
		makePlotRowBodies: function makePlotRowBodies(newPlotRows){
			
			var newPlotRowsBody = newPlotRows
			  .append("div")
				.attr("class", "row no-gutters plotRowBody")
				.attr("plot-row-index", function (d, i){return i;})
				.attr("type", function (d){return d.type});
			return newPlotRowsBody
			
		}, // makePlotRowBodies
		
		makeUpdatePlotRowPlots: function makeUpdatePlotRowPlots(plotRows){
			
			var plots = plotRows
			  .selectAll(".plotRowBody")
			  .selectAll(".plot")
			  .data(function (d){return d.plots;})
			  
			// Create any new plots
			plots
			    .enter()
			    .each(plotHelpers.setupPlot.general.makeNewPlot);
			
			// Update any new plots
			plots
			  .each(function(plotCtrl){
				  plotCtrl.view.transitions = plotCtrl.plotFunc.helpers.transitions.animated()
				  plotCtrl.plotFunc.update(plotCtrl)
			  });
			  
			  
			// Adjust the plot row height
            plotRows
			  .selectAll(".plotRowBody")
              .each(function(){
                  builder.refreshPlotRowHeight( d3.select(this) )
              })
			
		}, // makeUpdatePlotRowPlots
		
		refreshPlotRowHeight: function refreshPlotRowHeight(plotRowBody){
            
            var plotRowHeight = positioning.helpers.findContainerSize(plotRowBody, ".plotWrapper")
            
            // Adjust the actual height.
            if(plotRowHeight != plotRowBody.node().offsetHeight){
                plotRowBody.style("height", plotRowHeight + "px")
            }
            
        }, // refreshPlotRowHeight
        
		refreshPlotRowWidth: function refreshPlotRowWidth(plotRowBody){
            
            // Adjust all plots to the new grid.
            
			let dy = positioning.dy(plotRowBody)
			let dx = positioning.dx(plotRowBody)
			
            plotRowBody.selectAll(".plotWrapper")
			  .style("left"  , d=> d.graphic.format.parent.offsetLeft+d.graphic.format.position.ix*dx+"px")
			  .style("top"   , d=> d.graphic.format.parent.offsetTop +d.graphic.format.position.iy*dy + "px")
              .style("width" , d=> d.graphic.format.position.iw*dx + "px")
              .style("height", d=> d.graphic.format.position.ih*dy + "px")
            
        }, // refreshPlotRowWidth
		
		
		// The basic APP interactivity.
		interactivity: {
			
			removePlotRow: function(clickedobj){
				
				// Remove the plot row from view.
				// button -> plotrowTitle -> plotRow
				var plotRowDOM = this.parentElement.parentElement
				plotRowDOM.remove()
				
				// Remove row from object
				dbsliceData.session.plotRows = dbsliceData.session.plotRows.filter(function(rowobj){
				  return rowobj != clickedobj
				}) // filter  
				  
				
				
				  
				// Remove any filters that have been removed.
				filter.remove()
				filter.apply()

				// Re-render the to update the filter
				sessionManager.render()
				
				
			}, // removePlotRow
			
		} // interactivity
		
	} // builder
	