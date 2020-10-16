import { render } from '../core/render.js';
import { filter } from '../core/filter.js';
import { color } from '../core/color.js';
import { dbsliceData } from '../core/dbsliceData.js';

var plotHelpers = {
        
        setupPlot: {
			
			general: {
				
				// Making the plot DOM
				makeNewPlot: function makeNewPlot( plotCtrl, index ) {
    
					// Note that here `this' is a d3 object.
					let f = plotCtrl.format
					f.parent = this._parent
					let dx = positioning.dx( d3.select(f.parent) )
					let dy = positioning.dy( d3.select(f.parent) )
					
	
					var wrapper = d3.select(this)
					  .append("div")
						.attr("class", "plotWrapper")
						.attr("plottype", plotCtrl.plotFunc.name)
						.style("position", "absolute")
						.style("left"  , f.parent.offsetLeft + f.position.ix*dx + "px")
						.style("top"   , f.parent.offsetTop + f.position.iy*dy + "px")
						.style("width" , f.position.iw*dx + "px")
						.style("height", f.position.ih*dy + "px")
						
					var plot = wrapper
					  .append("div")
					    .attr("class", "card")


					// Apply the drag to all new plot headers
					let drag = d3.drag()
						.on("start", positioning.dragStart)
						.on("drag" , positioning.dragMove)
						.on("end"  , positioning.dragEnd)
					  
					var plotHeader = plot
					  .append("div")
						.attr("class", "card-header plotTitle")
						.style("cursor", "grab")
						.call(drag)
				

					
					// Add the actual title
					plotHeader
					  .append("div")
					    .attr("class", "title")
						.attr("style","display:inline")
						.html(plotCtrl.format.title)
						.attr("spellcheck", "false")
						.attr("contenteditable", true)
						.style("cursor", "text")
						.on("mousedown", function() { d3.event.stopPropagation(); })
						
						
						
					// Add a div to hold all the control elements.
					plotHeader
					  .append("div")
						.attr("class", "ctrlGrp float-right")
						.attr("style", "display:inline-block")
					  .append("button")
                        .attr("class", "btn btn-danger float-right")
                        .html("x")
						.on("mousedown", function() { d3.event.stopPropagation(); })
						.on("click", addMenu.removePlotControls )
					
					  
					var plotBody = plot
					  .append("div")
						.attr("class", "plot")
						
						

						
					// Bind the DOM element to the control object.
					plotCtrl.figure = plotBody
					plotCtrl.format.wrapper = wrapper

					
					
					
					// Draw the plot
					plotCtrl.plotFunc.make(plotCtrl);
					
					
					

					

				}, // makeNewPlot
				
				setupPlotBackbone: function setupPlotBackbone(ctrl){
					/* This function makes the skeleton required for a plot that will have interactive inputs on both axes.
					_________________________________________________
					|| div | | div                                   |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||-----| |---------------------------------------|
					||-----| |---------------------------------------|
					|| div | | div                                   |
					||_____| |_______________________________________|
					
					*/
					
					var plot = ctrl.figure
				
					
					// Left Control
					plot
					  .append("div")
						.attr("class", "leftAxisControlGroup")
						.style("width", ctrl.format.margin.left +"px")
						.style("float", "left")
						
					// Main plot with its svg.
					plot
					  .append("div")
						.attr("class", "plotContainer")
						.style("margin-left", ctrl.format.margin.left + "px")
				
					// Bottom left corner div
					// A height of 38px is prescribed, as that is the height of a bootstrap button.
					plot
					  .append("div")
						.attr("class", "bottomLeftControlGroup")
						.attr("style", "width: "+ ctrl.format.margin.left +"px; height:" + ctrl.format.margin.bottom +"px; float:left")
					
					
					// Bottom controls
					plot
					  .append("div")
						.attr("class", "bottomAxisControlGroup")
						.attr("style", "margin-left: " + ctrl.format.margin.left + "px;")
						
					// Add the resize item.
					let resize = d3.drag()
						.on("start", positioning.resizeStart)
						.on("drag", positioning.resizeMove)
						.on("end", positioning.resizeEnd)
					
					plot.select(".bottomAxisControlGroup")
					  .append("svg")
						.attr("width",  "10")
						.attr("height", 10)
						.style("position", "absolute")
						.style("bottom", "0px")
						.style("right", "0px")
					  .append("circle")
						.attr("cx", 5)
						.attr("cy", 5)
						.attr("r", 5)
						.attr("fill", "DarkGrey")
						.attr("cursor", "nwse-resize")
						.call(resize)
					
					
				}, // setupPlotBackbone
				
				setupPlotContainerBackbone: function setupPlotContainerBackbone(ctrl){
					
					// Fill in the plot container backbone.
					var plotContainer = ctrl.figure.select("div.plotContainer")
					
					var svg = plotContainer
							.append("svg")
							  .attr("class","plotArea")
			 
					// Background group will hold any elements required for functionality in the background (e.g. zoom rectangle). 
					svg.append("g")
							.attr("class", "background")
			 
					// Group holding the primary data representations.
					svg.append("g")
							.attr("class", "data")
	
					// Markup group will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. 
					svg.append("g")
							.attr("class", "markup")
			
					// Group for the x axis
					svg.append("g")
						.attr( "class", "axis--x")
						
					// Group for the y axis
					svg.append("g")
						.attr( "class", "axis--y")
					
				}, // setupPlotContainerBackbone
				
				
				// Svg scaling
				rescaleSvg: function rescaleSvg(ctrl){
					
					// RESIZE ALL THE PLOT CONTAINERS AS NEEDED.
					
					var svg = ctrl.figure.select("svg.plotArea")
					var cardDOM = ctrl.figure.node().parentElement
					var wrapperDOM = cardDOM.parentElement
					var headerDOM = d3.select(cardDOM).select(".plotTitle").node()
					
					// First enforce the size based on the size of the wrapper.
					d3.select(cardDOM)
					  .style("height", wrapperDOM.offsetHeight - headerDOM.offsetHeight)
					
					
					
					// These are margins of the entire drawing area including axes. The left and top margins are applied explicitly, whereas the right and bottom are applied implicitly through the plotWidth/Height parameters.
					var margin = ctrl.format.margin
					var axesMargin = ctrl.format.axesMargin
					
					
					// Width of the plotting area is the width of the div intended to hold the plot (.plotContainer). ctrl.format.margin.bottom is the margin for hte button.
					var width = wrapperDOM.offsetWidth - margin.left - margin.right
					var height = wrapperDOM.offsetHeight - headerDOM.offsetHeight - margin.bottom - margin.top

					
					
					
					// The plot will contain some axes which will take up some space. Therefore the actual plot width will be different to the width of the entire graphic. Same is true for the height. The outer and inner svg only touch on the right border - there is no margin there.
					var plotWidth = width - axesMargin.left - axesMargin.right
					var plotHeight = height - axesMargin.bottom - axesMargin.top
					
					// Outer svg. This is required to separate the plot from the axes. The axes need to be plotted onto an svg, but if the zoom is applied to the same svg then the zoom controls work over the axes. If rescaling of individual axes is needed the zoom must therefore be applied to a separate, inner svg.
					// This svg needs to be translated to give some space to the controls on the y-axes.
					svg
						.attr("width", width)
						.attr("height", height)
							
							
							
					
					// If margins are too small the ticks will be obscured. The transform is applied from the top left corner.
					var axesTranslate = makeTranslate(axesMargin.left, axesMargin.top)
					
					// Make a group that will hold any non-primary data graphic markups, such as chics connecting points on a compressor map. This group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.
					var background = svg.select("g.background")
							.attr("transform",  axesTranslate)
					background
						.select("clipPath")
						.select("rect")
								.attr("width", plotWidth )
								.attr("height", plotHeight )
								.style("fill", "rgb(255,255,255)")
					background
						.select("rect.zoom-area")
								.attr("width", plotWidth )
								.attr("height", plotHeight )
								.style("fill", "rgb(255,255,255)")

					// Transform the markup to the right location.
					svg.select("g.markup")
							.attr("transform",  axesTranslate)								
					
					// Group holding the primary data representations. Needs to be after g.markup, otherwise the white rectangle hides all the elements.
					svg.select("g.data")
							.attr("transform", axesTranslate)
							.attr("width", plotWidth)
							.attr("height", plotHeight)
						
						
					// Group for the x axis
					svg.select("g.axis--x")
						.attr( "transform", makeTranslate(axesMargin.left, plotHeight + axesMargin.top) )
						
						
					// Group for the y axis
					svg.select("g.axis--y")
						.attr( "transform", axesTranslate )
				
						
					function makeTranslate(x,y){
						return "translate("+[x, y].join()+")"
					} // makeTranslate	
					
				}, // rescaleSvg
			
				
				// Select menus
				
				appendVerticalSelection: function appendVerticalSelection(container, onChangeFunction){
		
					// var container = ctrl.figure.select(".leftAxisControlGroup")
		
					var s = container
					  .append("select")
						.attr("class", "select-vertical custom-select")
					
									
					
					container
					  .append("text")
						.text( s.node().value )
						.attr("class","txt-vertical-axis")
					
					
					s.on("change", onChangeFunction )
				
				}, // appendVerticalSelection
				
				updateVerticalSelection: function updateVerticalSelection(ctrl){
				
					// THIS WORKS!!
					// NOTE THAT CHANGING THE SELECT OPTIONS THIS WAY DID NOT TRIGGER THE ON CHANGE EVENT!!
					
					var variables = ctrl.view.yVarOption.options
					
					var container = ctrl.figure.select(".leftAxisControlGroup")
					
					// Handle the select element.
					var s = container.select("select")
					var options = s.selectAll("option").data(variables)
					options
					  .enter()
						.append("option")
						   .attr("class","dropdown-item")
						   .html(function(d){return d})
						   
					options.html(function(d){return d})
					
					options.exit().remove()
						
						
					// Force the appropriate selection to be selected.
					s.node().value = ctrl.view.yVarOption.val
					
					// Update the text to show the same.
					container.select("text").text(ctrl.view.yVarOption.val)
				
				}, // updateVerticalSelection
				
				appendHorizontalSelection: function appendHorizonalSelection(container, onChangeFunction){
				
					// var container = ctrl.figure.select(".bottomAxisControlGroup")
				
					var s = container
					  .append("select")
						.attr("class", "custom-select")
						.attr("dir","rtl")
						.attr("style", 'float:right;')
					
					
					s.on("change", onChangeFunction)
					
				}, // appendHorizonalSelection
			
				updateHorizontalSelection: function updateHorizontalSelection(ctrl, variables){
				
					// THIS WORKS!!
					// NOTE THAT CHANGING THE SELECT OPTIONS THIS WAY DID NOT TRIGGER THE ON CHANGE EVENT!!
					
					var variables = ctrl.view.xVarOption.options
					var container = ctrl.figure.select(".bottomAxisControlGroup")
					
					// Handle the select element.
					var s = container.select("select")
					var options = s.selectAll("option").data(variables)
					options
					  .enter()
						.append("option")
						   .attr("class","dropdown-item")
						   .html(function(d){return d})
						   
					options.html(function(d){return d})
					
					options.exit().remove()
						
						
					// Force the appropriate selection to be selected.
					s.node().value = ctrl.view.xVarOption.val
					
					
				
				}, // updateHorizontalSelection
			
				// Toggle in the header
				
				appendToggle: function appendToggle(container, onClickEvent){
				
					// Additional styling was added to dbslice.css to control the appearance of the toggle.

					var toggleGroup = container
					  .append("label")
						.attr("class", "switch float-right")
					var toggle = toggleGroup
					  .append("input")
						.attr("type", "checkbox")
					toggleGroup
					  .append("span")
						.attr("class", "slider round")
						
					// Add it's functionality.
					toggle.on("change", onClickEvent)
					
				}, // appendToggle
				
			}, // general
			
			twoInteractiveAxes: {
				
				setupPlotBackbone: function setupPlotBackbone(ctrl){
					/* This function makes the skeleton required for a plot that will have interactive inputs on both axes.
					_________________________________________________
					|| div | | div                                   |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||     | |                                       |
					||-----| |---------------------------------------|
					||-----| |---------------------------------------|
					|| div | | div                                   |
					||_____| |_______________________________________|
					
					*/
					
					// Make the general backbone.
					plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
					
					plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
					
					
					// Fill in custom elements.
					var svg = ctrl.figure
					  .select("div.plotContainer")
					  .select("svg.plotArea")
					

					
							
					
					// The markup group also holds a white rectangle that allows the whole plot area to use zoom controls. This is so as the zoom will only apply when the cursor is on top of children within a g. E.g., without the rectangle the pan could only be done on mousedown on the points.
					// USE THIS RESTANGLE AS THE clipPAth too??
					var background = svg
						.select("g.background")
						
					// At some point this didn't work:
					// .attr("clipPathUnits","objectBoundingBox")
					background
						.append("clipPath")
							.attr("id", "zoomClip")
						.append("rect")
					background.append("rect")
						.attr("class", "zoom-area")
						.attr("fill", "rgb(255,25,255)")
					background
						.append("g")
							.style("display","none")
							.attr("class","tooltipAnchor")
						.append("circle")
								.attr("class", "anchorPoint")
								.attr("r",1);
					
				
					svg.select("g.data")
						.attr("clip-path", "url(#zoomClip)")	
						
				}, // setupPlotBackbone
							
				// Button Menu
				buttonMenu: {
			
					
					
					make: function make(ctrl){
						
						var container = ctrl.figure.select(".bottomLeftControlGroup")
		
						var menuWrapper = container
						  .append("div")
							.attr("class", "dropup")
							
						// The button that will toggle the main menu.
						var button = menuWrapper
						  .append("button")
							.attr("class", "btn dropup-toggle")
							.html("O")
						  
						// The div that will hold the accordion options.
						var menu = menuWrapper
						  .append("div")
							.attr("class", "dropup-content")
							.style("display", "none")
			
						// REQUIRED CUSTOM FUNCTIONALITY
						var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers
						
						
						// When the button is clicked the dropup should toggle visibility.
						button.on("click", h.toggleDropupMenu)
						
						// When outside of the menu, and the main menu items is clicked close the dropup menu.
						window.addEventListener("click", h.closeDropupMenu(menu) )
						
						
						
						
					
					}, // make
					
					update: function update(ctrl, optionGroups){
			
			
						var container = ctrl.figure.select(".bottomLeftControlGroup")
						var menu = container.select(".dropup").select(".dropup-content")
			
						// First remove all previous groups.
						while (menu.node().firstChild) {
							menu.node().removeChild(menu.node().lastChild);
						} // while
			
						// Now append all the options required.
						optionGroups.forEach(function(option){
							appendGroup(menu, option)
						})
			
						
						function appendGroup(menu, option){
							// Append the group div, the p holding the name, and another div holding the options.
							var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers
							var submenuWrapper = menu.append("div")
							
							// By clicking on this p I want to show the submenu.
							var p = submenuWrapper
							  .append("p")
								.attr("class", "dropup-toggle submenu-toggle")
								.html(option.name)
								.style("font-weight", "bold")
								.style("font-size", "12px")
							p.on("click", h.toggleDropupSubmenu) // on
							
							var submenu = submenuWrapper
							  .append("div")
								.attr("class", "submenu-content")
								.style("display", "none")
							  
							submenu
							  .selectAll("a")
							  .data(option.options)
							  .enter()
							  .append("a")
								.attr("class", function(d){
									// This function intitialises the selection.
									var classList = ["submenu-item"]
									if(option.val == d){
										classList.push("selected")
									} else {
										classList.push("deselected")
									} // if
									return classList.join(" ")
								})
								.html(function(d){return d})
								.on("click", function(d){
									// Several events should occur on an item click. First of all the selection should be highlighted in the selection menu. Then the corresponding ctrl attributes should be updated. And finally a redraw should be ordered.
									
									// Perform the usual toggling of the menu items. This also allows an option to be deselected!
									h.toggleSubmenuItemHighlight(this)
									
									// Update the corresponding ctrl attribute.
									// 'option' is a reference to either a manually created option in 'update', or a reference to an actual option in 'ctrl.view.options'.
									var optionSame = option.val == d
									option.val = optionSame ? undefined : d;
									
									// If a special event is specified, execute it here. This event might require to know the previous state, therefore execute it before updating the state.
									if(option.event != undefined){
										
										ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
										
										option.event(ctrl, option.val, optionSame)
										
										ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous()
									} // if
									
									
									
									// The data defined options, if they exist, must not be deselected however. Highlight the selected ones.
									// if for ctrl.view.options is here to account for the cases where the only options are those that feature only functionality.
									if(ctrl.view.options != undefined){
									
										var userOptionNames = ctrl.view.options.map(function(o){return o.name})
										if( userOptionNames.includes(option.name) ){
											// This item belongs to an option defined by the data. It must remain selected.
											this.classList.replace("deselected", "selected")
										} // if
									} // if

									
								})
							
						} // appendGroup
						
						
					
					}, // update
					
					helpers: {
						
						
						toggleDisplayBlock: function toggleDisplayBlock(menu){
		
			
							if(menu.style.display === "none"){
								menu.style.display = "block"
							} else {
								menu.style.display = "none"
							} // if
						
						}, // toggleDisplayBlock
						
						toggleDropupMenu: function toggleDropupMenu(){
							var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers
							var menu = d3.select(this.parentElement).select("div")
							
							// Toggle the display of the overall menu.
							h.toggleDisplayBlock(menu.node())
							
							
							// Hide all the accordion submenu menus.
							menu.selectAll(".submenu-content").each(function(){
								this.style.display = "none"
							})
							
							// FAILED CONSIDERATIONS:
							// document.getElementById("myDropdown").classList.toggle("show");
							//wrapper.select(".dropup-content").node().classList.toggle("show");
							
						}, // toggleDropupMenu
						
						toggleDropupSubmenu: function toggleDropupSubmenu(){
							
							// Collect helper object for code readability.
							var h = plotHelpers.setupPlot.twoInteractiveAxes.buttonMenu.helpers
						
							// Collect the submenu corresponding to the clicked element.
							var clickedSubmenu = d3.select(this.parentElement).select(".submenu-content").node()
							
							// This needs to toggle itself, but also all the other submenus, therefor search for them, and loop over them.
							var allSubmenu = d3.select(this.parentElement.parentElement)
							  .selectAll(".submenu-content")
							  
							allSubmenu
							  .each(function(){
								  if(clickedSubmenu == this){
									// The current one that was clicked needs to toggle depending on the current state.
									h.toggleDisplayBlock(this)
								  } else {
									// All others must collapse.
									this.style.display = "none"
								  } // if
							  }) // each
						
						}, // toggleDropupSubmenu
						
						closeDropupMenu: function closeDropupMenu(menu) {
							// 'closeDropupMenu' creates the function to be executed upon click outside the interactive area of the dropup menu. It is targeted for a particular menu, therefore a new function must be created everytime.
						  
							return function(event){
								// If the desired element is NOT preseed, close the corresponding menu.
								if (!event.target.matches('.dropup-toggle')) {
											
									menu.node().style.display = "none";	

								} // if
								
								// If the event matches a submenu, then it's options should be expanded.
							}
							
						}, // closeDropupMenu
					
						toggleSubmenuItemHighlight: function toggleSubmenuItemHighlight(clickedItem){
						
							//
						
							// Deselect competing options
							var allOptions = d3.select(clickedItem.parentNode).selectAll(".submenu-item")
							allOptions.each(function(){
								if( this == clickedItem ){
									// Toggle this option on or off as required.
									if( clickedItem.classList.contains("selected") ){
										clickedItem.classList.replace("selected", "deselected")
									} else {
										clickedItem.classList.replace("deselected", "selected")
									} // if
								} else {
									// Deselect.
									this.classList.replace("selected", "deselected")
								} // if
							})
						
						} // toggleSubmenuItemHighlight
						
						
					} // helpers
				
				}, // buttonMenu
				
				// Title toggle
				updatePlotTitleControls: function updatePlotTitleControls(ctrl){
			
					// Add the toggle to switch manual selection filter on/off
					var container = d3.select( ctrl.figure.node().parentElement )
					  .select(".plotTitle")
					  .select("div.ctrlGrp")
					var onClickEvent = function(){ 
						
						// Update teh DOM accordingly.
						plotHelpers.setupInteractivity.general.toggleToggle(this)
						
						// Update filters
						filter.apply()
						
						render()
					} // onClickEvent
					  
					plotHelpers.setupPlot.general.appendToggle( container, onClickEvent )
					
				}, // updatePlotTitleControls
			
			}, // twoInteractiveAxes
			
		}, // setupPlot
		
		setupInteractivity: {
			
			general: {
				
				onSelectChange: {
					
					vertical: function vertical(ctrl, selectedVar){
						// Update the vertical text and the state.
						
						// Change the text.
						ctrl.figure
						  .select(".leftAxisControlGroup")
						  .select(".txt-vertical-axis")
						  .text( selectedVar )
						  
						// Update the y-variable for the plot.
						ctrl.view.yVarOption.val = selectedVar
						
					}, // vertical
					
					horizontal: function horizontal(){
						
						// Horizontal select change requires so little to update itself that this function here is not necessary as of now.
						
					}, // horizontal
					
				}, // onSelectChange
				
				toggleToggle: function toggleToggle(clickedToggleDOM){
					
					var currentVal = clickedToggleDOM.checked
					
					// All such switches need to be activated.
					var allToggleSwitches = d3
					  .selectAll(".plotWrapper")
					  .selectAll(".plotTitle")
					  .selectAll(".ctrlGrp")
					  .selectAll(".switch")
					  .selectAll("input[type='checkbox']")
					
					allToggleSwitches.each(function(){
						this.checked = currentVal
					}) // each
				}, // toggleToggle
				
			}, // general
			
			twoInteractiveAxes: {
				
				onSelectChange: {
					
					vertical: function vertical(ctrl){
						// 'vertical' returns a function in order to be able to include a reference to the correct 'ctrl' object in it.
						
						return function(){
									
							var selectedVar = this.value
							
							// Perform the regular task for y-select.
							plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar)
							

							// Perform other needed tasks and refresh.
							ctrl.plotFunc.interactivity.onSelectChange(ctrl)
						
						} // return
						
					}, // vertical
					
					horizontal: function horizontal(ctrl){
						// 'horizontal' returns a function in order to be able to include a reference to the correct 'ctrl' object in it.
						
						return function(){
								
							var selectedVar = this.value
							  
							// Update the y-variable for the plot.
							ctrl.view.xVarOption.val = selectedVar
							
							// Perform other needed tasks and refresh.
							ctrl.plotFunc.interactivity.onSelectChange(ctrl)
							
						} // return
						
					}, // horizontal
					
					
					
					
				}, // onSelectChange
							
				addAxisScaling: function addAxisScaling(ctrl){
	
					var svg = ctrl.figure.select("svg.plotArea")
		
					var mw;
					var downx = Math.NaN;
					var downscalex;
					
					var mh;
					var downy = Math.NaN;
					var downscaley;
				
					svg.select(".axis--x")
					  .on("mousedown", function(d) {
						mw = Number( svg.select("g.data").attr("width") )
						mh = Number( svg.select("g.data").attr("height") )
						
						let axisXDOM = svg.select("g.axis--x").node()
						var p = d3.mouse(axisXDOM)[0];
						downx = ctrl.tools.xscale.invert(p);
						downscalex = ctrl.tools.xscale;
						
					  });
					  
					svg.select(".axis--y")
					  .on("mousedown", function(d) {
						mw = Number( svg.select("g.data").attr("width") )
						mh = Number( svg.select("g.data").attr("height") )
						
						let axisYDOM = svg.select("g.axis--y").node()
						var p = d3.mouse(axisYDOM)[1];
						downy = ctrl.tools.yscale.invert(p);
						downscaley = ctrl.tools.yscale;
						
					  });
					  
					// attach the mousemove and mouseup to the body
					// in case one wonders off the axis line
					
					svg
					  .on("mousemove", function(d) {
						  
						let axisXDOM = d3.select(this).select("g.axis--x").node()
						let axisYDOM = d3.select(this).select("g.axis--y").node()
						
						if (!isNaN(downx)) {
						  var px = d3.mouse( axisXDOM )[0]
						  if (downscalex(px) != downx) {
							// Here it would be great if the dragged number would move to where the cursor is.
							
							//let tx = ctrl.view.t.x
							//let tv = downscalex.invert( tx )
							//let vb = tv + ( downx - tv )/( px - tx )*( mw - tx )
							//let va = tv - ( downx - tv )/( px - tx )*tx
							
							let va = downscalex.domain()[0]
							let vb = mw * (downx - downscalex.domain()[0]) / px + downscalex.domain()[0]
							  
							ctrl.tools.xscale.domain([ va,  vb ]);
						  } // if
						  
						  // Execute redraw
						  ctrl.plotFunc.interactivity.dragAdjustAR(ctrl)
						  
						} // if
						
						
						if (!isNaN(downy)) {
						  var py = d3.mouse( axisYDOM )[1]
						  if (downscaley(py) != downy) {
							ctrl.tools.yscale.domain([
								downscaley.domain()[0],  
								mh * ( downy - downscaley.domain()[0]) / (mh-py) + downscaley.domain()[0] 
							])
						  } // if
						  
						  // Execute redraw
						  ctrl.plotFunc.interactivity.dragAdjustAR(ctrl)
							
						} // if
						
					  })
					  .on("mouseup", function(d) {
						downx = Math.NaN;
						downy = Math.NaN;
						// When the domain is manually adjusted the previous transformations are no longer valid, and to calculate the delta at next zoom event the transformation needs to be reinitiated.
						ctrl.view.t = -1
					  });
					  
					  

									
						 
					  
					  
				}, // addAxisScaling
				
				addZooming: function addZooming(ctrl){
					  
					// The current layout will keep adding on zoom. Rethink this for more responsiveness of the website.
					var zoom = d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", zoomed);
				
					// Zoom operates on a selection. In this case a rect has been added to the markup to perform this task.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.background")
					  .select("rect.zoom-area")
					  .call(zoom);
					
					// ctrl.svg.select(".plotArea").on("dblclick.zoom", null);
					
					
					// As of now (23/03/2020) the default zoom behaviour (https://d3js.org/d3.v5.min.js) does not support independantly scalable y and x axis. If these are implemented then on first zoom action (panning or scaling) will have a movement as the internal transform vector (d3.event.transform) won't corespond to the image. 
					
					// The transformation vector is based on the domain of the image, therefore any manual scaling of the domain should also change it. The easiest way to overcome this is to apply the transformation as a delta to the existing state.
					
					// ctrl.view.t is where the current state is stored. If it is set to -1, then the given zoom action is not performed to allow any difference between d3.event.transform and ctrl.view.t due to manual rescaling of the domain to be resolved.
					ctrl.view.t = d3.zoomIdentity
					
					
					function zoomed(){
						
						// Get the current scales, and reshape them back to the origin.
						var t = d3.event.transform
						var t0= ctrl.view.t
						
						// Check if there was a manual change of the domain
						if(t0 == -1){
							t0 = t
						}
						
						// Hack to get the delta transformation.
						var dt = d3.zoomIdentity
						dt.k = t.k / t0.k 
						dt.x = t.x - t0.x 
						dt.y = t.y - t0.y
						
						ctrl.view.t = t
						
						var xScaleDefined = ctrl.tools.xscale != undefined
						var yScaleDefined = ctrl.tools.yscale != undefined
						if(xScaleDefined && yScaleDefined){
							
							// Simply rescale the axis to incorporate the delta event.  
							ctrl.tools.xscale = dt.rescaleX(ctrl.tools.xscale)
							ctrl.tools.yscale = dt.rescaleY(ctrl.tools.yscale)
							
							// Assign appropriate transitions
							ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.instantaneous()
							
							
							// Update the plot
							ctrl.plotFunc.refresh(ctrl)
							
							
						} // if
						
						
						
						
						
					} // zoomed
					  

					  
				}, // addZooming
			
			}, // twoInteractiveAxes
			
		}, // setupInteractivity
             
        setupTools: {
			
			go: function go(ctrl){
	
				// The plot tools are either setup based on data (e.g. upon initialisation), or on where the user has navigated to.
				var bounds = plotHelpers.setupTools.getPlotBounds(ctrl)
				
				
				// Create the required scales.
				ctrl.tools.xscale = d3.scaleLinear()
					.range( bounds.range.x )
					.domain( bounds.domain.x );

				ctrl.tools.yscale = d3.scaleLinear()
					.range( bounds.range.y )
					.domain( bounds.domain.y );
				
			}, // go
			
			getPlotBounds: function getPlotBounds(ctrl){
				// This function should determine the domain of the plot and use it to control the plots aspect ratio.
				var h = ctrl.plotFunc.setupPlot
				var h_= plotHelpers.setupTools
				
				
				// Get the bounds based on the data.
				var domain = h.findDomainDimensions(ctrl)
				var range  = h.findPlotDimensions(ctrl.figure.select("svg.plotArea"))
				
				
				
				
				if( !isNaN(ctrl.view.viewAR) ){
					
					// Adjust the plot domain to preserve an aspect ratio of 1, but try to use up as much of the drawing area as possible.
					h_.adjustAR(range, domain, ctrl.view.viewAR)
					
				} else {
					// The aspect ratio is the ratio between pixels per unit of y axis to the pixels per unit of the x axis. As AR = 2 is expected to mean that the n pixels cover 2 units on y axis, and 1 unit on x axis teh actual ration needs to be ppdx/ppdy.
					
					ctrl.view.dataAR = h_.calculateAR(range, domain)
					ctrl.view.viewAR = h_.calculateAR(range, domain)
				}// switch
				
				
				// Finally, adjust the plot so that there is some padding on the sides of the plot.
				h_.adjustPadding(range, domain)
				
				return {domain: domain, range: range}
			
			
			
			}, // getPlotBounds
			
			adjustPadding: function adjustPadding(range, domain){
				// The padding must be equal both on the x and y axes in terms of pixels used for padding. Specify this simply in terms of pixels. This inadvertently impacts the AR of the actual final plot.
				var padding = 10
			
				var xPad = ( d3.max(domain.x) - d3.min(domain.x) ) / (d3.max(range.x) - d3.min(range.x))*padding 
				var yPad = ( d3.max(domain.y) - d3.min(domain.y) ) / (d3.max(range.y) - d3.min(range.y))*padding
				
				domain.x[0] = domain.x[0] - xPad
				domain.x[1] = domain.x[1] + xPad
				
				domain.y[0] = domain.y[0] - yPad
				domain.y[1] = domain.y[1] + yPad
				
			
			}, // adjustPadding
			
			calculateAR: function calculateAR(range, domain){
				var ppdx = (range.x[1] - range.x[0]) / (domain.x[1] - domain.x[0])
				var ppdy = (range.y[0] - range.y[1]) / (domain.y[1] - domain.y[0])
				return ppdx / ppdy
			}, // calculateAR
						
			adjustAR: function adjustAR(range, domain, AR){
			
				// The limits of the data definitely need to be within the plot.
				// If the x range is fixed, then there is a maximum AR that can be imposed. If the forced AR is larger the x range will need to be adjusted to display it appropriately
				
				// The smaller of these will be the dominating one.
				var xAR = (d3.max(range.x) - d3.min(range.x)) / ( d3.max(domain.x) - d3.min(domain.x) )
				var yAR = (d3.max(range.y) - d3.min(range.y)) / ( d3.max(domain.y) - d3.min(domain.y) )

				if(xAR*AR <= yAR){
					// Resize the y domain.
					var yDiff = (d3.max(range.y) - d3.min(range.y)) / (xAR/AR)
					domain.y[1] = domain.y[0] + yDiff
				} else {
					// Resize the x domain.
					var xDiff = (d3.max(range.x) - d3.min(range.x)) / (yAR*AR)
					domain.x[1] = domain.x[0] + xDiff

				} // if
			
			}, // adjustAR

			
			
		}, // setupTools
        
        
        	
		
	} // plotHelpers


export { plotHelpers };