import {dbsliceData} from "../core/dbsliceData.js"
import {fileManager} from "../core/fileManager.js"
import {builder} from "../core/builder.js"
import {color} from "../core/color.js"
import {crossPlotHighlighting} from "../core/crossPlotHighlighting.js";
import {helpers} from "../core/helpers.js";
import * as FILE from "../core/fileClasses.js";
import {plotHelpers} from "./plotHelpers.js"

export var cfD3Line = {
		// • report to the user info about the data (missing, duplicated, intersect clashes, maybe even the things that will yield the largest addition of data to the screen)
	
		name: "cfD3Line",
	
		make: function(ctrl){
		
			// This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
			
			
			
			var hs = plotHelpers.setupPlot
			var hi= plotHelpers.setupInteractivity.twoInteractiveAxes
			var i = cfD3Line.interactivity
			
			// Add the manual selection toggle to its title.
			// hs.twoInteractiveAxes.updatePlotTitleControls(ctrl)
			
			// Create the backbone required for the plot. This is the division of the card into the divs that hold the controls and the plot.
			hs.twoInteractiveAxes.setupPlotBackbone(ctrl)
			
			// Create the svg with all required children container groups and append it to the appropriate backbone div.
			hs.general.rescaleSvg(ctrl)
			
			
			
			
			// Add in the controls for the y axis.
			hs.general.appendVerticalSelection( ctrl.figure, hi.onSelectChange.vertical(ctrl) )
			
			// Add in the controls for the x axis.
			hs.general.appendHorizontalSelection( ctrl.figure, hi.onSelectChange.horizontal(ctrl) )
			
			
			// General interactivity
			hi.addZooming(ctrl)
			i.createLineTooltip(ctrl)
			
			// Scaling of the axes
			hi.addAxisScaling(ctrl)
			
			
			// Button menu custom functionality. On first "make" it should host the slice id options.
			var sliceOption = {
				name: "Slice Id",
				val: undefined,
				options: dbsliceData.data.line2dProperties,
				event: function(ctrl, d){ctrl.view.sliceId = d}
			} // sliceOption
			
			hs.twoInteractiveAxes.buttonMenu.make(ctrl)
			hs.twoInteractiveAxes.buttonMenu.update(ctrl, [sliceOption])
			
			// But it will try to draw when this is updated...

			
		
		}, // make
		
		getData: function(ctrl){
			// Setup the appropriate connection between individual tasks and the loaded files.
			
			
			// First establish for which tasks the files are available.
			let tasks = dbsliceData.data.taskDim.top(Infinity)
			let requiredUrls = tasks.map(d=>d[ctrl.view.sliceId])
			
			// Create an itnernal data object for tasks that have a loaded file, and log those that weren't loaded as missing.
			ctrl.data = tasks.reduce(function(acc, t){
				
				// The library will retrieve at most 1 file!
				let filename = t[ctrl.view.sliceId]
				let f = fileManager.library.retrieve(FILE.line2dFile, filename)
				
				if(f){
					// Exactly the right file was found. As on-demand filenames will have the same filename and url this should always happen when the file has been loaded. The series is still empty as the selection of the variables has not been made yet.
					acc.available.push({
						task: t,
						file: f,
						series: []
					})
				} else {
					// File not found - log as missing
					acc.missing.push({
						task: t,
						value: filename
					})
				} // if
						
				
				return acc
			}, {available: [], missing:[]}) // reduce
			
			
			// Set the intersect of availbale variables.
			ctrl.data.intersect = ctrl.data.available.length > 0 ?  cfD3Line.getIntersectOptions( ctrl.data.available ) : undefined
			
		}, // getData
		
		getIntersectOptions: function(dataobjs){
			
			// Find which variables appear in all the dataobj files. These are the variables that can be compared.
			
			
			let commonvars = dataobjs.reduce(function(acc, d){
				
				acc = acc.filter(function(varname){
					return d.file.content.variables.includes(varname)
				})
				
				return acc
			}, [...dataobjs[0].file.content.variables])
			
			return commonvars
			
		}, // getIntersectOptions
		
		update: function update(ctrl){
			
			// plotFunc.update is called in render when coordinating the plots with the crossfilter selection. On-demand plots don't respond to the crossfilter, therefore this function does nothing. In hte future it may report discrepancies between its state and the crossfilter.
			
			// Called on: AR change, color change
		
			// Update the color if necessary.
			let allSeries = ctrl.figure.select("svg.plotArea")
				  .select("g.data")
				  .selectAll("path.line")
				    .transition()
					.duration( ctrl.view.transitions.duration )
				    .style( "stroke", ctrl.tools.getColor )
			
			
			// Maybe just introduce separate draw scales and axis scales??
			
			// Update the axes
			cfD3Line.helpers.axes.update(ctrl)			
				
			
		}, // update
		
		updateData: function updateData(ctrl){
			
			// Remove all the previously stored promises, so that only the promises required on hte last redraw are retained.
			ctrl.data.promises = []
			
			
			// GETDATAINFO should be launched when new data is loaded for it via the 'refresh' button, and when a different height is selected for it. Otherwise it is just hte data that gets loaded again.
			let data = cfD3Line.getData(ctrl)
			
			
			
			// The data must be retrieved here. First initialise the options.
			if(ctrl.data.intersect != undefined){
				cfD3Line.setupPlot.updateUiOptions(ctrl)
			} // if
			
			
			// Rescale the svg in event of a redraw.
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			
			// Setup the plot tools. Also collects the data
			cfD3Line.setupPlot.setupLineSeries(ctrl)
			plotHelpers.setupTools.go(ctrl)
			cfD3Line.setupPlot.setupLineTools(ctrl)
			
			// The data domain is required for nicer AR adjusting.
			ctrl.format.domain = {
				x: ctrl.tools.xscale.domain(),
				y: ctrl.tools.yscale.domain(),
			}
			
			
			cfD3Line.draw(ctrl)
			
			// Update the axes
			cfD3Line.helpers.axes.update(ctrl)
			
			// Adjust the title
			ctrl.format.wrapper.select("div.title").html(ctrl.view.sliceId)
			
			
		}, // updateData
			

			
		draw: function draw(ctrl){
			
			// Draw is used when the data changes. The transform is added in terms of pixels, so it could possibly be kept. So, when introducing new data add the transform already, so everything is kept at the same transform.
			
			// This function re-intialises the plots based on the data change that was initiated by the user.

			// RELOCATE TO DRAW??
			if(ctrl.data.available.length > 0){
			
				// Update the axes
				cfD3Line.helpers.axes.update(ctrl)
				
				// CHANGE TO JOIN!!
				
				 // Assign the data
				var allSeries = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("path.line")
				  .data( ctrl.data.available, d=>d.task.taskId );

				// enter
				allSeries.enter()
				  .append( "g" )
				    .attr( "class", "plotSeries")
				  .append( "path" )
				    .attr( "class", "line" )
				    .attr( "d", d=>ctrl.tools.line(d.series) )
				    .style( "stroke", ctrl.tools.getColor ) 
				    .style( "fill", "none" )
				    .style( "stroke-width", 2.5 / ctrl.view.t.k )
				    .on("mouseover", cfD3Line.interactivity.addTipOn(ctrl))
				    .on("mouseout", cfD3Line.interactivity.addTipOff(ctrl))
				    .on("click", cfD3Line.interactivity.addSelection)

				// update:
				allSeries
				  .transition()
				  .duration(ctrl.view.transitions.duration)
				  .attr( "d", d=>ctrl.tools.line(d.series) )
				  .style( "stroke", ctrl.tools.getColor )
					  
				// exit
				allSeries.exit().remove();
				
				// Add the appropriate translate??
				ctrl.figure.select("svg.plotArea")
				  .select("g.data")
				  .selectAll("g.plotSeries")
					  .attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl) )
			
			} // if
		
		}, // draw
	
		
		refresh: function refresh(ctrl){
			
			// Update the axes
			cfD3Line.helpers.axes.update(ctrl)
			
			
			// Using the transform on g to allow the zooming is much faster.
				// MAYBE MOVE THE TRANSFORM ON g.data? WILL IT MAKE IT FASTER??
			ctrl.figure.select("svg.plotArea")
				  .select("g.data")
				  .selectAll("g.plotSeries")
					  .attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl) ) 
				  
				  
			// Update the line thickness.
			ctrl.figure.select("svg.plotArea")
			  .select("g.data")
			  .selectAll("g.plotSeries")
			  .selectAll("path.line")
			    .style( "stroke-width", 2.5 / ctrl.view.t.k )
		
		}, // refresh
	
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			
			// Update the zoom clip.
			var background = ctrl.figure.select("svg.plotArea")
				.select("g.background")
			background.select("clipPath").remove()
				
			background
				.append("clipPath")
				.attr("id", "zoomClip")
				.append("rect")
			
			ctrl.figure
			  .select("div.plotContainer")
			  .select("svg.plotArea")
			  .select("g.data")
				.attr("clip-path", "url(#zoomClip)")
			
			
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated
			if(ctrl.data.compatible != undefined){
				cfD3Line.setupPlot.setupLineSeries(ctrl)
				plotHelpers.setupTools.go(ctrl)
				cfD3Line.setupPlot.setupLineTools(ctrl)
			} // if
			
			
			
				
			
			// 3.) The plot needs to be redrawn
			cfD3Line.draw(ctrl)
			
		}, // rescale
	
	
		setupPlot: {
			// This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
	
			updateUiOptions: function updateUiOptions(ctrl){
				// The current view options may differ from the available data options. Therefore update the corresponding elements here.
				
				
				
				
				// Do the same for the x and y axis options
				if(ctrl.view.xVarOption == undefined){
					ctrl.view.xVarOption = {
						val: ctrl.data.intersect[0],
						options: ctrl.data.intersect 
					}
				} else {
					updateOption(ctrl.view.xVarOption, ctrl.data.intersect)
				} // if
				
				
				if(ctrl.view.yVarOption == undefined){
					ctrl.view.yVarOption =  {
						val: ctrl.data.intersect[0],
						options: ctrl.data.intersect 
					}
				} else {
					updateOption(ctrl.view.yVarOption, ctrl.data.intersect)
				} // if
				
				
				// Handle the options corresponding to fixed UI elements.
				var gh = plotHelpers.setupPlot.general
				var h = plotHelpers.setupPlot.twoInteractiveAxes
				
				gh.updateVerticalSelection(ctrl)
				gh.updateHorizontalSelection(ctrl)
				
				
				// Handle the options of the 'button menu'
				// Manually create the color option.
				if(ctrl.view.cVarOption == undefined){
					ctrl.view.cVarOption = color.settings
				} // if
				
				
				
				
						
						
						
				// HERE UPDATE THE BUTTON HARMONICA OPTIONS TOO!!	
				h.buttonMenu.update(ctrl, assembleButtonMenuOptions() )
				
				
				// Helpers
				
				function updateOption(viewOption, options){

					// If the option does exist, then just update it.
					if(!options.includes( viewOption.val )){
						// The new options do not include the previously selected option value. Initialise a new one.
						viewOption.val = options[0]
					} // if
					
					viewOption.options = options
					
				} // updateOption
				
				function assembleButtonMenuOptions(){
					// The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
					
					// Make functionality options for the menu.
					var codedPlotOptions = [color.settings]
					
					return codedPlotOptions.concat( ctrl.view.options )
					
				} // assembleButtonMenuOptions
				
			}, // updateUiOptions
		
			// Functionality required to setup the tools.
			setupLineSeries: function setupLineSeries(ctrl){
				
				// Create the appropriate data series. Here the user's selection of variables is taken into accout too.
				
				ctrl.data.available = ctrl.data.available.map(function(dataobj){
					
					// Pass in the x variable and the y variable. Maintain reference to the task!!
					
					
					dataobj.series = dataobj.file.content.data.map(function(point){	
						return {
							x: point[ctrl.view.xVarOption.val],
							y: point[ctrl.view.yVarOption.val]
						}
					})
					
					return dataobj
				}) // map
				
			}, // setupLineSeries
			
			setupLineTools: function setupLineTools(ctrl){
				// Needs to update the accessors.
				
				// Make the required line tool too!
				// The d3.line expects an array of points, and will then connect it. Therefore the data must be in some form of: [{x: 0, y:0}, ...]
				ctrl.tools.line = d3.line()
					.x( function(d){ return ctrl.tools.xscale( d.x ) } )
					.y( function(d){ return ctrl.tools.yscale( d.y ) } );
					

				// Tools for retrieving the color and taskId
				ctrl.tools.getTaskId = function(d){return d.task.taskId} 
				ctrl.tools.getColor = function(d){return color.get(d.task[color.settings.variable])
				} // getColor
				
			}, // setupLineTools
			
			findPlotDimensions: function findPlotDimensions(svg){
			
				return {x: [0, Number( svg.select("g.data").attr("width") )],     y: [Number( svg.select("g.data").attr("height") ), 0]}
			
			
			}, // findPlotDimensions
				
			findDomainDimensions: function findDomainDimensions(ctrl){
			
				// The series are now an array of data for each of the lines to be drawn. They possibly consist of more than one array of values. Loop over all to find the extent of the domain.
				
				var seriesExtremes = ctrl.data.available.map(function(dataobj){
					let series = dataobj.series
					return {x: [d3.min(series, function(d){return d.x}),
 					            d3.max(series, function(d){return d.x})], 
					        y: [d3.min(series, function(d){return d.y}),
 					            d3.max(series, function(d){return d.y})]
							}
				}) // map
				
				var xExtremesSeries = helpers.collectObjectArrayProperty(seriesExtremes,"x")
				var yExtremesSeries = helpers.collectObjectArrayProperty(seriesExtremes,"y")
				
			
				
				return {x: [d3.min(xExtremesSeries), d3.max(xExtremesSeries)], 
					    y: [d3.min(yExtremesSeries), d3.max(yExtremesSeries)]}
						
				
				// Helpers
				
				
			}, // findDomainDimensions
			
		
			// Find the appropriate transform for the data
			adjustTransformToData: function (ctrl){
				// Calculate the transform. Find the position of the domain minimum using the new scales.
				
				
				
				// Find the scaling based on the data domain and the scale domain.
				let xDataDomain = ctrl.format.domain.x
				let xScaleDomain = ctrl.tools.xscale.domain()
				
				let yDataDomain = ctrl.format.domain.y
				let yScaleDomain = ctrl.tools.yscale.domain()
				
				
				let x = (xDataDomain[1] - xDataDomain[0]) / (xScaleDomain[1] - xScaleDomain[0])
				let y = (yDataDomain[1] - yDataDomain[0]) / (yScaleDomain[1] - yScaleDomain[0])
				
				
				let scale = "scale(" + [x,y].join(",") + ")"
				
				
				
				// THE SCALE IS APPLIE WITH THE BASIS AT THE TOP CORNER. MEANS THAT AN ADDITIONAL TRANSLATE WILL BE NEEDED!!
				// y-axis starts at the top! The correction for this, as well as the offset due to the top=based scaling is "- plotHeight + (1-y)*plotHeight"
				let plotHeight = ctrl.tools.yscale.range()[0] - ctrl.tools.yscale.range()[1]
				
				// y-axis starts at the top!
				let translate = helpers.makeTranslate(
					ctrl.tools.xscale( ctrl.format.domain.x[0] ),
					ctrl.tools.yscale( ctrl.format.domain.y[0] ) - y*plotHeight
				)
				
				
				return [translate, scale].join(" ")
				
				
				
				
				
				
			}, // 
		
		}, // setupPlot
	
		interactivity: {
			
			// Variable change
			onSelectChange: function onSelectChange(ctrl){
					
				// Reset the AR values.
				ctrl.view.dataAR = undefined
				ctrl.view.viewAR = undefined
				
				// Update the plot tools. Data doesn't need to change - FIX
				cfD3Line.setupPlot.setupLineSeries(ctrl)
				plotHelpers.setupTools.go(ctrl)
				cfD3Line.setupPlot.setupLineTools(ctrl)
				
				// The data domain is required for nicer AR adjusting.
				ctrl.format.domain = {
					x: ctrl.tools.xscale.domain(),
					y: ctrl.tools.yscale.domain(),
				}
				
				// Update transition timings
				ctrl.view.transitions = cfD3Line.helpers.transitions.animated()
				
				// Update plot itself
				cfD3Line.draw(ctrl)
				
			}, // onSelectChange
				
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
						.html(function (d) {
							return "<span>" + d.task.label + "</span>";
						});
						
						ctrl.figure.select("svg.plotArea").call( tip );
					
					
				  return tip
					
				} // createTip
				
			}, // createLineTooltip
			
			addTipOn: function addTipOn(ctrl){
				
				return function (d){			
					
					// path < plotSeries < g.data < svg
					var coordinates = d3.mouse(this.parentElement.parentElement)
					
					var anchorPoint = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.background")
					  .select(".anchorPoint")
						.attr( "cx" , coordinates[0] )
						.attr( "cy" , coordinates[1] - 15);
					
					ctrl.view.lineTooltip.show(d, anchorPoint.node());
					
					crossPlotHighlighting.on(d, "cfD3Line")
					
				}; // return 
				
			}, // addTipOn
			
			addTipOff: function addTipOff(ctrl){
				
				return function (d){
					
					
					ctrl.view.lineTooltip.hide();
					
					crossPlotHighlighting.off(d, "cfD3Line")
					
				}; // tipOff
				
			}, // addTipOff 
			

			// Manual selection
			addSelection: function addSelection(d){
				// Functionality to select elements on click. 
				
				
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
					
				
				
			}, // addSelecton
			
			// On resize/drag
			refreshContainerSize: function refreshContainerSize(ctrl){
				
				var container = d3.select(ctrl.format.parent)
				
				builder.refreshPlotRowHeight( container )
				
			}, // refreshContainerSize

			toggleAR: function toggleAR(ctrl){
				
				// Make sure the data stays in the view after the changes!!
				
				if(ctrl.view.viewAR == 1){
						// Change back to the data aspect ratio. Recalculate the plot tools.
						ctrl.view.viewAR = ctrl.view.dataAR
					} else {
						// Change to the unity aspect ratio. Adjust the y-axis to achieve it.
						ctrl.view.viewAR = 1
					} // if
					
					// When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
				
					// Adjust so that the middle of the visible data domain stays in the same place?
					
					
					
					var yAR = calculateAR(ctrl)
					let newYDomain = calculateDomain(ctrl.tools.yscale, ctrl.format.domain.y, yAR)
					ctrl.tools.yscale.domain( newYDomain )
					
					
					// cfD3Line.setupPlot.setupLineTools(ctrl)
					
					// t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.
					ctrl.view.t = -1
					
					
					ctrl.view.transitions = cfD3Line.helpers.transitions.animated()

					// Redraw is handled here, as the data domain must be used for the drawing. Shouldn't this also be true when changing the AR??
					
					// Revert back to original domain for drawing, but use the current axis domain for the axis update. d3.line in ctrl.tools.line accesses teh x and yscales when called, and so uses the current scale domains. These change on zooming, but the data must be drawn in the data domain, because the zooming and panning is done via transform -> translate.
					let xscaleDomain = ctrl.tools.xscale.domain()
					ctrl.tools.xscale.domain( ctrl.format.domain.x )
					
					
					// Redraw the line in the new AR.
					let allSeries = ctrl.figure.select("svg.plotArea")
						  .select("g.data")
						  .selectAll("path.line")
							.transition()
							.duration( ctrl.view.transitions.duration )
							.attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl))
							.attr( "d", ctrl.tools.line )
					
					ctrl.tools.xscale.domain(xscaleDomain)
					
					
					
					
					function calculateAR(ctrl){
						
						let xRange = ctrl.tools.xscale.range()
						let yRange = ctrl.tools.yscale.range()
						let xDomain = ctrl.tools.xscale.domain()
						let yDomain = ctrl.tools.yscale.domain()
					
						let xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0])
						let yAR = xAR/ctrl.view.viewAR
						return yAR
					}
					
					function calculateDomain(scale, dataDomain, AR){
						
						// Always adjust teh AR so that the data remains in view. Keep the midpoint of the visible data where it is on the screen.
						
						let range = scale.range()
						let domain = scale.domain()
						
						// First find the midpoint of the visible data.
						let a = dataDomain[0] < domain[0] ? domain[0] : dataDomain[0]
						let b = dataDomain[1] > domain[1] ? domain[1] : dataDomain[1]
						let mid = (a+b)/2
						
						let domainRange = [range[0] - range[1]] / AR
						let newDomain = [
							mid - domainRange/2, 
							mid + domainRange/2
						]
						
						return newDomain
						
					} // calculateDomain
				
			}, // toggleAR
			
			// When resizing the axes interactively
			dragAdjustAR: function dragAdjustAR(ctrl){
				// Should direct redrawing be allowed in hte first place??
				
				// Transitions
				ctrl.view.transitions = cfD3Line.helpers.transitions.instantaneous()
			  
				// Uses the scales with updated domains.
				
				ctrl.view.t = d3.zoomIdentity
				ctrl.figure.select("svg.plotArea")
				  .select("g.data")
				  .selectAll("g.plotSeries")
					.transition()
					.duration( ctrl.view.transitions.duration )
					.attr("transform", cfD3Line.setupPlot.adjustTransformToData(ctrl))
				
				// Update the axes
				cfD3Line.helpers.axes.update(ctrl)
				
				
			}, // dragAdjustAR
			
		}, // interactivity
		
		helpers: {
		
			// Initialisation
			createDefaultControl: function createDefaultControl(){
			
				// data:
				 
				// • .promises are promises completed before drawing the graphics.
				// • .requested is an array of urls whose data are requested by the plotting tool. These need not be the same as the data in promises as those are loaded on user prompt!
				// • .available is an array of urls which were found in the central booking,
				// • .missing                              NOT found
				// • .ordinalProperties is a string array of properties found in the data.
				// • .data is an array of n-data arrays of the n-task slice files.
				
				
				var ctrl = {
				    plotFunc: cfD3Line,
					fileClass: FILE.line2dFile,
					figure: undefined,
					svg: undefined,
					data: {
					   available: [],
					   missing : [],
					   intersect: [],
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
						margin: {top: 10, right: 10, bottom: 38, left: 30},
						axesMargin: {top: 20, right: 20, bottom: 16, left: 30},
						parent: undefined,
						position: {
							ix: 0,
							iy: 0,
							iw: 4,
							ih: 4,
							minH: 290,
							minW: 190
						}
					}
				} // ctrl
				
				
				return ctrl
			
			}, // createDefaultControl
		
			createLoadedControl: function createLoadedControl(plotData){
				
				var ctrl = cfD3Line.helpers.createDefaultControl()
				
				// If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.
				if(plotData.sliceId != undefined){
					if(dbsliceData.data.line2dProperties.includes(plotData.sliceId)){
						ctrl.view.sliceId = plotData.sliceId
					} // if
				} // if
				
				// When the session is loaded all previously existing plots would have been removed, and with them all on demand loaded data. Therefore the variables for this plot cannot be loaded, as they will depend on the data.
				
				ctrl.format.title = plotData.title
				
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
				
					
				
					if ( ctrl.tools.xscale && ctrl.tools.yscale ){
						// Only update the axis if the scales are defined. When calling the update on an empty plot they will be undefined.
						var xAxis = d3.axisBottom( ctrl.tools.xscale ).ticks(5);
						var yAxis = d3.axisLeft( ctrl.tools.yscale );
						
						ctrl.figure.select("svg.plotArea").select(".axis--x").call( xAxis )
						ctrl.figure.select("svg.plotArea").select(".axis--y").call( yAxis )
					
						cfD3Line.helpers.axes.updateTicks(ctrl)
						
					} // if
				
				
				
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
		
			
			// Manual functionality
			updateManualSelections: function updateManualSelections(ctrl){
			
				var gData = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				gData
				  .selectAll("g.plotSeries")
				  .each(function(d){
					  var plotSeries = d3.select(this)
					  var isSelected = dbsliceData.data.manuallySelectedTasks.includes(d.task.taskId)
					  
					  if(isSelected){
						  // paint it orange, and bring it to the front.
						  plotSeries.select("path.line")
						    .style("stroke", "rgb(255, 127, 14)")
						    .style("stroke-width", 4 / ctrl.view.t.k)
						  
						  
						  this.remove()
						  gData.node().appendChild(this)
						  
					  } else {
						  plotSeries.select("path.line")
						    .style("stroke", ctrl.tools.getColor)
						    .style("stroke-width", 2.5 / ctrl.view.t.k)
					  } // if
				  })
				
				

				
			}, // updateManualSelections
		
			
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll(".line")
					.style("opacity", 0.2)
					.style("stroke", "Gainsboro");
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				let highlightedTaskIds = allDataPoints.map(d=>d.taskId)
				
				let plotSeries = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll('.plotSeries')
					  
				plotSeries.each(function(d){
					let series = d3.select(this)
					
					if(highlightedTaskIds.includes(d.task.taskId)){
						series.selectAll(".line")
						.style("opacity", 1.0)
						.style( "stroke", ctrl.tools.getColor ) 
						.style( "stroke-width",  4 / ctrl.view.t.k )
						
						series.raise();
						
					}
					
				})
				
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
					
				// Revert the opacity and width.
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll(".line")
				    .style("opacity", 1.0)
					.style( "stroke", ctrl.tools.getColor ) 
				    .style( "stroke-width", 2.5 / ctrl.view.t.k );
					
				// Rehighlight any manually selected tasks.
				crossPlotHighlighting.manuallySelectedTasks()
				
			}, // defaultStyle
		
		} // helpers
	
	} // cfD3Line
	