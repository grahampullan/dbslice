import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';
import { crossPlotHighlighting } from '../core/crossPlotHighlighting.js';
import { filter } from '../core/filter.js';
import { color } from '../core/color.js';
import { plotHelpers } from '../plot/plotHelpers.js';
import { importExportFunctionality } from '../core/importExportFunctionality.js';

const cfD3Line = {
		// • report to the user info about the data (missing, duplicated, intersect clashes, maybe even the things that will yield the largest addition of data to the screen)
	
		name: "cfD3Line",
	
		make: function(ctrl){
		
			// This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
			
			
			
			var hs = plotHelpers.setupPlot
			var hi= plotHelpers.setupInteractivity.twoInteractiveAxes
			var i = cfD3Line.addInteractivity
			
			// Add the manual selection toggle to its title.
			hs.twoInteractiveAxes.updatePlotTitleControls(ctrl)
			
			// Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.
			hs.twoInteractiveAxes.setupPlotBackbone(ctrl)
			
			// Create the svg with all required children container groups and append it to the appropriate backbone div.
			hs.general.rescaleSvg(ctrl)
			
			
			
			
			// Add in the controls for the y axis.
			hs.general.appendVerticalSelection( ctrl.figure.select(".leftAxisControlGroup"),
                                       hi.onSelectChange.vertical(ctrl) )
			
			// Add in the controls for the x axis.
			hs.general.appendHorizontalSelection( ctrl.figure.select(".bottomAxisControlGroup"),
										 hi.onSelectChange.horizontal(ctrl) )
			
			
			// General interactivity
			hi.addZooming(ctrl)
			i.createLineTooltip(ctrl)
			
			// Scaling of the axes
			hi.addAxisScaling(ctrl)
			
			
			// Button menu custom functionality. On first make it should host the slice id options.
			var sliceOption = {
				name: "Slice Id",
				val: undefined,
				options: dbsliceData.data.sliceProperties,
				event: function(ctrl, d){ctrl.view.sliceId = d}
			} // sliceOption
			
			hs.twoInteractiveAxes.buttonMenu.make(ctrl)
			hs.twoInteractiveAxes.buttonMenu.update(ctrl, [sliceOption])
			
			// But it will try to draw when this is updated...

			
		
		}, // make
		
				
		update: function update(ctrl){
			// This function re-intialises the plots based on the data change that was initiated by the user.
			
			// Update re-selects the data to be drawn, and then refreshes the view.
			
			
			// Remove all the previously stored promises, so that only the promises required on hte last redraw are retained.
			ctrl.data.promises = []
			
			
			// GETDATAINFO should be launched when new data is loaded for it via the 'refresh' button, and when a different height is selected for it. Otherwise it is just hte data that gets loaded again.
			cfD3Line.helpers.getLineDataInfo(ctrl)
			
			
			
			// The data must be retrieved here. First initialise the options.
			if(ctrl.data.intersect != undefined){
				cfD3Line.setupPlot.updateUiOptions(ctrl)
			} // if
			
			
			// Rescale the svg in event of a redraw.
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			
			// Setup the plot tools
			cfD3Line.setupPlot.setupPlotTools(ctrl)
			
			// Call the refresh function which readjust the plot elements.
			cfD3Line.refresh(ctrl)
		
		}, // update
	

		refresh: function refresh(ctrl){
			
			if(ctrl.data.compatible.length > 0){
			
			// Update the axes
			cfD3Line.helpers.axes.update(ctrl)
			
			
			
			// If this is a split variable case then the accessors need to return the appropriate array. If not they can just return the values.
			// It was assumed that the d3 data join process only stores the reference to the data, and therefore to minimise memory usage the original underlying data is used to join to the elements, meaning that the accessor needs to do the final transform before the plotting.
			
			
			function draw(d){ 
				return ctrl.tools.line( cfD3Line.helpers.getLineDataVals(d, ctrl) ) 
			} // draw
			
			function getTaskId(d){
				return d.task.taskId
			} // getTaskId
			
			function getColor(d){
				return color.get(d.task[color.settings.variable])
			} // getColor
			
			var clipPath = "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")"
			
			
			

			
			 // Assign the data
            var allSeries = ctrl.figure.select("svg.plotArea")
			  .select("g.data")
			  .selectAll( ".plotSeries" )
			  .data( ctrl.data.compatible );

            // Enter/update/exit
            allSeries.enter()
              .each( function() {
                  var series = d3.select( this );
                  var seriesLine = series.append( "g" )
                      .attr( "class", "plotSeries")
					  .attr( "task-id", getTaskId)
                      .attr( "clip-path", clipPath)
                    .append( "path" )
                      .attr( "class", "line" )
                      .attr( "d", draw )
                      .style( "stroke", getColor ) 
                      .style( "fill", "none" )
                      .style( "stroke-width", "2.5px" );
				
				  // Add a tooltip to this line
				  cfD3Line.addInteractivity.addLineTooltip(ctrl, seriesLine.node() )
	
				  // Add the option to select this line manually.
				  cfD3Line.addInteractivity.addSelection( seriesLine.node() );
            });

			// update: A bit convoluted as the paths have a wrapper containing some information for ease of user inspection in dev tools.
            allSeries.each( function() {
                var series = d3.select( this )
					.attr( "task-id",  getTaskId);
			})	
				
            allSeries.selectAll( "path.line" )
				  .transition()
				  .duration(ctrl.view.transitions.duration)
                  .attr( "d", draw )
				  .style( "stroke", getColor )
				   
            allSeries.exit().remove();
			
			} // if
		
		}, // refresh
	
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated
			plotHelpers.setupTools.go(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3Line.refresh(ctrl)
			
		}, // rescale
	
	
		setupPlot: {
			// This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
	
			updateUiOptions: function updateUiOptions(ctrl){
				// The current view options may differ from the available data options. Therefore update the corresponding elements here.
				
				ctrl.data.intersect.userOptions.forEach(function(dataOption){
					// For each different option that can be queried in the available compatible data, check if an option in the view is already selected, what it's value is, and update the value if it is not in the new set.
					
					var viewOption = cfD3Line.helpers.findObjectByAttribute( ctrl.view.options, "name", [dataOption.name], true )
					
					if(viewOption.length == 0){
						ctrl.view.options.push({
							   name: dataOption.name,
							   val : dataOption.options[0],
							options: dataOption.options
						})
					} else {
						
						updateOption(viewOption, dataOption)
					
					} // if
					
				}) // forEach
				
				
				// Do the same for the x and y axis options
				if(ctrl.view.xVarOption == undefined){
					ctrl.view.xVarOption = ctrl.data.intersect.varOptions.x
				} else {
					updateOption(ctrl.view.xVarOption, ctrl.data.intersect.varOptions.x)
				} // if
				
				
				if(ctrl.view.yVarOption == undefined){
					ctrl.view.yVarOption = ctrl.data.intersect.varOptions.y
				} else {
					updateOption(ctrl.view.yVarOption, ctrl.data.intersect.varOptions.y)
				} // if
				
				
				// Handle the options corresponding to fixed UI elements.
				var gh = plotHelpers.setupPlot.general
				var h = plotHelpers.setupPlot.twoInteractiveAxes
				
				gh.updateVerticalSelection(ctrl)
				gh.updateHorizontalSelection(ctrl)
				
				
				// Handle the options of the 'button menu'
				// Manually create the color option.
				if(ctrl.view.cVarOption == undefined){
					ctrl.view.cVarOption = {    
						   name: "Color",
						    val: "none",
					    options: dbsliceData.data.metaDataProperties, 
						  event: h.buttonMenu.options.groupColor
					} // cVarOption
				} // if
				
				
				
				
						
						
						
				// HERE UPDATE THE BUTTON HARMONICA OPTIONS TOO!!	
				h.buttonMenu.update(ctrl, assembleButtonMenuOptions() )
				
				
				// Helpers
				
				function updateOption(viewOption, dataOption){

					// If the option does exist, then just update it.
					if(!dataOption.options.includes( viewOption.val )){
						// The new options do not include the previously selected option value. Initialise a new one.
						viewOption.val = dataOption.options[0]
					} // if
					
					viewOption.options = dataOption.options
					
				} // updateOption
				
				function assembleButtonMenuOptions(){
					// The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
					
					// Make a custom option that fires an aspect ratio readjustment.
					var arOption = {
						name: "AR",
						val: undefined,
						options: ["User / Unity"],
						event: h.buttonMenu.options.toggleAR
					} // arOption
					
					
					// Make functionality options for the menu.
					var codedPlotOptions = [ctrl.view.cVarOption, arOption]
					
					return codedPlotOptions.concat( ctrl.view.options )
					
				} // assembleButtonMenuOptions
				
			}, // updateUiOptions
		
			// Functionality required to setup the tools.
			setupPlotTools: function setupPlotTools(ctrl){
				
				// Setup the scales for plotting.
				plotHelpers.setupTools.go(ctrl)
				
				// Make the required line tool too!
				// The d3.line expects an array of points, and will then connect it. Therefore the data must be in some form of: [{x: 0, y:0}, ...]
				ctrl.tools.line = d3.line()
					.x( function(d){ return ctrl.tools.xscale( d.x ) } )
					.y( function(d){ return ctrl.tools.yscale( d.y ) } );
				
			}, // setupPlotTools
			
			findPlotDimensions: function findPlotDimensions(svg){
			
				return {x: [0, Number( svg.select("g.data").attr("width") )],     y: [Number( svg.select("g.data").attr("height") ), 0]}
			
			
			}, // findPlotDimensions
				
			findDomainDimensions: function findDomainDimensions(ctrl){
			
				// The series are now an array of data for each of the lines to be drawn. They possibly consist of more than one array of values. Loop over all to find the extent of the domain.
				var h = cfD3Line.helpers
				
				var seriesExtremes = ctrl.data.compatible.map(function(file){
				
					var plotData = h.getLineDataVals(file, ctrl)
					
					return {x: [d3.min(plotData, function(d){return d.x}),
 					            d3.max(plotData, function(d){return d.x})], 
					        y: [d3.min(plotData, function(d){return d.y}),
 					            d3.max(plotData, function(d){return d.y})]
							}
				}) // map
				
				var xExtremesSeries = h.collectObjectArrayProperty( seriesExtremes , "x")
				var yExtremesSeries = h.collectObjectArrayProperty( seriesExtremes , "y")
				
			
				
				return {x: [d3.min(xExtremesSeries), d3.max(xExtremesSeries)], 
					    y: [d3.min(yExtremesSeries), d3.max(yExtremesSeries)]}
						
				
				// Helpers
				
				
			} // findDomainDimensions
			
		
		}, // setupPlot
	
		addInteractivity: {
				
			// Tooltips
			createLineTooltip: function createLineTooltip(ctrl){
				// The tooltips are shared among the plots, therefore check if the tooltip is already available first.
				
				
				if(ctrl.view.lineTooltip == undefined){
					ctrl.view.lineTooltip = createTip()
				} // if
				
				
				
				function createTip(){
					
					// Cannot erase these by some property as there will be other tips corresponding to other plots with the same propertry - unless they are given a unique id, which is difficult to keep track of.
					var tip = d3.tip()
						.attr('class', 'd3-tip')
						.attr("type", "cfD3LineLineTooltip")
						.offset([-15, 0])
						.html(function (d) {
							return "<span>" + d.task.label + "</span>";
						});
						
						ctrl.figure.select("svg.plotArea").call( tip );
					
					
				  return tip
					
				} // createTip
				
			}, // createLineTooltip
			
			addLineTooltip: function addLineTooltip(ctrl, lineDOM){
			  
				// This controls al the tooltip functionality.
			  
				var lines = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("g.plotSeries");
			  
				lines.on("mouseover", tipOn)
					 .on("mouseout", tipOff);
			   
				  
				function tipOn(d) {
					lines.style("opacity", 0.2);
					d3.select(this)
						.style("opacity", 1.0)
						.style( "stroke-width", "4px" );
					
					
					var anchorPoint = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.background")
					  .select(".anchorPoint")
						.attr( "cx" , d3.mouse(this)[0] )
						.attr( "cy" , d3.mouse(this)[1] );
					
					ctrl.view.lineTooltip.show(d, anchorPoint.node());
					
					crossPlotHighlighting.on(d, "cfD3Line")
					
				}; // tipOn

				function tipOff(d) {
					lines.style("opacity", 1.0);
					d3.select(this)
						.style( "stroke-width", "2.5px" );
					
					ctrl.view.lineTooltip.hide();
					
					crossPlotHighlighting.off(d, "cfD3Line")
					
				}; // tipOff
			  
			  
			}, // addLineTooltip
			
			

			// Legacy
			addSelection: function addSelection(lineDOM){
				// This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
				
				d3.select(lineDOM).on("click", selectLine)
				
				
				
				function selectLine(d){
					// Toggle the selection
					var p = dbsliceData.data.manuallySelectedTasks
					
					// Is this point in the array of manually selected tasks?
					var isAlreadySelected = p.indexOf(d.task.taskId) > -1

					
					if(isAlreadySelected){
						// The poinhas currently been selected, but must now be removed
						p.splice(p.indexOf(d.task.taskId),1)
					} else {
						p.push(d.task.taskId)
					}// if
					
					
					// Highlight the manually selected options.
					crossPlotHighlighting.manuallySelectedTasks()
					
				} // selectPoint
				
			}, // addSelecton
			

		}, // addInteractivity
		
		helpers: {
		
			// Initialisation
			createDefaultControl: function createDefaultControl(){
			
				// data:
				 
				// • .promises are promises completed before drawing the graphics.
				// • .requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
				// • .available is an array of urls which were found in the central booking,
				// • .missing                              NOT found
				// • .dataProperties is a string array of properties found in the data.
				// • .data is an array of n-data arrays of the n-task slice files.
				
				
				var ctrl = {
				    plotFunc: cfD3Line,
					figure: undefined,
					svg: undefined,
					data: {promises: [],
					       requested: [],
						   available: [],
						   duplicates: [],
					       missing : [],
						   compatible: [],
						   incompatible: [],
						   intersect: [],
						   series: [],
						   processor: importExportFunctionality.importing.processor.csv2line
					       },
					view: {sliceId: undefined,
					       options: [],
						   viewAR: NaN,
						   dataAR: NaN,
						   xVarOption: undefined,
						   yVarOption : undefined,
						   cVarOption : undefined,
						   lineTooltip: undefined,
						   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0								
							   },
						   t: undefined
						   },
					tools: {xscale: undefined,
							yscale: undefined},
					format: {
						title: "Edit title",
						colWidth: 4,
						width: undefined,
						height: 400,
						margin: {top: 10, right: 10, bottom: 38, left: 30},
						axesMargin: {top: 20, right: 20, bottom: 16, left: 30}
						}
				} // ctrl
				
				
				return ctrl
			
			}, // createDefaultControl
		
			createLoadedControl: function createLoadedControl(plotData){
				
				var ctrl = cfD3Line.helpers.createDefaultControl()
				
				// If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.
				if(plotData.sliceId != undefined){
					if(dbsliceData.data.sliceProperties.includes(plotData.sliceId)){
						ctrl.view.sliceId = plotData.sliceId
					} // if
				} // if
				
				// When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.
											
				return ctrl
				
				
			}, // createLoadedControl
			
			writeControl: function writeControl(ctrl){
				
				var s = ""
				s = s + '{';
				s = s + '"type": "' + ctrl.plotFunc.name + '", ';
				s = s + '"title": "' + ctrl.format.title + '"';
				  
				  
				// For metadata plots at least the x variable will be available from the first draw of the plot. For scatter plots both will be available.
				// Slice plots have the user select the data SOURCE, as opposed to variables, and therefore these will be undefined when the plot is first made. For slice plots a sliceId is stored.
				  
				var sliceId = accessProperty( ctrl.view, "sliceId" )
				
				s = s + writeOptionalVal("sliceId", sliceId)
				
				s = s + '}';
				
				return s
				
				function writeOptionalVal(name, val){
					var s_ = ""
					if (val !== undefined) {
					  s_ = s_ + ', ';
					  s_ = s_ + '"' + name + '": "' + val + '"';
					} // if
					return s_
					
				} // writeOptionalVal
				
				function accessProperty(o,p){
					// When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
					// This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
					return o==undefined? undefined : o[p]
				} // accessProperty
				
			}, // writeControl
			
			// Interactivity
		
			axes: {
				
				update: function update(ctrl){
				
					var xAxis = d3.axisBottom( ctrl.tools.xscale ).ticks(5);
					var yAxis = d3.axisLeft( ctrl.tools.yscale );
				
					ctrl.figure.select("svg.plotArea").select(".axis--x").call( xAxis )
					ctrl.figure.select("svg.plotArea").select(".axis--y").call( yAxis )
					
					cfD3Line.helpers.axes.updateTicks(ctrl)
				
				}, // update
				
				updateTicks: function updateTicks(ctrl){
				  
					// Update all the axis ticks.
					ctrl.figure
					  .select("svg.plotArea")
					  .select(".axis--x")
					  .selectAll(".tick")
					  .selectAll("text")
						 .style("cursor", "ew-resize")
					   
					ctrl.figure
					  .select("svg.plotArea")
					  .select(".axis--y")
					  .selectAll(".tick")
					  .selectAll("text")
						 .style("cursor", "ns-resize")
					   
					ctrl.figure
					  .select("svg.plotArea")
					  .selectAll(".tick")
					  .selectAll("text")
					    .on("mouseover", function(){d3.select(this).style("font-weight", "bold")})
					    .on("mouseout" , function(){d3.select(this).style("font-weight", "normal")})
				}	// updateTicks
			
			}, // axes
		
			transitions: {
				instantaneous: function instantaneous(){
				
					return {
						duration: 0,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				} // animated
			}, // transitions
		
			
			// Data retrieval
			getLineDataProperties: function getLineDataProperties(file, ctrl){
				// 'getLineDataProperties' applies the filters selected by the user to the array of properties under file.properties, and retrieves the ones relevant to the currently selected view.
				
				// Retrieve the properties
				var properties = file.data.properties
			
				// Handle other user properties.	
				ctrl.view.options.forEach(function(option){
					properties = cfD3Line.helpers.findObjectByAttribute( properties, option.name, [option.val], false)
				})
				
				// Handle flow variable selection.
				// properties = cfD3Line.helpers.findObjectByAttribute( properties, "varName", [ctrl.view.yVarOption.val], false)
			
			
				return properties
			}, // getLineDataProperties
			
			getLineData: function getLineData(file, ctrl){
			
				// Assemble an array that can be plotted using d3.line. This must be an array with an element in it corresponding to each point.
				
				var properties = cfD3Line.helpers.getLineDataProperties(file, ctrl)
				
				// Start on suction side, and then add onto it the pressure side. The appropriate rotation should already have been made.
				var xVals = assembleParameterValues(properties, "x")
				var yVals = assembleParameterValues(properties, "y")
				
				// Now weave these together into an array of objects that contains both x and y properties.
				var plotData = []
				for(var i=0; i<xVals.length; i++){
					plotData.push({x: xVals[i], y: yVals[i]})
				} // for
				
				return plotData
				
				
				function assembleParameterValues(properties, axis){
					// 'assembleParameterValues' takes the properties belonging to a flo parameter, and assembles them as per the expected hardcoded format.
					// It expects properties is an array of 4 properties corresponding to the ss_x, ss_y, ps_x, ps_y properties, in that order. It then assembles then ss + ps, assuming the ps values have already been reversed
					var h = cfD3Line.helpers.findObjectByAttribute
				
					var axisProperties = h( properties, "axis", [axis], false)
					
					var ssProperty = h( axisProperties, "side", ["ss"], true)
					var psProperty = h( axisProperties, "side", ["ps"], true) 
					
					return ssProperty.val.concat(psProperty.val)
				
				} // assembleParameterValues
				
			
			}, // getLineData
			
			getLineDataVals: function getLineDataVals(file, ctrl){
				// Make a distinction between accessing explicit and implicit data files.
				
				// Properties after applying all hte options.
				var properties = cfD3Line.helpers.getLineDataProperties(file, ctrl)
				
				// For explicit variables this will return an empty array. For implicit variables it will return a single property in an array.
				var xProperties = cfD3Line.helpers.findObjectByAttribute( properties, "varName", [ctrl.view.xVarOption.val], false)
					
				// For implicit variables it will return a single property in an array.
				var yProperties = cfD3Line.helpers.findObjectByAttribute( properties, "varName", [ctrl.view.yVarOption.val], false)
				
				
				var xVals
				var yVals
				switch( file.data.type ){
					case "explicit":
						xVals = assembleParameterValues(yProperties, "x")
						yVals = assembleParameterValues(yProperties, "y")
					
						break;
						
					case "implicit":
						xVals = xProperties[0].val
						yVals = yProperties[0].val
					
						break;
				
				} // switch
				

				
				
				// Weave the x and y vals together into a format expected by 'd3.line'
				var plotData = []
				for(var i=0; i<xVals.length; i++){
					plotData.push({x: xVals[i], y: yVals[i]})
				} // for
				
				return plotData
			
			
				function assembleParameterValues(properties, axis){
				
					
				
					
				
					// 'assembleParameterValues' takes the properties belonging to a flo parameter, and assembles them as per the expected hardcoded format.
					// It expects properties is an array of 4 properties corresponding to the ss_x, ss_y, ps_x, ps_y properties, in that order. It then assembles then ss + ps, assuming the ps values have already been reversed
					var h = cfD3Line.helpers.findObjectByAttribute
				
					var axisProperties = h( properties, "axis", [axis], false)
					
					var ssProperty = h( axisProperties, "side", ["ss"], true)
					var psProperty = h( axisProperties, "side", ["ps"], true) 
					
					return ssProperty.val.concat(psProperty.val)
				
				} // assembleParameterValues
				
			}, // getLineDataVals
			
			getLineDataInfo: function getLineDataInfo(ctrl){
			
				// Should duplicate plotting be allowed? If the user asks for it then it should, but a reminder should be given that some tasks have the same entry in this particular slice.
				
				// THE DATA PROCESSING SHGOULD BE RETHOUGHT SO THAT THE DATA IN THE MEMORY IS NOT DUPLICATED!!
				// Pair the available files with the takss that require them. In case two tasks call for the same file the task id's can be applied appropriately. Not sure where exactly this is useful, but it makes the functionality more user proof.
				// This would mean that either the data needs to be duplicated, the taskIds would overwrite themselves, or that an array of taskIds would be required.
				// The last option seems most sensible, 
				// The RRDPLCP2JSON transformation creates a new object -> duplication of data and memory usage. Would d3 nests be more useful? Nests will be more useful, and moreover - the data for the plotting can be removed after the scope finished. On next pass it'll have to be read again anyway.
				// IT MIGHT BE BEST for the plotting function to interpret the data by series, as in that way only a particular series would enter teh memory, and would subsequently be immediately deleted.
						
				// This plot plots the slices through the domains of all currently filtered tasks. It is only refreshed on user prompt to avoid loading too large amounts of data all the time, which would slow down other interactivity. Therefore at certain times it will not be showing data of all the tasks in the filter. Therefore also collect here all the files that the plot wants, but are unavailable.
				
				
				
				var requiredTasks = dbsliceData.data.dataDims[0].top(Infinity)
				
				var requiredUrls = requiredTasks.map( getUrl )
				
				// This is the set of urls of all files that have been loaded into internal storage that are required for this plot. The loaded files are not returned as that would mean they are logged into memory again.
				// Furthermore, also check which have failed upon loading. Those are the files that were not found, therefore the promise was rejected.
				var availableUrls = dbsliceData.flowData.filter(function(file){
					var isUrlRequired = requiredUrls.includes( file.url )
					var wasPromiseResolved = file.data != undefined
					return isUrlRequired && wasPromiseResolved
				}).map(function(file){return file.url})
				
				// Reverse reference the loaded files to find which required files are not available in the central storage. 
				var missingUrls = requiredUrls
				  .filter( function(url){return !availableUrls.includes(url)})	

				
				// Create 'file' responses detailing which files of which tasks were : 
				// 1.) requested:
				var requestedFiles = requiredTasks.map(returnFile)
				
				// 2.) available:
				var availableFiles = requiredTasks.filter(function(task){
					return availableUrls.includes( getUrl(task) )
				}).map(returnFile)
				
				// 3.) missing:
				var missingFiles = requiredTasks.filter(function(task){
					return missingUrls.includes( getUrl(task) )
				}).map(returnFile)
				
				// 4.) duplicated:
				var duplicatedFiles = requiredTasks.filter(function(task){
				  
				  // Assume duplicate by default.
				  var flag = true
				  if( requiredUrls.indexOf(     getUrl(task) ) == 
				      requiredUrls.lastIndexOf( getUrl(task) ) ){
					// The first element is also the last occurence of this value, hence it is a unique value. This is therefore not a duplicating element.
					flag = false
				  } // if
				  
				  return flag
				}).map(returnFile)
				
				// NOTE: 'availableFiles' lists all the tasks for which the data is available, even if they are duplicated.
				
				
				// 5.)
				// CHECK FOR COMPATIBILITY OF NESTS!
				// The nests will have to be exactly the SAME, that is a prerequisite for compatibility. The options for these nests can be different, and the variables in these nests can be different. From these is the intersect calculated.
				var compatibilityAccessors = [
					getOptionNamesAccessor("userOptions"),
					getOptionNamesAccessor("commonOptions")
				]
				var c = chainCompatibilityCheck(availableFiles, compatibilityAccessors)
				
				
				
				// 6.)
				// FIND JUST THE COMMON DATA INTERSECTION - SAME NESTS, INTERSECT NEST VALUES, INTERSECT PROPERTIES
				
				/* /////////////////////////////////////////////
				
				YEEES, INSTEAD OF COMPATIBLE AND INCOMPATIBLE FIND THE INTERSECT OF THE DATA, AND PRESENT IT AS THE DATA AVAILABLE FOR PLOTTING!! KEEP A LOG OF CLASHES TO HELP THE USER?
				
				Have to look through all the user options there are, all the variables there are, and then output references to those.
				
				- Ensure that all the files have the same nests.
				- Collect all the nest options and find intersect ones
				- Collect all the variables and ensure they are in all the files. they don't all need to be the split type however, the plotting accessor will take care of that.
				
				Make a report showing which changes would yield largest gains?
				
				//////////////////////////////////////////// */
				
				
				
				// First find all the nest options. ASSUME that compatibility has already been established. The files also contain all the unique values already.
				
				
				// Compatibility ensures that all the files have exactly the same user tags available. Now check which of the options are itnersectiong.
				var intersect = undefined
				if(c.compatibleFiles.length > 0){
					intersect = getIntersectOptions( c.compatibleFiles )
				}
				
				
				// MAKE SURE ALL THE INTERSECT OPTIONS ACTUALLY HAVE SOME OPTIONS - OPTIONS ARE NOT EMPTY!!
				
				
				
				
				// MAYBE FOR VARIABLES IT SHOULD RETURN JUST THE SHARED VARIABLES AT A LATER POINT?
				
				// The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.
				ctrl.data.promises  = ctrl.data.promises
				ctrl.data.requested = requestedFiles
				ctrl.data.available = availableFiles
				ctrl.data.duplicates= duplicatedFiles
				ctrl.data.missing   = missingFiles
				ctrl.data.compatible = c.compatibleFiles
				ctrl.data.incompatible = c.incompatibleFiles
				ctrl.data.intersect = intersect
				
  
			  
				
				
			  // HELPER FUNCTIONS
			  function returnFile(task){
				// 'returnFile' changes the input single task from the metadata, and returns the corresponding selected 'file'. The 'file' contains the url selected as per the slice selection made by the user, and the corresponding task. The task is required to allow cross plot tracking of all the data connected to this task, and the optional coloring by the corresponding metadata values.
				
				// This here should also package up all the metadata properties that would enable the coloring to fill them in.
				
				// dbsliceData.flowData.filter(function(file){return file.url == task[ctrl.view.sliceId]})[0].data
				var file = cfD3Line.helpers.findObjectByAttribute(dbsliceData.flowData, "url", [task[ctrl.view.sliceId]], true)
				
				return {  task: task, 
				           url: task[ctrl.view.sliceId],
						  data: file.data}
				
			  } // returnFile
			  
			  function getUrl(task){
			    // 'getUrl' is just an accessor of a particular property.
				return task[ctrl.view.sliceId]
			  } // getUrl
			  
			  function includesAll(A,B){
					// 'includesAll' checks if array A includes all elements of array B. The elements of the arrays are expected to be strings.
					
					// Return element of B if it is not contained in A. If the response array has length 0 then A includes all elements of B, and 'true' is returned.
					var f = B.filter(function(b){
						return !A.includes(b)
					})
					
					return f.length == 0? true : false
					
					
			  } // includesAll
				
			  function checkCompatibility(files, accessor){
				// 'checkCompatibility' checks if the properties retrieved using 'accessor( file )' are exactly the same. The comparison between two files is done on their arrays of properties obtained by the accessor. To check if the arrays are exactly the same all the contents of A have to be in B, and vice versa. 
			  
				var target = []
				if(files.length > 0){
					target = accessor( files[0] )
				} // if
				
				
				var compatibleFiles = files.filter(function(file){
				
					var tested = accessor( file )
				
					// Check if the tested array includes all target elements.
					var allExpectedInTested = includesAll(tested, target)
					
					// Check if the target array includes all test elements.
					var allTestedInExpected = includesAll(target, tested)
					
					return allExpectedInTested && allTestedInExpected
				})
				var compatibleUrls = compatibleFiles.map(function(file){return file.url})
				
				
				// Remove any incompatible files from available files.
				var incompatibleFiles = availableFiles.filter(function(file){
					return !compatibleUrls.includes( file.url )
				})
				
				return {compatibleFiles:   compatibleFiles,
				      incompatibleFiles: incompatibleFiles}
			  
			  } // checkCompatibility
				
			  function chainCompatibilityCheck(files, accessors){
			  
					var compatible = files
					var incompatible = []
					
					// The compatibility checks are done in sequence.
					accessors.forEach(function(accessor){
						var c = checkCompatibility(compatible, accessor)
						compatible = c.compatibleFiles
						incompatible.concat(c.incompatibleFiles)
					})
			  
				    return {compatibleFiles:   compatible,
				          incompatibleFiles: incompatible}
			  
			  } // chainCompatibilityCheck
			  
			  function getIntersectOptions(files){
			  
					// 'getIntersectOptions' returns the intersect of all options available. The compatibility checks established that the files have exactly the same option names available, now the intersect of option options is determined.

					// Three different options exist.
					// 1.) User options (tags such as 'height', "circumference"...)
					// 2.) Var options (possibilities for the x and y axes)
					// 3.) Common options - to cater for explicit variable declaration. These are not included for the intersect as the user will not be allowed to select from them for now.

					// First select the options for which the intersect is sought for. It assumes that all the files will have the same userOptions. This should be guaranteed by the compatibility check.
					
					
					
					// 'calculateOptionIntersect' is geared to deal with an array of options, therefore it returns an array of intersects. For x and y options only 1 option is available, therefore the array wrapper is removed here.
					var xVarIntersect = calculateOptionIntersect( files, xVarOptionAccessor )
					var yVarIntersect = calculateOptionIntersect( files, yVarOptionAccessor )
					
					
					return {
					   userOptions: 
					           calculateOptionIntersect( files, userOptionAccessor ),
					    varOptions: {
							x: xVarIntersect[0],
							y: yVarIntersect[0]
					    } // varOptions
					} // intersectOptions
					
					// Helpers
					
					function userOptionAccessor(file){
						return file.data.userOptions
					} // userOptionAccessor
					
					function xVarOptionAccessor(file){
						return [file.data.varOptions.x]
					} // varOptionAccessor
					
					function yVarOptionAccessor(file){
						return [file.data.varOptions.y]
					} // varOptionAccessor
					

					function calculateOptionIntersect( files, optionsAccessor ){
						// 'calculateOptionIntersect' takes teh array of files 'files' and returns all options stored under the attribute files.data[<optionsName>] that all the files have.
						
						// The first file is selected as teh seed. Only the options that occur in all files are kept, so the initialisation makes no difference on the end result.
					    var seedOptions = optionsAccessor( files[0] )
						var intersectOptions = seedOptions.map(function(seedOption){
							
							// The options of the seed user options will be the initial intersect options for this particular option.
							var intersectOptions = seedOption.options
							
							// For each of the options loop through all the files, and see which options are included. Only keep those that are at every step.
							files.forEach(function(file){
								
								// For this particular file fitler all the options for this particular user option.
								intersectOptions = intersectOptions.filter(function(option){
								
									// It is expected that only one option of the same name will be present. Pass in an option that only one element is required - last 'true' input.
									var fileOptions = cfD3Line.helpers.findObjectByAttribute(optionsAccessor(file), "name", [seedOption.name], true)
									
									return fileOptions.options.includes( option )
								}) // filter
							}) // forEach

							return {name: seedOption.name,
							         val: intersectOptions[0],
								 options: intersectOptions}
							
						}) // map
						
						return intersectOptions
					
					
					} // calculateOptionIntersect
			  
			  } // getIntersectOptions
			  
			  function getOptionNamesAccessor(optionsName){
					// This returns an accessor function.

					var f = function(file){
						return file.data[optionsName].map(function(o){return o.name})
					}
					
					return f
				} // getOptionNamesAccessor
			  
			}, // getLineDataInfo
		
			// Manual functionality
			updateManualSelections: function updateManualSelections(ctrl){
			
				
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				// Color in selected circles.
				dbsliceData.data.manuallySelectedTasks.forEach(function(d){
					g
					  .selectAll("g.plotSeries[task-id='" + d + "']")
					  .select("path.line")
						.style("stroke", "rgb(255, 127, 14)")
						.style("stroke-width", 4)
				}) //forEach

				
			}, // updateManualSelections
		
			
			
			
			
			// General helpers
			unique: function unique(d){		
				// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
				function onlyUnique(value, index, self) { 
					return self.indexOf(value) === index;
				} // unique
				
				return d.filter( onlyUnique )
			
			}, // unique
			
			findObjectByAttribute: function findObjectByAttribute(A, attribute, values, flag){
				// This function returns the objects in an object array 'A', which have an attribute 'attribute', with the value 'value'. If they do not an empty set is returned. In cases when a single item is selected the item is returned as the object, without the wrapping array.
					
				var subset = A.filter(function(a){
					return values.includes( a[attribute] )
				})
				
				// If only one output is expected, return a single output.
				if( subset.length > 0 && flag == 1 ){
					subset = subset[0]
				} // if
				
				return subset
				
			}, // findObjectByAttribute
			
			collectObjectArrayProperty: function collectObjectArrayProperty(A, attribute){
				// collectObjectArrayProperty take input object array 'A', collect all of the object members attribute 'attribute', and flattens the array of arrays into a single array of values once.
			
				var C = A.map(function(a){
					return a[attribute]
				})
				return [].concat.apply([], C)	
			
			}, // collectObjectArrayProperty
			
		
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll(".line")
					.style("opacity", 0.2);
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, d){
				
				// Find the line corresponding to the data point. Look for it by taskId.
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll('.plotSeries[task-id="' + d.taskId + '"]')
				  .selectAll(".line")
				    .style("opacity", 1.0)
				    .style( "stroke-width", "4px" );
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
					
				// Revert the opacity and width.
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll(".line")
				    .style("opacity", 1.0)
				    .style( "stroke-width", "2.5px" );
					
				// Rehighlight any manually selected tasks.
				crossPlotHighlighting.manuallySelectedTasks()
				
			}, // defaultStyle
		
		} // helpers
	
	} // cfD3Line
	

export { cfD3Line };