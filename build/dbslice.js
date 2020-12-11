var dbslice = (function (exports) {
    'use strict';


	// State object.
	var dbsliceData = {
		data: undefined,
		flowData: [],
		session: {}
	} // dbsliceData

	// Positioning of plots
	var positioning = {
        
		// Basic grid functionality
		
        nx: function nx(container){
            
            let nx
            container.each(function(d){
                nx = d.grid.nx
            })
            return nx
            
        }, // nx
        
        dx: function dx(container){
            
            // First access the grid associated with the container.
            let nx = positioning.nx(container)
            
            return container.node().offsetWidth / nx 
        }, // dx
        
        dy: function dy(container){
            // The height of the container can change, and the number of grid points cannot be fixed. Instead the aspect ratio (dx/dy) is defined as 1. This is also taken into account when new plots are created.
            return positioning.dx(container)
            
        }, // dy

		// Dragging plots

        dragStart: function dragStart(d){
            
			// Raise the plot.
			d.format.wrapper.raise();  
			
            // Calculate the delta with the reference to the plot wrapper.
            d.format.position.delta = d3.mouse(d.format.wrapper.node())
										
			
          
        }, // dragStart
            
        dragMove: function dragMove(d,i){
            
            var f = d.format
            var container = d3.select(f.parent)
            let nx = positioning.nx(container)
            let dx = positioning.dx(container)
            let dy = positioning.dy(container)
            
            
  
            // Calculate the proposed new position on the grid.
            // d3.event is relative to the top left card corner
            // d.format.position.ix*dx corrects for the position within the container
            // d.format.position.delta.x corrects for the clicked offset to the corner
            //let ix = Math.round( (d3.event.x + f.position.ix*dx - f.position.delta.x) / dx);
            //let iy = Math.round( (d3.event.y + f.position.iy*dy - f.position.delta.y) / dy);
          
            let ix = Math.round( (d3.mouse(f.parent)[0] - f.position.delta[0]) / dx);
            let iy = Math.round( (d3.mouse(f.parent)[1] - f.position.delta[1]) / dy);
          
            
          
            // Implement rules on how far the contour can be moved. Prevent the contour to go even partially off-screen.
              
            // EAST BOUNDARY
            if( ix + f.position.iw > nx ){
                ix = nx - f.position.iw
            } // if

            // WEST BOUNDARY
            if( ix < 0 ){
                ix = 0
            } // if

            // SOUTH BOUNDARY: If it is breached then the parent size should be increased.
            // if( iy + d.format.position.ih > grid.ny ){
            //    iy = grid.ny - d.format.position.ih
            // } // if

            // NORTH BOUNDARY
            if( iy < 0 ){
                iy = 0
            } // if


            // Update the container position.
            let movement = ix != f.position.ix || iy != f.position.iy
            if (movement){
                
                f.position.ix = ix;
                f.position.iy = iy;
                
                // The exact location must be corrected for the location of the container itself.
				
                f.wrapper
                  .style("left", (f.parent.offsetLeft + f.position.ix*dx) + "px")
                  .style("top" , (f.parent.offsetTop + f.position.iy*dy) + "px")
                  .raise();  

				// Move this to the individual functions. This allows the contour plot to change both the plot and plot row sizes. The contour plot will also have to move the other plots if necessary!!
				
				d.plotFunc.interactivity.refreshContainerSize(d)
				  
            } // if
          
        }, // dragMove
            
        dragEnd: function dragEnd(d){
            // On drag end clear out the delta.
            d.format.position.delta = undefined
        }, // dragEnd
        
		
		dragSmooth: function dragSmooth(ctrl){
			
			/*
			ctrl = {
				wrapper: card to move
				container: bounding element
				onstart: on-start event
				onmove: on-move event
				onend: on-end event
				position: position accessor
			}
			*/
			
			function getMousePosition(containerDOM){
					
				let mousePosition = d3.mouse(containerDOM)
				
				return {
					x: mousePosition[0],
					y: mousePosition[1]
				}
			} // getMousePosition
			
			// Position: absolute is somehow crucial to make thedragging smooth at the start!
			return d3.drag()
				.on("start", function(d){
					let position = ctrl.position(d)
					position.mouse = getMousePosition(ctrl.container.node())
					ctrl.onstart(d)		
				})
				.on("drag", function(d){
					let position = ctrl.position(d)
					let mp0 = position.mouse
					let mp1 = getMousePosition(ctrl.container.node())
					
					
					let movement = {
						x: mp1.x - mp0.x,
						y: mp1.y - mp0.y
					}
					
					position.mouse = mp1
					
					
					// Stop the movement exceeding the container bounds.
					let rightBreach = position.w + position.x + movement.x > ctrl.container.node().offsetWidth
					let leftBreach = position.x + movement.x < 0
					if( rightBreach || leftBreach ){
						movement.x = 0
					} // if
					
					// Bottom breach should extend the plot!
					if( position.y + movement.y < 0 ){
						movement.y = 0
					} // if
					
					position.x += movement.x
					position.y += movement.y
					
					
					
				
					ctrl.wrapper(d)
					  .style("left", position.x + "px")
					  .style("top", position.y + "px")
					  
					  
					// Also update the ix and iy.
					let dx = positioning.dx(ctrl.container)
					let dy = positioning.dy(ctrl.container)
					
					position.ix = Math.floor( position.x / dx )
					position.iy = Math.floor( position.y / dy )
					  
					// Move also all the members.
					ctrl.onmove(d)
				})
				.on("end", function(d){
					// Fix into grid positions?
					ctrl.onend(d)
				})
			
		}, // dragSmooth
		
		// Resizing plots
		
		resizeStart: function resizeStart(d){
			// Bring hte plot to front.
			d.format.wrapper.raise()
			
		}, // resizeStart
		
		resizeMove: function resizeMove(d){
  
  
			// Calculate the cursor position on the grid. When resizing the d3.event.x/y are returned as relative to the top left corner of the svg containing the resize circle. The cue to resize is when the cursor drags half way across a grid cell.
			
			// this < svg < bottom div < plot body < card < plotWrapper
			var f = d.format
			let parent = d.format.parent
			let container = d3.select(parent)
			let p = d.format.position
			
			
			let nx = positioning.nx( container )
			let dx = positioning.dx( container )
			let dy = positioning.dy( container )
			
			
			// clientX/Y is on-screen position of the pointer, but the width/height is relative to the position of the plotWrapper, which can be partially off-screen. getBoundingClientRect retrieves teh plotRowBody position relative to the screen.
			let x = d3.event.sourceEvent.clientX -parent.getBoundingClientRect().left -p.ix*dx
			let y = d3.event.sourceEvent.clientY -parent.getBoundingClientRect().top -p.iy*dy
		  
		    let ix = p.ix
			let iw = Math.round( x / dx )
			let ih = Math.round( y / dy )
		  
			// Calculate if a resize is needed
			let increaseWidth = iw > p.iw
			let decreaseWidth = iw < p.iw
			let increaseHeight = ih > p.ih
			let decreaseHeight = ih < p.ih
			  
			// Update the container size if needed
			if([increaseWidth, decreaseWidth, increaseHeight, decreaseHeight].some(d=>d)){
				
				// Corrections to force some size. The minimum is an index width/height of 1, and in px. The px requirement is to make sure that the plot does not squash its internal menus etc. In practice 190/290px seems to be a good value. This finctionality handles the contours as well, therefore the minimum limits are in the format.position attribute.
				
				iw = iw*dx < p.minW ? Math.ceil(p.minW/dx) : iw
				ih = ih*dy < p.minH ? Math.ceil(p.minH/dy) : ih
				
								
				// RETHINK THIS LIMIT!! FOR CONTOUR PLOTS THE PX LIMIT IS NOT NEEDED!!
				
				// Correction to ensure it doesn't exceed limits.
				iw = (ix + iw) > nx ? nx - ix : iw
				
				
				// Width must simultaneously not be 1, and not exceed the limit of the container.
					
				p.ih = ih
				p.iw = iw

				
				
				// this < svg < bottom div < plot body < card < plotWrapper
				f.wrapper
				  .style("max-width", iw*dx + "px")
				  .style("width"    , iw*dx + "px" )
				  .style("height"   , ih*dy + "px" )
				  
				f.wrapper.select("div.card")
				  .style("max-width", iw*dx + "px")
				  .style("width"    , iw*dx + "px" )
				  .style("height"   , ih*dy + "px" )
				
				
				// UPDATE THE PLOT
				d.plotFunc.rescale(d)
				
				// Resize the containers accordingly
				d.plotFunc.interactivity.refreshContainerSize(d)
				
				// Redo the graphics.
					
			} // if
			  
		  
		}, // resizeMove
		
		resizeEnd: function resizeEnd(d){
		    // After teh resize is finished update teh contour.
		  
		    let container = d3.select(d.format.parent)
		    builder.refreshPlotRowHeight( container )
			builder.refreshPlotRowWidth(  container )
			
		    

		}, // resizeEnd
		
		// Positioning a new plot
		
        newPlot: function newPlot(plotRowCtrl, newPlotCtrl){
			
			// Now find the first opening for the new plot. The opening must fit the size of the new plot.
			
			
			
			// IMPOSE PIXEL LIMITS HERE, IF ANYWHERE.
			// plotRowCtrl has its DOM stored in hte attribute `element'
			
			
			
			// Somehow count through the domain and see if the plot fits. 
			// First collect all occupied grid nodes.
			
			let h = positioning.helpers
			let occupiedNodes = []
			plotRowCtrl.plots.forEach(function(d){
				// Collect the occupied points as x-y coordinates.
				let p = d.format.position
				
				h.pushNodes(occupiedNodes, p.ix, p.iy, p.iw, p.ih)
				
			}) // forEach plot
			
			
			// Position the new plot.
			positioning.onGrid(plotRowCtrl.grid.nx, occupiedNodes, newPlotCtrl.format.position)
			
			
			//return newPlotCtrl
			
		}, // newPlot
        
		newCard: function newCard(plotCtrl){
			
			
			// The difference between plots and cards is that plots are added manually, and the cards are added automatically.
			
			let h = positioning.helpers
			let occupiedNodes = []
			
			// Collect already occupied nodes. Check if there are any existing contours here already. The existing contours will have valid `ix' and `iy' positions. Position all new cards below the existing ones. This means that all nodes that have an existing card below them are `occupied'.
			
			// How to eliminatethe empty space at the top though?? Calculate the min iy index, and offset all plots by it?
			let minOccupiedIY = d3.min(plotCtrl.data.plotted, function(d){
				return d.format.position.iy})
			plotCtrl.data.plotted.forEach(function(d){
				d.format.position.iy -= minOccupiedIY
			})
				
			let maxOccupiedIY = 	d3.max(plotCtrl.data.plotted, function(d){
				return d.format.position.iy + d.format.position.ih})
			h.pushNodes(occupiedNodes, 0, 0, plotCtrl.grid.nx, maxOccupiedIY)
			
			
			
			// With all the occupied nodes known, start positioning the contours that are not positioned.
			let dx = positioning.dx(plotCtrl.figure)
			let dy = positioning.dy(plotCtrl.figure)
			
			plotCtrl.data.plotted.forEach(function(d){
				let pn = d.format.position
			
				
				// Position this card, but only if it is unpositioned.
				if( ( (pn.ix == undefined) || isNaN(pn.ix) ) && 
				    ( (pn.iy == undefined) || isNaN(pn.iy) ) ){
					
					// Position the plot on hte grid.
					positioning.onGrid(plotCtrl.grid.nx, occupiedNodes, pn)
					
					// Add position in absolute coordinates
					pn.x = pn.ix*dx
					pn.y = pn.iy*dy
				
					// Mark the nodes as occupied.
					h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih)
					
				} // if
				
			}) // forEach plot
			
			
			
			
		}, // newCard
		
		onGrid: function onGrid(nx, occupiedNodes, pn){
			
			// POSITIONONGRID finds the first free spot on a grid with `nx' horizontal nodes, which already has plots occupying the `occupiedNodes' grid nodes, for a plot whose size and position is defined by the position object `pn'.

			
			// Moving through the nodes and construct all nodes taken up if the plot is positioned there.
			
			let h = positioning.helpers
			let ind = 0
			let areaFound = false
			var x0, y0
			var proposedNodes
			while(areaFound==false){
				
				// CAN BE IMPROVED IF IT TAKES INTO ACCOUNT THE WIDTH OF THE PROPOSED ELEMENT
				
				// Calculate the starting point for the suggested position.
				
				// The `12th' point doesnt need to be evaluated, as it is on the edge. 
				y0 = Math.floor( ind / nx )
			    x0 = ind - y0*nx
				
				if(x0 > nx - pn.iw){
					// In this case skip the node evaluation.
				} else {
					proposedNodes = h.pushNodes([], x0, y0, pn.iw, pn.ih)
			
					// Check if any of the queried points are occupied.
					areaFound = h.isAreaFree(occupiedNodes, proposedNodes)
				} // if
				
				
				
				// Increase the node index
				ind += 1
			} // while
			
			// If the are was found, the suggested nodes are free. Assign them to the new plot. The first node is the top left corner by the loop definition in pushNodes.
			pn.ix = x0
			pn.iy = y0
			
			
			
			
			
			
		}, // onGrid
		
		helpers: {
			
			pushNodes: function pushNodes(array, ix, iy, iw, ih){
				
				for(let i=0; i<iw; i++){
					for(let j=0; j<ih; j++){
						array.push({
							ix: ix + i, 
							iy: iy + j
						}) // push
					} // for row
				} // for column
				
				return array
			}, // pushNodes

			isAreaFree: function isAreaFree(existing, proposed){
				
				let intersect = proposed.filter(function(node){
					let isIntersect = false
					for(let i=0; i<existing.length; i++){
						isIntersect = (existing[i].ix == node.ix) 
						           && (existing[i].iy == node.iy)
						if(isIntersect){
							break;
						}
					} // for
					
					return isIntersect
				}) // intersect
				
				// If there are any intersections return false.
				return intersect.length > 0 ? false : true
			}, // isAreaFree
			
			findContainerSize: function findContainerSize(container, memberClass){
				// CHANGE THE CORRESPONDING FUNCTION IN POSITIONING TO ABSORB THIS ONE!!

				let dy = positioning.dy(container)
		
				// Index of the lowest plot bottom.
				var ih = 0
				container
				  .selectAll( memberClass )
				  .each(function(d){
					  let ipb = d.format.position.iy + d.format.position.ih
					  ih = ipb > ih ? ipb : ih
				})
				
				return Math.ceil(ih*dy)
				
			
			}, // findContainerSize
			
			repositionSiblingPlots: function repositionSiblingPlots(plotCtrl){
				// A plot has moved. Reposition other plots around it.
				// Maybe change this to reposition only the affected plots??
				
				let h = positioning.helpers
				
				// If the body of the plot moves, then hte other plots must also move.
				let plotRowBody = d3.select(plotCtrl.format.parent)
				let plotRowCtrl = plotRowBody.data()[0]
				
				
				let dx = positioning.dx(plotRowBody)
				let dy = positioning.dy(plotRowBody)
				
				// Update the positions of all hte other plots in this plot row.
				let occupiedNodes = []
				let pn = plotCtrl.format.position
				h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih)
				
				plotRowCtrl.plots.forEach(function(plotCtrl_){
					// Only reposition plots that aren't the current plot.
					// Maybe change this to reposition only the affected plots?? Change it such that the plot moves a minimal amount?? If the adjacent positions are not free then move it down??
					if(plotCtrl_ != plotCtrl){
						
						let f = plotCtrl_.format
						let pn = f.position
								  
						// Find a new position for this plot.
						positioning.onGrid(plotRowCtrl.grid.nx, occupiedNodes, pn)
					  
						// Update the occupied nodes.
						h.pushNodes(occupiedNodes, pn.ix, pn.iy, pn.iw, pn.ih)
						
						// Update the plot DOMs.
						f.wrapper
						  .style("left", (f.parent.offsetLeft + f.position.ix*dx) + "px")
						  .style("top" , (f.parent.offsetTop + f.position.iy*dy) + "px")
						  
					} // if
				})
				
			}, // repositionSiblingPlots
			
			readjustPlotSize: function readjustPlotSize(plotCtrl){
				
				// Calculate the new size of the plot based on the current size in 'px', and the new grid dimension. The new size must definitely be larger than before to ensure the plots don't get too small.
				
				var f = plotCtrl.format
				let p = plotCtrl.format.position
				
				// By recalculating the indices of the grid the plots never really get any smaller, and therefore cannot violate the smallest size.
				let wrapperDOM = f.wrapper.node()
				let height = wrapperDOM.offsetHeight
				let width = wrapperDOM.offsetWidth
				
				
				let container = d3.select( f.parent )
				let nx = positioning.nx( container )
				let dx = positioning.dx( container )
				let dy = positioning.dy( container )
				
				// Find the smallest option that would work.
				p.iw = Math.ceil( width / dx )
				p.ih = Math.ceil( height / dy )
				
				
				// Make sure the new iw doesn't exceed the limit.
				p.iw = p.iw > nx ? nx : p.iw
				
				
				f.wrapper
				  .style("max-width", p.iw*dx + "px")
				  .style("width"    , p.iw*dx + "px" )
				  .style("height"   , p.ih*dy + "px" )
				  
				f.wrapper.select("div.card")
				  .style("max-width", p.iw*dx + "px")
				  .style("width"    , p.iw*dx + "px" )
				  .style("height"   , p.ih*dy + "px" )
				
				
				// UPDATE THE PLOT
				plotCtrl.plotFunc.rescale(plotCtrl)
				
				// Resize the containers accordingly
				plotCtrl.plotFunc.interactivity.refreshContainerSize(plotCtrl)
				
			}, // readjustPlotSize
			
			readjustPlotPosition: function readjustPlotPosition(plotCtrl){
				
				// Calculate the new size of the plot based on the current size in 'px', and the new grid dimension. The new size must definitely be larger than before to ensure the plots don't get too small.
				
				var f = plotCtrl.format
				let p = plotCtrl.format.position
				

				
				let container = d3.select( f.parent )
				let nx = positioning.nx( container )
				let dx = positioning.dx( container )
				let dy = positioning.dy( container )
				
				// Readjust the ix so that the plot is not out of the container.
				p.ix = p.ix + p.iw > nx ? nx - p.iw : p.ix
				
				
				
				
				
				f.wrapper
                  .style("left", (f.parent.offsetLeft + p.ix*dx) + "px")
                
				// Move this to the individual functions. This allows the contour plot to change both the plot and plot row sizes. The contour plot will also have to move the other plots if necessary!!
				
				plotCtrl.plotFunc.interactivity.refreshContainerSize(plotCtrl)
				
			} // readjustPlotPosition
			
		} // helpers
		
    } // positioning

    
	// Lasso
	var lasso = {
		
		/*
		The 'lasso.add' method requires a specific input lasso object, which contains all hte information required.
		
		var lassoObj = {
			element: {
				// 'owner': element to attach the lasso to.
				// 'svg'  : where to draw the lasso to
				// 'ref'  : reference for position retrieval
				owner: svg,
				svg: svg.select("g.markup"),
				ref: svg.select("g.data")
			},
			data: {
				// 'boundary': array holding boundary points
				// 'selection': array holding the selected data
				// 'getBasisData': accessor getting the actual tasks to be selected by the lasso.
				boundary: [],
				selection: [],
				getBasisData: function(){ return data; }
			},		
			accessor: {
				// accessor retrieving the appropriate attributes of underlying data.
				x: function(d){return d.x},
				y: function(d){return d.y},
			},
			scales: {
				// scales to convert the on-screen pixels to the values of the data. Inverse of the scales used to convert values to on-screen position.
				x: val2pxX.invert,
				y: val2pxY.invert
			},
			// Function to execute in response. The selected tasks are the input
			response: highlight,
		}
		*/
	
		add: function add(lassoObj){
		
			lassoObj.element.owner
			  .call( d3.drag()
				.on("start", function(){
					// Clear previous lasso.
					lassoObj.data.boundary = []
					lasso.draw( lassoObj )
					
					// Perform any pre-emptive action required.
					lassoObj.preemptive()
				})
				.on("drag", function(){
					lasso.addPointToLasso( lassoObj )
					lasso.draw( lassoObj )
				})
				.on("end", function(){
					if(lassoObj.data.boundary.length > 3){
						
						lassoObj.data.selection = lasso.findTasksInLasso(lassoObj)
						
						if(lassoObj.data.selection.length > 0){
							lassoObj.response(lassoObj.data.selection)
						} // if
						
						// After the selection is done remove the lasso.
						lasso.remove( lassoObj )
					} // if
				})
			  )
		
		}, // add
		
		addPointToLasso: function addPointToLasso(lassoObj){
		
			let position = d3.mouse(lassoObj.element.ref.node())
			
			lassoObj.data.boundary.push({
				cx: position[0],
				cy: position[1],
				 x: lassoObj.scales.x(position[0]), 
				 y: lassoObj.scales.y(position[1])
			})
		
		}, // addPointToLasso
		
		findTasksInLasso: function findTasksInLasso(lassoObj){
		
			// Find min and max for the lasso selection. Her the accessors can be hard coded because the points definition is hard coded.
			var dom = {
				x: d3.extent( lassoObj.data.boundary, d=>d.x ),
				y: d3.extent( lassoObj.data.boundary, d=>d.y ),
			}
		
			// Don't get the data through the dom elements - this won't work for canvas lassoing. Instead focus directly on the data in hte plot.
			let allTasks = lassoObj.data.getBasisData()
			
			var selectedTasks = allTasks.filter(function(d_){
				// Check if it is inside the lasso bounding box. Otherwise no need to check anyway.
				
				// Implement an accessor for d.x/y.
				var d = {
					x: lassoObj.accessor.x(d_),
					y: lassoObj.accessor.y(d_),
				}
				
				var isInside = false
				if( 
				  ( (dom.x[0] <= d.x) && (d.x <= dom.x[1]) ) &&
				  ( (dom.y[0] <= d.y) && (d.y <= dom.y[1]) )
				){
					isInside = lasso.isPointInside(d, lassoObj.data.boundary)
				} // if
				
				return isInside
			})
			
			return selectedTasks
		
		}, // findTasksInLasso
		  
		isPointInside: function isPointInside(point, boundary){
			// Check wheteher the 'point' is within the polygon defined by the points array 'boundary'.
			
			var isInside = false
			for(let i=1; i<boundary.length; i++){
				checkIntersect(boundary[i-1], boundary[i], point)
			} // for
			checkIntersect(boundary[boundary.length-1], boundary[0], point)
			
			return isInside
			
			// Need to check the same number of edge segments as vertex points. The last edge should be the last and the first point.
		
			function checkIntersect(p0, p1, point){
				// One point needs to be above, while the other needs to be below -> the above conditions must be different.
				
				if( (p0.y > point.y) !== (p1.y > point.y) ){
					// One is above, and the other below. Now find if the x are positioned so that the ray passes through. Essentially interpolate the x at the y of the point, and see if it is larger.
					let x = (p1.x - p0.x)/(p1.y - p0.y)*(point.y - p0.y) + p0.x
					
					isInside = x > point.x ? !isInside : isInside
					
				} // if
			} // checkIntersect
		
		}, // isPointInside
		  	
		draw: function draw(lassoObj){
			
			var d = [lassoObj.data.boundary.map(d=>[d.cx, d.cy].join()).join(" ")]
			
			lassoObj.element.svg
			  .selectAll("polygon")
			  .data(d)
			  .join(
				enter => enter.append("polygon")
							  .attr("points", d=>d)
							  .style("fill", "cornflowerblue")
							  .style("stroke", "dodgerblue")
							  .style("stroke-width", 2)
							  .attr("opacity", 0.4),
				update => update
							  .attr("points", d=>d),
				exit => exit.remove()
			  )
			
			 
		}, // draw
		
		remove: function remove(lassoObj){
		
			lassoObj.element.svg
			  .selectAll("polygon")
			  .remove()
		} // remove
		
	} // lasso
	
	
	// Data management. Handles all internal data manipulation.
	// MERGE WITH IMPORT/EXPORT?
	var cfDataManagement = {
		
		cfInit: function cfInit(metadata){
      
			var cfData = {};
			cfData.metaDataProperties = metadata.header.metaDataProperties;
			cfData.dataProperties = metadata.header.dataProperties;
			cfData.line2dProperties = metadata.header.line2dProperties;
			cfData.contour2dProperties = metadata.header.contour2dProperties;
			
			cfData.cf = crossfilter(metadata.data);
			cfData.metaDims = [];
			cfData.metaDataUniqueValues = {};
			cfData.dataDims = [];
			cfData.taskDim = []
			cfData.fileDim = [];
			cfData.filterSelected = [];
			cfData.histogramSelectedRanges = [];
			cfData.manuallySelectedTasks = [];
			
			// Populate the metaDims and metaDataUniqueValues.
			cfData.metaDataProperties.forEach(function (property, i) {
				// Dimension object
				cfData.metaDims[property] = 
					cfData.cf.dimension(function (d){return d[property];})
				
				// Its unique values
				cfData.metaDataUniqueValues[property] = helpers.unique( metadata.data.map(
					function (d){return d[property]}
				));
			}); // forEach
			
			
			// Populate the dataDims. cf.dimension(function(d){return d.<property>}) sets up a dimension, which is an object that can perform some specific tasks based on the data it is give. Two of these are "top(n)", and "bottom(n)", whih return topmost and bottommost n elements respectively.
			cfData.dataProperties.forEach(function (property, i) {
			  cfData.dataDims[property] = 
				cfData.cf.dimension(function (d){return d[property];});
			}); // forEach
			
			

			cfData.fileDim = cfData.cf.dimension(function (d){return d.__file__;})
			cfData.taskDim = cfData.cf.dimension(function (d){return d.taskId;})
			

			// Check if any histogram selected ranges have already been set up. This is important when the data is being replaced.
			if(dbsliceData.data !== undefined){
				if(dbsliceData.data.histogramSelectedRanges !== undefined){
					cfData.histogramSelectedRanges = dbsliceData.data.histogramSelectedRanges
				} // if
			} // if
			
			
			// Store data internally
		    dbsliceData.data = cfData;
			
			// Update the color options.
			color.settings.options = dbsliceData.data.metaDataProperties
			
			
		
			
		}, // cfInit
				
		cfAdd: function cfAdd(metadata){
			// This function attempts to add data to the already existing dataset. It allows a compromise between searching for all available data and loading it in, and personally creating additional combinations of the metadata in csv files.
			// The ideal solution would be for each individual task to have it's own small metadata file, which could then by parsed by a search engine. This is unpractical for a localised application - this functionality is usable however.
			
			// If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
			if (dbsliceData.data !== undefined){
				
				
				// If no data is currently loaded then call cfInit instead - this allows the dimensions to be overrun.
				if (dbsliceData.data.cf.all().length < 1){
					cfDataManagement.cfInit(metadata)
			
				} else {
			
					// Here the compatibility of data needs to be assessed. If the new dataset has the same variables as the existing datasets, then add those in. If it does not do nothing.
					var canMerge = cfDataManagement.helpers.crossCheckProperties(dbsliceData.data, metadata)
					
					if(canMerge){
						
						// Add these records into the dataset.
						dbsliceData.data.cf.add(metadata.data)

					} // if
				} // if
				
				
			} else {
				cfDataManagement.cfInit(metadata)
			} // if
			
			
		}, // cfAdd
			
		cfRemove: function cfRemove(dataFilesToRemove){
			// This function will remove the data from the crossfilter.
			
			// Remove the current user selected filter.
			filter.remove()
			
			// Apply a temporary filter: which files are to be removed..
			dbsliceData.data.fileDim.filter(function(d){
				return dataFilesToRemove.indexOf(d) > -1
			})
			
			
			// Remove the data.
			dbsliceData.data.cf.remove()
			
			
			// Remove the temporary filter.
			dbsliceData.data.fileDim.filterAll()
			
			
			// Refresh the data info
			cfDataManagement.helpers.refreshMetadataInfo()
			
			// Reinstate user specified data filters.
			filter.apply()
			
			
		}, // cfRemove
		
		
		// Variable handling
		variableUseChange: function variableUseChange(newHeader){
			
			// Go through the new header. The changes require also the crossfilter dimensions to be adjusted.
			
			
			
			
			Object.keys(newHeader).forEach(function(key){
				let cfData = dbsliceData.data
				
				let diff = setDifference(cfData[key], newHeader[key])
				
				switch(key){
					case "metaDataProperties":
					  
					  // Dimensions first
					  resolveDimensions(cfData.metaDims, diff)
					  
					  // Handle the metadata unique values arrays.
					  resolveUnique(cfData.metaDataUniqueValues, diff, function (varName){
							return helpers.unique( 
								  cfData.fileDim.top(Infinity).map(
									function (d){return d[varName]}
								  )
								);
						})
						
					  cfData[key] = newHeader[key]
					  
					  break;
					
					case "dataProperties":
					
					  // Dimensions first
					  resolveDimensions(cfData.metaDims, diff)
					  
					  resolveUnique(cfData.histogramSelectedRanges, diff, function(){return undefined})
					  
					  cfData[key] = newHeader[key]
					
					  break;
					  
					case "line2dProperties":
					case "contour2dProperties":
					  // Just replace the options
					  cfData[key] = newHeader[key]
					  break;
					
				} // switch
				
			})
			
			// Update the color options.
			color.settings.options = dbsliceData.data.metaDataProperties
			
			
			// PLOTS NEED TO BE REFRESHED, AS WELL AS THE MENUS THAT HOLD THE VARIABLES!!!
			importExport.helpers.onDataAndSessionChangeResolve()
			
			
			function resolveUnique(vals, diff, populate){
				
				
				diff.aMinusB.forEach(function(varName){
					delete vals[varName]
			    })
				
				
				diff.bMinusA.forEach(function(varName){
				    vals[varName] = populate(varName)
			    })

			} // resolveUnique
			
			
			function resolveDimensions(dims, diff){
				
			    // Those in A, but not in B, must have their cf dimensions removed.
			    diff.aMinusB.forEach(function(varName){
					delete dims[varName]
					
			    })
			  
			    // Those in B, but not in A, must have cf dimensions created.
			    diff.bMinusA.forEach(function(varName){
				    let newDim = dbsliceData.data.cf.dimension(function (d){return d[varName];})
				  
				    dims[varName] = newDim
			    })
				
			} // resolveDimensions
			
			
			function setDifference(A, B){
				
				
				let a = new Set(A);
				let b = new Set(B);
				
				return { 
				  aMinusB: new Set([...a].filter(x => !b.has(x))),
				  bMinusA: new Set([...b].filter(x => !a.has(x)))
				}
			}
			
		}, // variableUseChange
		
		
		// On-demand file library:
		refreshTasksInPlotRows: function refreshTasksInPlotRows() {
			// Collect all files that need to be loaded, create promises for them and store them into plot promise arrays that can be used to signal to the plot functions when they can update themselves.
			
			// It is expected that the individual plot controls have the sliceId specified in 'ctrl.view.sliceId', and that they have the promises stored under 'ctrl.data.promises'.
			
			// 'dbsliceData.flowData' will contain references to all promises created, and will keep track of the individual file promises. 'plotPromise' is an array of promises constructed for individual plots, and should trigger the redraw on completion of promise.
			
			
			// First do an inventory check of the central booking, and clear out unnecessary items.
			
			
			
			// Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
			cfDataManagement.removeRedundantFiles()
			
			
			var filteredTasks = dbsliceData.data.taskDim.top(Infinity)
			
			
			
			// Create the actual promises to be stored in the central booking. This is a duplicative loop over the existing promises because the plot ctrl assigns the data processor function, which 'collectAllRequiredFiles' does not collect.
			dbsliceData.session.plotRows.forEach(function(plotRowCtrl, i){
			
				// Only consider plots for loading if the plot row is a "plotter". In future this could be moved to the actual plot ctrl's themselves and they could say whether they're expecting data from outside or not.
				if(plotRowCtrl.type == "plotter"){
					
				plotRowCtrl.plots.forEach(function(plotCtrl, j){
			  
				
					// Loop over all the files that will be required for this plot.
					var sliceId = plotCtrl.view.sliceId
					var requiredFiles = filteredTasks.map(function(d){return d[sliceId] })
					
					// For this particular plot all promises must be made, and a record tracked.
					var plotPromise = []
					var file = undefined
					
					requiredFiles.forEach(function(url, k){
					
						// The loaded files must be updated to prevent duplicate loading.
						file = undefined
						var loadedFiles = dbsliceData.flowData.map(function(d){return d.url})
					
					
						// Check if a promise to this file has already been created.
						var fileIndex = loadedFiles.indexOf( url )
						if( fileIndex < 0 ){
							//console.log("loading: " + url)
							// Promise for this file does not yet exist. Create it, store a reference in 'dbsliceData.flowData', and another in the 'plotCtrl.data.promises'. The storing into 'dbsliceData.flowData' is done in the makeFilePromise already. The storing in the plot ctrl is done to allow the plotting function itself to identify any differences between the plotted state and the tasks selected in hte filter. This is useful if the plots should communicate to the user that they need to be updated.
							file = makeFilePromise( url, plotCtrl.data.processor )
							
						} else {
						
							file = dbsliceData.flowData[fileIndex]
							
						} // if
						
						plotCtrl.data.promises.push( file.promise )
					
					}) // forEach
				
				
					// If a file is not found a rejected promise is stored. Therefore, if dbslice couldn't find the file, it will not look for it again. If it would instead search for it every time the refresh button is clicked, missing file issues could be resolved on the fly. However, if data is missing in the files the app must be reloaded so that the promises are cleared, so that on next load the new data is loaded too.
					// It is important that the promises log themselves immediately, and remain in place in order to ensure no additional loading is scheduled. Therefore the central booking must clear out the rejected files AFTER all the promises have been processed. This is done when the "Plot Selected Tasks" button is pressed again. 
					
					
					// Now that all the plot promises have been assembled, attach the event to run after their completion.
					addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j)
				
			  
				}) // forEach
				
				} // if
			
			}) // forEach
			
			function makeFilePromise( url, processor ){
				// Has to return an object {url: url, promise: Promise(url)}. Furthermore, the completion of the promise should store the data into this same object.
				
				var file = {  url: url,
						  promise: undefined,
							 data: undefined}
				
				// Create teh promise to load and process the data.
				file = processor.createFilePromise(file)
				
				// Store the file into the central booking location.
				dbsliceData.flowData.push( file )
				
				return file
				
			} // makeFilePromise
			
			function addUpdateOnPromiseCompletion(plotCtrl, sliceId, i, j){
			
				
				Promise.all( plotCtrl.data.promises ).then(function(){
					// The data has been loaded, start the plotting. How to pass in special parameters?
					
					// console.log("Started plotting slice: "+sliceId+" ( plotRow:"+i+", plot: "+j+")")
					
					
					plotCtrl.plotFunc.updateData(plotCtrl)
					
				})
			
			} // addUpdateOnPromiseCompletion

		}, // refreshTasksInPlotRows
		
		collectAllRequiredUrls: function collectAllRequiredUrls(filteredTasks){
		
			var requiredUrls = []
			dbsliceData.session.plotRows.forEach(function(plotRowCtrl){
			
				plotRowCtrl.plots.forEach(function(plotCtrl){
			  
				
					// Loop over all the files that will be required for this plot.
					if(plotCtrl.view.sliceId != undefined){
						
						requiredUrls = requiredUrls.concat( filteredTasks.map(function(d){
							return d[ plotCtrl.view.sliceId ] 
						}))
					} // if
			  
			    }) // forEach
			
			}) // forEach
		
			return requiredUrls
		}, // collectAllRequiredUrls
		
		removeRedundantFiles: function removeRedundantFiles(){
			
			// Collect all the files that need to be loaded. Note that the files are individual properties of the records in the crossfilter.
			var filteredTasks = dbsliceData.data.taskDim.top(Infinity)
			
			
			// Collect all the required, and loaded files, and identify which, if any, files in the central booking will be redundant, and clear them out.
			var allRequiredUrls = cfDataManagement.collectAllRequiredUrls(filteredTasks)
			var allLoadedUrls = dbsliceData.flowData.map(function(file){return file.url})
			
			var redundantFiles = dbsliceData.flowData.filter(function(loadedFile){
				// Files are redundant if the refresh does not need them, or if their data could not be loaded, in which case a repeated attempt to laod them should be launched.
				var urlNoLongerRequired = !allRequiredUrls.includes(loadedFile.url)
				var urlWasRejected = loadedFile.data == undefined
				return urlNoLongerRequired || urlWasRejected
			})
			
			
			
			// Clear the redundant files out of central booking.
			redundantFiles.forEach(function(redundantFile){
				var redundantFileInd = helpers.indexOfObjectByAttr(dbsliceData.flowData, "url", redundantFile.url)
				dbsliceData.flowData.splice(redundantFileInd,1)
			}) // redundantUrls
			
			
			
			
			
			
				
		}, // removeRedundantFiles
		
		// Accessing on-demand data files.
		getFileAvailabilityInfo: function getFileAvailabilityInfo(ctrl){
			
			  
			
			var getUrl = function(task){return task[ctrl.view.sliceId]}
			var requiredTasks = dbsliceData.data.taskDim.top(Infinity)
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
			

			return {
				 requested: requestedFiles,
				 available: availableFiles,
				duplicates: duplicatedFiles,
				   missing: missingFiles
			}
			
			function returnFile(task){
				// 'returnFile' changes the input single task from the metadata, and returns the corresponding selected 'file'. The 'file' contains the url selected as per the slice selection made by the user, and the corresponding task. The task is required to allow cross plot tracking of all the data connected to this task, and the optional coloring by the corresponding metadata values.
				
				// This here should also package up all the metadata properties that would enable the coloring to fill them in.
				
				// dbsliceData.flowData.filter(function(file){return file.url == task[ctrl.view.sliceId]})[0].data
				var file = helpers.findObjectByAttribute(dbsliceData.flowData, "url", [task[ctrl.view.sliceId]], true)
				
				return {  task: task, 
						   url: task[ctrl.view.sliceId],
						  data: file.data}
				
			} // returnFile
			
		}, // getFileAvailabilityInfo
		
		
		// Info on hte data in the files
		getLineFileDataInfo: function getLineFileDataInfo(ctrl){
			
			var files = cfDataManagement.getFileAvailabilityInfo(ctrl)
			
			// Compatibility of nests!
			// The nests will have to be exactly the SAME, that is a prerequisite for compatibility. The options for these nests can be different, and the variables in these nests can be different. From these is the intersect calculated.
			var compatibilityAccessors = [
				function(f){return f.data["userOptions"].map(function(o){return o.name})},
				function(f){return f.data["commonOptions"].map(function(o){return o.name})}]
			var c = helpers.chainCompatibilityCheck(files.available, compatibilityAccessors)
			
			// Compatibility ensures that all the files have exactly the same user tags available. Retrieve their intersect.
			var intersect = c.compatibleFiles.length > 0 ?  helpers.getIntersectOptions( c.compatibleFiles ) : undefined
			
			// The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.
			ctrl.data.promises     = ctrl.data.promises
			ctrl.data.requested    = files.requested
			ctrl.data.available    = files.available
			ctrl.data.duplicates   = files.duplicated
			ctrl.data.missing      = files.missing
			ctrl.data.compatible   = c.compatibleFiles
			ctrl.data.incompatible = c.incompatibleFiles
			ctrl.data.intersect    = intersect
			

		  
		}, // getLineFileDataInfo
		
		getContour2dFileDataInfo: function getContour2dFileDataInfo(ctrl){
			
			// The files must all be 
			
			var files = cfDataManagement.getFileAvailabilityInfo(ctrl)
			
			// The contours are expected to only contain data of a single slice (2d) / slice scene (3d). Only the properties need to be compatible. For now this is just hard-coded here.
			
			var intersect = {
				varOptions: files.available[0].data.properties
			}

			
			
			// The data properties are only available after a particular subset of the data has been selected. Only then will the dropdown menus be updated.
			ctrl.data.promises  = ctrl.data.promises
			ctrl.data.requested = files.requested
			ctrl.data.available = files.available
			ctrl.data.duplicates= files.duplicated
			ctrl.data.missing   = files.missing
			ctrl.data.compatible = files.available
			ctrl.data.incompatible = []
			ctrl.data.intersect = intersect
			

			
		}, // getContour2dFileDataInfo
		
		// Accessing on-demand data
		getLineDataVals: function getLineDataVals(file, ctrl){
			// Make a distinction between accessing explicit and implicit data files.
			
			
			// Fix for accessing the json files.
			
			// Assemble the names of the properties to plot.
			var plotData
			switch( file.data.type ){
				case "implicit":
					// The options in the ctrl cannot be associated with the actual variable names in the files. The same menu options may correspond to different file variables if the sub-part of the file selected changes.

					// IS IT POSSIBLE TO REPLACE THIS WITH ACCESSORS??
					// No - it is possible that the user is trying to combine data from different file specification types.
					
					plotData = file.data.properties.map(function(d){
						return {x: Number(d[ctrl.view.xVarOption.val]), 
						        y: Number(d[ctrl.view.yVarOption.val])}
					})
					break;
					
				case "explicit":
				
					// json files also resolve to here, in which case they should just
				
					var f = helpers.findObjectByAttribute
			
					// Available properties after applying all the options.
					// Retrieve the properties
					var properties = file.data.properties
				
					// Apply all user selected options.	
					ctrl.view.options.forEach(function(option){
						properties = f( properties, option.name, [option.val], false)
					})
					
					// Pick the appropriate flow variable
					let flowProperty = f( properties, "varName", ctrl.view.yVarOption.val, true)
					
					
					plotData = flowProperty.vals
					
					break;
			
			} // switch
			
			plotData.task = file.task
			
			return plotData
		
		
			
			
		}, // getLineDataVals
		
		
		
		// HELPERS
		helpers : {
			
			getTaskIds: function getTaskIds(){
				var metadata = dbsliceData.data.taskDim.top(Infinity)
				var taskIds = metadata.data.map(function (task){
				  return task.taskId
				});
			  return taskIds
			}, // getTaskIds
			
			crossCheckProperties: function crossCheckProperties(existingData, newData){
				
				var missingDataProperties = existingData.dataProperties.filter(function(d){  return !newData.header.dataProperties.includes(d) })
				
				var missingMetadataProperties = existingData.metaDataProperties.filter(function(d){  return !newData.header.metaDataProperties.includes(d) })
				
				var missingLine2dProperties = existingData.line2dProperties.filter(function(d){  return !newData.header.line2dProperties.includes(d) })
					
				var missingContour2dProperties = existingData.contour2dProperties.filter(function(d){  return !newData.header.contour2dProperties.includes(d) })
				
				var allPropertiesIncluded = 
					(missingDataProperties.length == 0) && 
					(missingMetadataProperties.length == 0) &&
					(missingLine2dProperties.length == 0) &&
					(missingContour2dProperties.length == 0)
											 
				
				
				if(allPropertiesIncluded){
					return true
				} else {
					// Which ones are not included?
					var warningText = "Selected data has been rejected. It requires additional variables:\n" + 
					"Data variables:     " +      missingDataProperties.join(", ") + "\n" +
				    "Metadata variables: " +  missingMetadataProperties.join(", ") + "\n" +
					"Line variables:    " +    missingLine2dProperties.join(", ") + "\n" +
					"Contour variables:  " + missingContour2dProperties.join(", ") + "\n"
					
					
					window.alert(warningText)
					return false
				} // if
				
			}, // checkProperties
			
			refreshMetadataInfo: function refreshMetadataInfo(){
				
				// IMPORTANT!!!!!!!!!!!!
				// The metadata properties need to be refershed whn the data changes!!!
				
				// Just check if the dim returns any data!!
				var d_ = dbsliceData.data
				
				// First check if there is still any data left.
				var data = d_.fileDim.top(Infinity)
				if(data.length < 1){
					// No data available,  remove all dims and associate info.
					
					d_.metaDataProperties = [];
					d_.dataProperties = [];
					d_.line2dProperties = [];
					d_.contour2dProperties = [];
					
					d_.metaDims = [];
					d_.dataDims = [];
				
					d_.metaDataUniqueValues = {};
					d_.histogramSelectedRanges = [];
				} else {
					
					// Some data is available. Find which properties are still available.
					var task = data[0]
					var properties = Object.getOwnPropertyNames( task )
					
					// Check if the dbsliceData properties are in the example task properties.
					
					// CLEAN THIS UP!!!!!!
					d_.metaDataProperties = d_.metaDataProperties.filter(function(metaDataProperty){
						var isMetaDataAvailable = properties.includes(metaDataProperty)
						if( !properties.includes(metaDataProperty) ){
							// Remove the property that corresponds to no data properties.
							delete d_.metaDims[metaDataProperty]
							delete d_.metaDataUniqueValues[metaDataProperty]
						} else {
							d_.metaDataUniqueValues[metaDataProperty] = helpers.unique( data.map(
						function (d){return d[metaDataProperty]} ))
						} // if
						return isMetaDataAvailable
					}) // filter
					
					d_.dataProperties = d_.dataProperties.filter(function(dataProperty){
						var isDataAvailable = properties.includes(dataProperty)
						if( !properties.includes(dataProperty) ){
							// Remove the property that corresponds to no data properties.
							delete d_.dataDims[dataProperty]
							delete d_.histogramSelectedRanges[dataProperty]
						} // if
						return isDataAvailable
					}) // filter
					
					
					d_.line2dProperties = d_.line2dProperties.filter(function(sliceId){
						return properties.includes(sliceId)
					});
					
					d_.contour2dProperties = d_.contour2dProperties.filter(function(sliceId){
						return properties.includes(sliceId)
					});
					
				} // if
				

				
			}, // refreshMetadataInfo
			
			isPropertyInDbsliceData: function isPropertyInDbsliceData(property){
				
					var isInData = [ 
						dbsliceData.data.metaDataProperties.includes(property),
						dbsliceData.data.dataProperties.includes(property),
						dbsliceData.data.line2dProperties.includes(property),
						dbsliceData.data.contour2dProperties.includes(property)
					]
					
				
				return isInData.some(d=>d)
				
			}, // isPropertyInDbsliceData
			
		} // helpers
		
	} // cfDataManagement
    
	
	// General helpers
	var helpers = {
		
			isIterable: function isIterable(object) {
			  // https://stackoverflow.com/questions/18884249/checking-whether-something-is-iterable
			  return object != null && typeof object[Symbol.iterator] === 'function'
			}, // isIterable
		
			makeTranslate: function makeTranslate(x,y){
				return "translate(" + x + "," + y + ")"
			}, // makeTranslate
		
			// Arrays
			unique: function unique(d){		
				// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
				function onlyUnique(value, index, self) { 
					return self.indexOf(value) === index;
				} // unique
				
				return d.filter( onlyUnique )
			
			}, // unique
			
			arrayIncludesAll: function arrayIncludesAll(A,B){
				// 'arrayIncludesAll' checks if array A includes all elements of array B. The elements of the arrays are expected to be strings.
				
				// Return element of B if it is not contained in A. If the response array has length 0 then A includes all elements of B, and 'true' is returned.
				var f = B.filter(function(b){
					return !A.includes(b)
				})
				
				return f.length == 0? true : false
				
				
		    }, // arrayIncludesAll
			
			indexOfObjectByAttr: function indexOfObjectByAttr(array, attr, value) {
				// Return hte index of the first object with the attribute 'attr' of value 'value'. 
				for(var i = 0; i < array.length; i += 1) {
					if(array[i][attr] === value) {
						return i;
					}
				}
				return -1;
			}, // indexOfObjectByAttr
			
			findObjectByAttribute: function findObjectByAttribute(A, attribute, values, flag){
				// Return the objects in an object array 'A', which have an attribute 'attribute', with the value 'value'. If they do not an empty set is returned. In cases when a single item is selected the item is returned as the object, without the wrapping array.
					
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
				// Take input object array 'A', collect all of the object members attribute 'attribute', and flattens the array of arrays into a single array of values once.
			
				var C = A.map(function(a){
					return a[attribute]
				})
				return [].concat.apply([], C)	
			
			}, // collectObjectArrayProperty
			
			// Comparing file contents
			
			checkCompatibility: function checkCompatibility(files, accessor){
				// 'checkCompatibility' checks if the properties retrieved using 'accessor( file )' are exactly the same. To check if the arrays are exactly the same all the contents of A have to be in B, and vice versa. 
			  
				// The first file is taken as the target. Others must be compatible to it.
				var target = []
				if(files.length > 0){
					target = accessor( files[0] )
				} // if
				
				
				var compatibleFiles = files.filter(function(file){
				
					var tested = accessor( file )
				
					// Check if the tested array includes all target elements.
					var allExpectedInTested = helpers.arrayIncludesAll(tested, target)
					
					// Check if the target array includes all test elements.
					var allTestedInExpected = helpers.arrayIncludesAll(target, tested)
					
					return allExpectedInTested && allTestedInExpected
				})
				
				
				
				// Remove any incompatible files from available files.
				var compatibleUrls = compatibleFiles.map(function(file){return file.url})
				var incompatibleFiles = files.filter(function(file){
					return !compatibleUrls.includes( file.url )
				})
				
				// Return the summary
				return {compatibleFiles:   compatibleFiles,
					  incompatibleFiles: incompatibleFiles}
			  
			}, // checkCompatibility
				
			chainCompatibilityCheck: function chainCompatibilityCheck(files, accessors){
				// A wrapper to perform several compatibility checks at once.
			  
				var compatible = files
				var incompatible = []
					
				// The compatibility checks are done in sequence.
				accessors.forEach(function(accessor){
					var c = helpers.checkCompatibility(compatible, accessor)
					compatible = c.compatibleFiles
					incompatible.concat(c.incompatibleFiles)
				})
		  
				return {compatibleFiles:   compatible,
					  incompatibleFiles: incompatible}
			  
			}, // chainCompatibilityCheck
			  
			getIntersectOptions: function getIntersectOptions(files){
			  
				// 'getIntersectOptions' returns the intersect of all options available. The compatibility checks established that the files have exactly the same option names available, now the intersect of option options is determined.

				// Three different options exist.
				// 1.) User options (tags such as 'height', "circumference"...)
				// 2.) Var options (possibilities for the x and y axes)
				// 3.) Common options - to cater for explicit variable declaration. These are not included for the intersect as the user will not be allowed to select from them for now.

				// First select the options for which the intersect is sought for. It assumes that all the files will have the same userOptions. This should be guaranteed by the compatibility check.
				
				
				var i = helpers.calculateOptionIntersect
				// 'calculateOptionIntersect' is geared to deal with an array of options, therefore it returns an array of intersects. For x and y options only 1 option is available, therefore the array wrapper is removed here.
				var xVarIntersect = i( files, function(f){return [f.data.varOptions.x]}  )
				var yVarIntersect = i( files, function(f){return [f.data.varOptions.y]}  )
				
				// Why index the first one out? To remove the array wrapper. User options need the array wrapper to allow later inclusion of additional options.
				return {
				   userOptions: 
						   i( files, function (f){return f.data.userOptions} ),
					varOptions: {
						x: xVarIntersect[0],
						y: yVarIntersect[0]
					} // varOptions
				} // intersectOptions
				

					
			}, // getIntersectOptions
					
			calculateOptionIntersect: function calculateOptionIntersect( files, accessor ){
				// 'calculateOptionIntersect' takes teh array of files 'files' and returns all options stored under the attribute files.data[<optionsName>] that all the files have.
				
				// The first file is selected as teh seed. Only the options that occur in all files are kept, so the initialisation makes no difference on the end result.
				var seedSelections = accessor( files[0] )
				var intersect = seedSelections.map(function(seedSelection){
					
					// The options of the seed user options will be the initial intersect options for this particular option.
					var intersectOptions = seedSelection.options
					
					// For each of the options loop through all the files, and see which options are included. Only keep those that are at every step.
					files.forEach(function(file){
						
						// For this particular file fitler all the options for this particular user option.
						intersectOptions = intersectOptions.filter(function(option){
						
							// It is expected that only one option of the same name will be present. Pass in an option that only one element is required - last 'true' input.
							var fileOptions = helpers.findObjectByAttribute(accessor(file), "name", [seedSelection.name], true)
							
							return fileOptions.options.includes( option )
						}) // filter
					}) // forEach

					return {name: seedSelection.name,
							 val: intersectOptions[0],
						 options: intersectOptions}
					
				}) // map
				
				// Don't unwrap if it is a single object. In some cases the array is needed to allow other options to be joined later on.
				
				return intersect
			
			
			}, // calculateOptionIntersect
			
			// Text sizing
			fitTextToBox: function fitTextToBox(text, box, dim, val){
				// `text' and `box' are d3 selections. `dim' must be either `width' or `height', and `val' must be a number.

				
				if( ["width", "height"].includes(dim) && !isNaN(val) ){
				
					let fontSize = 16
					text.style("font-size", fontSize + "px")
					while( ( box.node().getBoundingClientRect()[dim] > val ) &&
                           ( fontSize > 0 )	){
						// Reduce the font size
						fontSize -= 1
						text.style("font-size", fontSize + "px")
						
					} // while
				
				} // if
				
				
				
			}, // fitTextToBox
			
			calculateExponent: function(val){
				// calculate the exponent for the scientific notation.
				var exp = 0
				while( Math.floor( val / 10**(exp+1) ) > 0 ){ exp+=1 }
				
				// Convert the exponent to multiple of three
				return Math.floor( exp / 3 )*3
			
			}, // calculateExponent
			
	} // helpers
	
	// PLOTTING. 


	var cfD3BarChart = {
		
		

        name: "cfD3BarChart",
        
        make: function make(ctrl) {
        
            // Remove any controls in the plot title.
			// cfD3BarChart.interactivity.updatePlotTitleControls(element)
			
			
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// Create the necessary markup groups.
			var svg = ctrl.figure.select("svg.plotArea")
			var markup = svg.select("g.markup")
			markup.append("g").attr("class", "highlight")
			markup.append("g").attr("class", "extent")
			markup.append("g").attr("class", "label")
			
			// Handle the select.
			var i= cfD3BarChart.interactivity.onSelectChange
			plotHelpers.setupPlot.general.appendVerticalSelection(ctrl.figure.select(".leftAxisControlGroup"), i.vertical(ctrl))
			plotHelpers.setupPlot.general.updateVerticalSelection(ctrl)
			
			
			cfD3BarChart.setupPlot.setupPlotTools(ctrl)
			
			cfD3BarChart.helpers.axes.addXLabel(ctrl)
			
        
            cfD3BarChart.update(ctrl);
        }, // make
      
        update: function update(ctrl) {
			// Plot some bars to the background, which show the entire extent of the data, and additional bars on top to show current selection.
			
			// Create some common handles.
			var h = cfD3BarChart.draw
			
			
			// Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).
			if(h.isRegroupNeeded(ctrl)){
				
				// Perform the regroup
				h.regroup(ctrl)
				
			} else {
				// Just update the view
				h.update(ctrl)
				
			} // if
			
			// VARIABLE CHANGE MUST BE HANDLED SEPARATELY TO ALLOW THE DATA EXTENT TO UPDATE TOO!! MUST SIGNAL THAT THE Y VARIABLE CHANGED
			

			
        }, // update
		
		draw: {
			
			plotDataExtent: function plotDataExtent(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.extent")
				
				cfD3BarChart.draw.bars(ctrl, items, target, "black", 0.2)
				
				
			}, // plotDataExtent
			
			plotSelectionBackground: function plotSelectionBackground(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.background")
				  
				
				cfD3BarChart.draw.bars(ctrl, items, target, "cornflowerblue", 0.5)
				
			}, // plotSelectionBackground
			
			plotCurrentSelection: function plotCurrentSelection(ctrl, items){
				
				// THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				cfD3BarChart.draw.bars(ctrl, items, target, ctrl.tools.getFill, 1)
				
			}, // plotCurrentSelection
			
			bars: function bars(ctrl, items, target, color, opacity){
				
				// THIS HAS TO PLOT INTO THE BACKGROUND TOO!!
				

				var t = ctrl.view.transitions
				
				// The items should be plotted as rectangles. Everytime the grouping of the data is changed the rectangles retreat, regroup, and reappear.
				
				var rect = target
				  .selectAll("rect")
				  .data(items)
				
				rect.enter()
				  .append("rect")
				    .attr("x", 0)
					.attr("y", ctrl.tools.getY)
					.attr("height", ctrl.tools.getHeight)
					.attr("width", 0)
					.style("fill", color)
					.attr("opacity", opacity)
					.attr("stroke-width", 0)
				  .transition()
				  .duration(t.duration)
				    .attr("x", ctrl.tools.getX)
					.attr("width", ctrl.tools.getWidth)
					
				rect
				  .transition()
				  .duration(t.duration)
				  .attr("x", ctrl.tools.getX)
				  .attr("y", ctrl.tools.getY)
				  .attr("height", ctrl.tools.getHeight)
				  .attr("width", ctrl.tools.getWidth)
				  .style("fill", color)
				  .attr("opacity", opacity)
				  
				rect.exit()
				  .transition()
				  .duration(t.duration)
				  .attr("x", ctrl.tools.getX)
				  .attr("width", ctrl.tools.getWidth)
				  .remove()
				
				
				
			}, // bars
			
			plotMarkup: function plotMarkup(ctrl, items){
			
				var keyLabels = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.label")
				  .selectAll(".keyLabel")
				  .data(items);
					
				keyLabels.enter()
				  .append("text")
					.attr("class", "keyLabel")
					.attr("x", 0)
					.attr("y", ctrl.tools.getLabelPosition )
					.attr("dx", 5)
					.attr("dy", ".35em")
					.attr("text-anchor", "start")
					.text(ctrl.tools.getLabel)

				keyLabels
				  .transition()
				  .attr("y", ctrl.tools.getLabelPosition )
				  .text( ctrl.tools.getLabel );
				
				keyLabels.exit().remove();
				

				
			}, // plotMarkup
			
			isRegroupNeeded: function isRegroupNeeded(ctrl){
				
				var flag = ctrl.view.gVar != ctrl.view.yVarOption.val ||
			               ctrl.view.gClr != color.settings.val
				
				// Update the 'gVar' and 'gClr' flags for next draw.				
				ctrl.view.gVar = ctrl.view.yVarOption.val
			    ctrl.view.gClr = color.settings.val
				
				return flag
				
			}, // isRegroupNeeded
			
			regroup: function regroup(ctrl){
				// This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
				
				var svg = ctrl.figure
				  .select("svg.plotArea")
				  
				// Remove the labels too.
				svg.select("g.markup")
				  .selectAll(".keyLabel")
				  .transition()
				  .remove()
				  
				// Check which rectangles need to be removed. If just some grouping was changed (color), then only the colored rectangles in g.data need to be changed. If the y variable changed, then also the data extent needs to be changed.
				var rects
				if(ctrl.view.yVarChanged){
					rects = svg.selectAll("g")
					           .selectAll("rect")
					
					ctrl.view.yVarChanged = false
				} else {
					// 
					rects = svg.selectAll("g.data")
					           .selectAll("rect")
				}
				
				// Remove the rectangles, and when completed order a redraw.
				rects
					.transition()
					.duration(500)
					  .attr("x", ctrl.tools.xscale(0))
					  .attr("width", 0)
					.remove()
					.end()
					.then(function(){
						
						// All elements were removed. Update teh chart.
						cfD3BarChart.draw.update(ctrl)
						
					}) // then
			
			
			}, // regroup
			
			update: function update(ctrl){
				
				var h = cfD3BarChart.helpers
				var draw = cfD3BarChart.draw
				
				var unfilteredItems    = h.getUnfilteredItems(ctrl.view.yVarOption.val);
				var filterItems        = h.getFilteredItems(ctrl.view.yVarOption.val);
				var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl.view.yVarOption.val);
				
				// Unfiltered data extent
				draw.plotDataExtent(ctrl, unfilteredItems)
				
				// Current selection background
				draw.plotSelectionBackground(ctrl, filterItems)
				
				// Handle the entering/updating/exiting of bars.
				draw.plotCurrentSelection(ctrl, filterItemsGrouped)
				
				
				// Handle the entering/updating/exiting of bar labels.
				draw.plotMarkup(ctrl, unfilteredItems)
				
				
				// Handle the axes.
				h.axes.update(ctrl);
				
				// Add interactivity:
				cfD3BarChart.interactivity.addOnMouseOver(ctrl);
				cfD3BarChart.interactivity.addOnMouseClick(ctrl);
				
			}, // update
			
			
			
		}, // draw
		
		
      
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated 
			cfD3BarChart.setupPlot.setupPlotTools(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3BarChart.update(ctrl)
			
			
		}, // rescale
	  
	    setupPlot : {
			
			setupPlotTools: function setupPlotTools(ctrl){
				// The x and y axis tools need to be set up here. 
				
				// Get the items to plot. This is done on all the data here, and the scales are created here as well. This will make the axes fixed, and the bars move accordingly. This can be changed if needed by adjusting the xscale domain appropriately
				
				var property = ctrl.view.yVarOption.val
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				var width = g.attr("width")
				var height = g.attr("height")
				
				// TEMPORARY
				var items = cfD3BarChart.helpers.getUnfilteredItems(property);
				
				// The scale that will control the property used to visually convey numeric information.
				ctrl.tools.xscale = d3.scaleLinear()
					.range([0, width])
					.domain([0, d3.max(items, function (v){return v.members.length;}) ]);
				
				// 'd2.scaleBand' does the division of the plotting area into separate bands based on input categorical values, and returns the number corresponding to the position of the band, and to the width of the band by calling '<scale>()', and '<scale>.bandwidth()' respectively.
				// 'padding' sets the amount of space between the bands (innerPadding), and before and after the bands (outerPadding), to the same value.
				// 'align' controls how the outer padding is distributed between both ends of the band range.
				ctrl.tools.yscale = d3.scaleBand()
				    .range([0, height])
				    .domain(  items.map(function (d) {return d.val;}).sort()  )
				    .padding([0.2])
				    .align([0.5]);
					
					
				ctrl.tools.getHeight = function(d){ return ctrl.tools.yscale.bandwidth() }
				ctrl.tools.getWidth = function(d){ return ctrl.tools.xscale(d.members.length)}
				ctrl.tools.getX = function(d){ return ctrl.tools.xscale(d.x) }
				ctrl.tools.getY = function(d){ return ctrl.tools.yscale(d.val) }
				ctrl.tools.getFill = function(d){ return color.get(d.cVal) }	
				ctrl.tools.getLabelPosition = function(d){
					return ctrl.tools.getY(d) + 0.5*ctrl.tools.getHeight(d)
					}
				ctrl.tools.getLabel = function(d){return d.val}
			
			} // setupPlotTools
		
		}, // setupPlot
	  
		interactivity: {
			
			onSelectChange: {
				
				vertical: function vertical(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Perform the regular task for y-select: update teh DOM elements, and the plot state object.
						plotHelpers.setupInteractivity.general.onSelectChange.vertical(ctrl, selectedVar)
						
						// Update the filter. If a variable is removed from view then it's filter must be removed as well. It is completely REMOVED, and not stored in the background. Filter checks the variables in the control objects.
						filter.apply()
						
						// Setup the tools anew.
						cfD3BarChart.setupPlot.setupPlotTools(ctrl)
						
						// Signal that a regroup is required.
						ctrl.view.yVarChanged = true
			
						// Render is called because the filter may have changed.
						render()			
					
					} // return
				}, // vertical
			}, // onSelectChange
			
			addOnMouseClick: function addOnMouseClick(ctrl){
				
				// Add the mouse click event
				var property = ctrl.view.yVarOption.val
				var svg = ctrl.figure.select("svg.plotArea").select("g.markup")
				
				
				svg.selectAll("rect").on("click", onClick);
				
				function onClick(d){

					
					// Update the filter selection.
					filter.addUpdateMetadataFilter(property, d.val)

					// Apply the selected filters to the crossfilter object.
				    filter.apply();
				  
				    // Everything needs to b rerendered as the plots change depending on one another according to the data selection.
				    render();
					
				} // onClick
				
			}, // addOnMouseClick
			
			addOnMouseOver: function addOnMouseOver(ctrl){
				
				
				// Onle the rectangles showing the data outline are interactive.
				var rects = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .selectAll("rect");
				
				rects.on("mouseover", crossHighlightOn)
                     .on("mouseout",  crossHighlightOff);
					  
				function crossHighlightOn(d){
					
					// When mousing over a deselected item it should show the user the preview. This means it should show extra data. But it also means that it needs to keep track of active/inactive rectangles.
					
					crossPlotHighlighting.on(d, "cfD3BarChart");

				}; // crossHighlightOn
				
				function crossHighlightOff(d){
					
					crossPlotHighlighting.off(d, "cfD3BarChart");
					
				}; // crossHighlightOff
				
			}, // addOnMouseOver
			
			refreshContainerSize: function refreshContainerSize(ctrl){
				
				var container = d3.select(ctrl.format.parent)
				
				builder.refreshPlotRowHeight( container )
				
			} // refreshContainerSize
			
		}, // interactivity
	
		helpers: {
		
			// Initialisation/saving
			createDefaultControl: function createDefaultControl(){
			
				var ctrl = {
				        plotFunc: cfD3BarChart,
						figure: undefined,
						svg: undefined,
						view: {yVarOption: undefined,
							   nBins: undefined,
							   transitions: cfD3BarChart.helpers.transitions.instantaneous(),
							   gVar: undefined,
							   gClr: undefined
							   },
						tools: {xscale: undefined,
								yscale: undefined,
								histogram: undefined},
						format: {
							title: "Edit title",
							margin: {top: 10, right: 0, bottom: 30, left: 30},
							axesMargin: {top: 10, right: 30, bottom: 30, left: 10},
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
				
				var options = dbsliceData.data.metaDataProperties
				ctrl.view.yVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
									 
				ctrl.view.gVar = options[0]
				
				return ctrl
			
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3BarChart.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.yProperty != undefined){
					if( dbsliceData.data.metaDataProperties.includes(plotData.yProperty) ){
						ctrl.view.yVarOption.val = plotData.yProperty
						ctrl.view.gVar =           plotData.yProperty
					} // if						
				} // if				
							

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
				  
				var xProperty = accessProperty( ctrl.view.yVarOption, "val" )
				
				  
				s = s + writeOptionalVal("xProperty", xProperty)
				
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
			
			
			// Functions supporting interactivity
			axes: {
				
				update: function update(ctrl){
					
					

					cfD3BarChart.helpers.axes.formatAxesX(ctrl)
					
					// Empty y-axis as the labels are drawn.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.axis--y")
					  .call(d3.axisLeft(ctrl.tools.yscale).tickValues([]));
					
				}, // update
				
				formatAxesX: function formatAxesX(ctrl){
				
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

					ctrl.figure.select(".axis--x")
						.selectAll("g.exponent")
						.select("text")
						  .attr("fill", format.fill)
						.select("tspan.exp")
						  .html(format.exp)
			
					ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
						  
				
				}, // formatAxesY
				
				addXLabel: function addXLabel(ctrl){
					
					ctrl.figure
					  .select("div.bottomAxisControlGroup")
					  .append("text")
						.attr("class", "txt-horizontal-axis")
						.style("float", "right")
						.style("margin-right", "15px")
						.text("Number of Tasks");
					
				}, // addXLabel
				
				
			}, // axes
			
			
			transitions: {
				instantaneous: function instantaneous(){
					// For 'cfD3BarChart' animated transitions handles filter changes.
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
					// For 'cfD3BarChart' animated transitions handles variable changes.
				
					return {
						duration: 500,
						updateDelay: 500,
						enterDelay: 0
					}
				
				} // animated
			}, // transitions
		
		
		
			getItems: function getItems(tasks, groupKey, subgroupKey){
				
				// Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
				
				var groupVals = dbsliceData.data.metaDataUniqueValues[groupKey]
				var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.metaDataUniqueValues[subgroupKey]
				
				// Loop over them to create the rectangles.
				var items = []
				groupVals.forEach(function(groupVal){
					
					var x = 0
					
					subgroupVals.forEach(function(subgroupVal){
						// This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
						
						var members = tasks.filter(function(task){
							// In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
							return task[groupKey] == groupVal &&
							       task[subgroupKey] == subgroupVal
						})
						
						var rectData = {
							key: groupKey,
							val: groupVal,
							cKey: subgroupKey,
							cVal: subgroupVal,
							x: x,
							members: members
						}
						
						items.push(rectData)
						
						// Update the position for the next subgroup.
						x = x + members.length
					}) // subgroup
				}) // group
					
				return items
			}, // getItems
			
			getFilteredItems: function getFilteredItems(property){
				
				var tasks = dbsliceData.data.metaDims[property].top(Infinity)
				
				return cfD3BarChart.helpers.getItems(tasks, property, undefined)
				
			}, // getFilteredItems
			
			getFilteredItemsGrouped: function getFilteredItemsGrouped(property){
				
				var tasks = dbsliceData.data.metaDims[property].top(Infinity)
				
				return cfD3BarChart.helpers.getItems(tasks, property, color.settings.variable)
				
			}, // getFilteredItemsGrouped
			
			getUnfilteredItems: function getUnfilteredItems(property){
				
				// 1.) get the unfiltered items for plotting. This means the plot will never zoom in, regardless of selection.
				// 2.) get the items for plotting as before. This will change with selection, but will still allow subsets to be highlighted later on.
				
				// First attempt with 1.). the other will be implemented later when it will be visible.
				// When using 'filter.remove' and later 'filter.apply' the object 'items' changes after the filters are reapplied.
				
				// Get all tasks.
				var tasks = dbsliceData.data.cf.all()
				
				// Make the items.
				return cfD3BarChart.helpers.getItems(tasks, property, undefined)
				
				// https://stackoverflow.com/questions/33102032/crossfilter-group-a-filtered-dimension
				// Crossfilter groups respect all filters except those of the dimension on which they are defined. Define your group on a different dimension and it will be filtered as you expect.
				
				
			}, // getUnfilteredItems
			
			
			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				/*
				ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				  .selectAll("rect")
				    .attr("opacity", 0.5)
				*/
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				
				
				// Create bars for hte highlight
				var highlightedData = cfD3BarChart.helpers.getItems(allDataPoints, ctrl.view.yVarOption.val, color.settings.variable)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous()
				
				// Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
				cfD3BarChart.draw.plotCurrentSelection(ctrl, highlightedData)
				
				// Reset the transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated()
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.instantaneous()
				
				cfD3BarChart.draw.update(ctrl)
				
				// Reset the transition times.
				ctrl.view.transitions = cfD3BarChart.helpers.transitions.animated()
				
			}, // defaultStyle
			
			
		} // helpers
	
	}; // cfD3BarChart

	var cfD3Histogram = {
          
        name: "cfD3Histogram",
        
        make: function make(ctrl) {
			
          
            // Setup the object that will internally handle all parts of the chart.
			plotHelpers.setupPlot.general.setupPlotBackbone(ctrl)
			plotHelpers.setupPlot.general.setupPlotContainerBackbone(ctrl)
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .append("g")
				    .attr("class", "extent")
			
			
			var i= cfD3Histogram.interactivity.onSelectChange
			plotHelpers.setupPlot.general.appendHorizontalSelection(ctrl.figure.select(".bottomAxisControlGroup"), i.horizontal(ctrl))
			plotHelpers.setupPlot.general.updateHorizontalSelection(ctrl)
			
			
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			
			cfD3Histogram.interactivity.addBrush.make(ctrl)
			cfD3Histogram.interactivity.addBinNumberControls.make(ctrl)
			
			// Add the y label to the y axis.
			cfD3Histogram.helpers.axes.addYLabel(ctrl)
			
			cfD3Histogram.update(ctrl)
          
        },
        
        update: function update(ctrl) {
		
			// Create some common handles.
			var h = cfD3Histogram.draw
			
			
			// Check if the data should be regrouped, or if an update to the existing state is required. This check should be performed here, as a need to regroup might come from outside (by changing the color variable).
			if(h.isRegroupNeeded(ctrl)){
				
				// Perform the regroup
				h.regroup(ctrl)
				
			} else {
				// Just update the view
				h.update(ctrl)
				
			} // if
		
			
        }, // update
		
		draw: {
			
			plotDataExtent: function plotDataExtent(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.markup")
				  .select("g.extent")
				
				cfD3Histogram.draw.bars(ctrl, items, target, "black", 0.1)
				
			}, // plotDataExtent
			
			plotSelectionBackground: function plotSelectionBackground(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.background")
				
				cfD3Histogram.draw.bars(ctrl, items, target, "cornflowerblue", 0.5)
				
			}, // plotSelectionBackground
			
			plotCurrentSelection: function plotCurrentSelection(ctrl, items){
				
				var target = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				cfD3Histogram.draw.bars(ctrl, items, target, ctrl.tools.fill, 1)
				
			}, // plotCurrentSelection
			
			bars: function bars(ctrl, items, target, color, opacity){
				
				// Plotting
				var t = ctrl.view.transitions
				

				// Handle entering/updating/removing the bars.
				var bars = target
				  .selectAll("rect").data(items);
			
					
				// Finally append any new bars with 0 height, and then transition them to the appropriate height
				var newBars = bars.enter()
				newBars
				  .append("rect")
					.attr("transform", ctrl.tools.startState)
					.attr("x", 1)
					.attr("width",  ctrl.tools.width )
					.attr("height", 0)
					.style("fill", color)
					.attr("opacity", opacity)
				  .transition()
					.delay( t.enterDelay )
					.duration( t.duration )
					.attr("height", ctrl.tools.height)
					.attr("transform", ctrl.tools.finishState)
				  
				// Now move the existing bars.
				bars
				  .transition()
					.delay( t.updateDelay )
					.duration( t.duration )
					.attr("transform", ctrl.tools.finishState)
					.attr("x", 1)
					.attr("width", ctrl.tools.width )
					.attr("height", ctrl.tools.height);
				  
				// Remove any unnecessary bars by reducing their height to 0 and then removing them.
				bars.exit()
				  .transition()
					.duration( t.duration )
					.attr("transform", ctrl.tools.startState)
					.attr("height", 0)
					.remove();
				
			}, // bars
			
			isRegroupNeeded: function isRegroupNeeded(ctrl){
				
				var flag = ctrl.view.gVar != ctrl.view.xVarOption.val ||
			               ctrl.view.gClr != color.settings.val
				
				// Update the 'gVar' and 'gClr' flags for next draw.				
				ctrl.view.gVar = ctrl.view.xVarOption.val
			    ctrl.view.gClr = color.settings.val
				
				return flag
				
			}, // isRegroupNeeded
			
			regroup: function regroup(ctrl){
				// This function controls the retreat of the data to prepare for the redrawing using the new grouping of the data.
				
				
				var g = ctrl.figure
				  .select("svg.plotArea")
				  .select("g.data")
				
				
				// Remove the rectangles, and when completed order a redraw.
				g.selectAll("rect")
					.transition()
					.duration(500)
					  .attr("transform", ctrl.tools.startState)
					  .attr("height", 0)
					.remove()
					.end()
					.then(function(){
						
						
						// Redo the plot tools
						cfD3Histogram.setupPlot.setupPlotTools(ctrl)
						
						// Update the brush limits.
						ctrl.figure
						  .select("svg.plotArea")
					      .select(".selection")
						  .attr("xMin", d3.min( ctrl.tools.xscale.domain() ))
						  .attr("xMax", d3.max( ctrl.tools.xscale.domain() ))
						cfD3Histogram.interactivity.addBrush.updateBrush(ctrl)
						
						// Update any bin controls.
						cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl)
						
						// All elements were removed. Update teh chart.
						cfD3Histogram.draw.update(ctrl)
						
					}) // then
			
			
			}, // regroup
			
			update: function update(ctrl){
				
				var h = cfD3Histogram.helpers
				
				var unfilteredItems    = h.getUnfilteredItems(ctrl);
				var filterItems        = h.getFilteredItems(ctrl);
				var filterItemsGrouped = h.getFilteredItemsGrouped(ctrl);
				
				
				// Unfiltered data extent
				cfD3Histogram.draw.plotDataExtent(ctrl, unfilteredItems)
				
				// Current selection background
				cfD3Histogram.draw.plotSelectionBackground(ctrl, filterItems)
				
				// Handle the entering/updating/exiting of bars.
				cfD3Histogram.draw.plotCurrentSelection(ctrl, filterItemsGrouped)
				
				
				// Handle the axes.
				cfD3Histogram.helpers.axes.update(ctrl);
				
				
				
			} // update
			
			
		}, // draw
        
		rescale: function rescale(ctrl){
			// What should happen if the window is resized?
			// 1.) The svg should be resized appropriately
			plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
			// 2.) The plot tools need to be updated
			cfD3Histogram.setupPlot.setupPlotTools(ctrl)
			
			// 3.) The plot needs to be redrawn
			cfD3Histogram.update(ctrl)
			
			
			// Update the bin number controls.
			cfD3Histogram.interactivity.addBinNumberControls.updateMarkers(ctrl)
			
			// UPDATE THE SELECT RECTANGLE TOO!!
			cfD3Histogram.interactivity.addBrush.updateBrush(ctrl)
			
		}, // rescale
		
        setupPlot: {
            
			setupPlotTools: function setupPlotTools(ctrl){
				// Desired properties for the bin widths:
				//   1.) Constant bin width
				//   2.) "nice" bin thresholds
				  
				//   Constant bin widths are achieved by specifying the ticks to be created via 'd3.ticks'. This also results in nice bin thresholds. Using '.nice()' is expected to round the domain limits to values that naturally coincide with the values created by 'd3.ticks'*.
				  
				//   The function requires the number of ticks to be created to be specified by the user. 'd3.thresholdSturges' computes a 'sensible' number of bins.
				  
				//   * This is potentially error prone as d3.ticks will not always return the number of ticks requested, but will instead try to find 'sesnible bins instead. This will need to be reworked if the number of bins is to be changeable...
				//  */
			
				// Get the values on which the calculation is performed
				var items = dbsliceData.data.cf.all()
				var g = ctrl.figure.select("svg.plotArea").select("g.data")
				var width = g.attr("width")
				var height = g.attr("height")
				function xAccessor(d){return d[ctrl.view.xVarOption.val]}
				
				// Create the domains and ranges that can be. The y domain is dependent on the binning of the data. Therefore it can only be specified after the histogram data has been created.
				var xDomain = [ d3.min( items, xAccessor),
						        d3.max( items, xAccessor) ]
				var xRange = [0, width]
				var yRange = [height, 0]
				
				
				
				// Create the xscale to be used to calculate both the y domain, as well as to facilitate the plotting.
				var x = d3.scaleLinear()
				  .domain( xDomain )
				  .range( xRange )
				  .nice()
				

				// Create the histogram data. Note that the bin number will likely be altered by 'd3.ticks'...
				var nBins = ctrl.view.nBins
				if( nBins == undefined ){
					var values = []
					items.forEach(function(d){ values.push( xAccessor(d) ) })
					nBins = d3.thresholdSturges(values)
				} // if
				
				
				// Calculate the thresholds by hand. Use the nice x domain as a starting point. D3.histogram insists on adding an additional bin that spans from 'maxVal' to the end of the domain, therefore remove the last value in the manually created thresholds.
				var maxVal = d3.max(x.domain())
				var minVal = d3.min(x.domain())
				var t = d3.range(minVal, maxVal, (maxVal - minVal)/nBins )
				// t.splice(t.length-1, 1)
				
				// If the minVal and maxVal are the same the d3.<calculateBinNumber> methods will still come up with a number of bins, as it only depends on the number of observations. In that case t will be empty, and the histogram will have no items displayed. Should the desired behavior be different?
				
				// Due to the imprecision of storing values with repeated decimal patterns it can be that the last value is not included in the thresholds. This is a workaround.
				// if(t.indexOf(maxVal) == -1){ t.push(maxVal) }
				
				var histogram = d3.histogram()
				  .value(function(d){return d[ctrl.view.xVarOption.val]})
				  .domain( x.domain() )
				  .thresholds( t );
			  
				var bins = histogram( items );
				
				
				
				// Create the corresponding y scale. 
				// NOTE: It might be required that this becomes a reactive scale, in which case it will need to be updated when brushing.
				var yDomain = [0, d3.max( bins, function (d){return d.length;} )]
				var y = d3.scaleLinear()
					.domain( yDomain )
					.range( yRange );
					
					
				// Assign the objects required for plotting and saving hte plot.
				ctrl.tools.xscale = x
				ctrl.tools.yscale = y
				ctrl.tools.histogram = histogram
				
				// nBins is saved instead of the actual bins, as those are expected to change with the movements of the brush.
				ctrl.view.nBins = nBins
				ctrl.view.thresholds = t
				
				
				
				
				
				ctrl.tools.height = function height(d){
					// Height 
					return ctrl.figure.select("svg.plotArea").select("g.data").attr("height") - ctrl.tools.yscale(d.members.length)
				} // height
				
				ctrl.tools.width =  function width(d){
					var width = ctrl.tools.xscale(d.x1) - ctrl.tools.xscale(d.x0) - 1;
					width = width < 1 ? 1 : width
					return width	
				} // width
				
				ctrl.tools.startState =  function startState(d){
					var x = ctrl.tools.xscale(d.x0)
					var y = ctrl.figure.select("svg.plotArea").select("g.data").attr("height")
					return "translate("+[x, y].join()+")"
				} // startState
					
				ctrl.tools.finishState =  function finishState(d){
					var x = ctrl.tools.xscale(d.x0)
					var y = ctrl.tools.yscale(d.members.length + d.x)
					return "translate("+[x, y].join()+")"
				} // finishState
					
				ctrl.tools.fill =  function fill(d){
					return color.get(d.cVal)
				} // fill
			
			
			} // setupPlotTools
			
		}, // setupPlot
		     
        interactivity: {
		
			onSelectChange: {
				
				horizontal: function horizontal(ctrl){
					// Returns a function, as otherwise the function would have to find access to the appropriate ctrl object.
					return function(){
					
						var selectedVar = this.value
					
						// Update the y-variable for the plot, and re-intialise the number of bins.
						ctrl.view.xVarOption.val = selectedVar
						ctrl.view.nBins = undefined
						
						// Update the filters. As the variable has changed perhaps the limits of the brush have as well.
						filter.apply()
						
						

						ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated()

						// Update the graphics. As the variable changed and the fitler is getting removed the other plots should be notified.
						render()
						
						
						
					} // return
				}, // vertical
			}, // onSelectChange
			
			addBrush: { 
			
				make: function make(ctrl){
				
					var h = cfD3Histogram.interactivity.addBrush
					var property = ctrl.view.xVarOption.val
				
					// The hardcoded values need to be declared upfront, and abstracted.
					var svg = ctrl.figure.select("svg.plotArea")
					
					// Get the scale. All properties requried are in the svg.
					var x = ctrl.tools.xscale
					
					
					// There should be an update brush here. It needs to read it's values, reinterpret them, and set tiself up again
					// Why is there no brush here on redraw??
					var brush = svg.select(".brush")
					if(brush.empty()){
						
						brush = svg.select("g.markup")
						  .append("g")
							.attr("class","brush")
							.attr("xDomMin", x.domain()[0] )
							.attr("xDomMax", x.domain()[1] )
							
							
						var xMin = x.domain()[0]
						var xMax = x.domain()[1]
						
						// Initialise the filter if it isn't already.
						
						
						var limits = dbsliceData.data.histogramSelectedRanges[property]
						if(limits !== undefined){
							xMin = limits[0]
							xMax = limits[1]
						} else {
							filter.addUpdateDataFilter(property, [xMin, xMax])
							
						} // if
						
					} else {
						// Setup the filter bounds in the cfInit??
						var limits = dbsliceData.data.histogramSelectedRanges[property]
						var xMin = limits[0]
						var xMax = limits[1]
						
						
						brush.selectAll("*").remove();
						
					}// if
					

					var height = svg.select("g.data").attr("height")
					var rect = brush
					  .append("rect")
						.attr("class", "selection")
						.attr("cursor", "move")
						.attr("width", x(xMax) - x(xMin))
						.attr("height", height)
						.attr("x", x(xMin))
						.attr("y", 0)
						.attr("opacity", 0.2)
						.attr("xMin", xMin)
						.attr("xMax", xMax)
						
					
					// Make the rect draggable
					rect.call( d3.drag().on("drag", function(){ h.dragmove(this, ctrl) }  ) )
					
					
					// Make the rect scalable, and add rects to the left and right, and use them to resize the rect.
					brush
					  .append("rect")
						.attr("class", "handle handle--e")
						.attr("cursor", "ew-resize")
						.attr("x", Number(rect.attr("x")) + Number(rect.attr("width"))   )
						.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
						.attr("width", 10)
						.attr("height", Number(rect.attr("height"))/2)
						.attr("opacity", 0)
						.call( d3.drag().on("drag", function(){ h.dragsize(this, ctrl) }) )
					
					brush
					  .append("rect")
						.attr("class", "handle handle--w")
						.attr("cursor", "ew-resize")
						.attr("x", Number(rect.attr("x")) - 10)
						.attr("y", Number(rect.attr("y")) + Number(rect.attr("height"))/4 )
						.attr("width", 10)
						.attr("height", Number(rect.attr("height"))/2)
						.attr("opacity", 0)
						.call( d3.drag().on("drag", function(){ h.dragsize(this, ctrl) }) )
					

					// Decorative handles.	


					brush.append("path")
						.attr("d", h.drawHandle(rect, "e") )
						.attr("stroke", "#000")
						.attr("fill", "none")
						.attr("class", "handle handle--decoration-e")
						
					brush.append("path")
						.attr("d", h.drawHandle(rect, "w") )
						.attr("stroke", "#000")
						.attr("fill", "none")
						.attr("class", "handle handle--decoration-w")
					
				}, // make
					
				drawHandle: function drawHandle(rect, side){
					// Figure out the dimensions.
					var height = Number(rect.attr("height"))
					var width = Number(rect.attr("width"))
				
					
					var xWest = Number(rect.attr("x"))
					var yWest = Number(rect.attr("y")) + height/4
					
					var x = side == "w" ? xWest : xWest + width
					var y = side == "w" ? yWest : yWest

					
					// Figure out if the west or east handle is needed.
					var flipConcave = side == "e"? 1:0
					var flipDir = side == "e"? 1:-1
					
					var lambda = 30/300
					var r = lambda*height/2
					r = r > 10 ? 10 : r
					
					var start = "M" + x + " " + y
					var topArc = "a" + [r, r, 0, 0, flipConcave, flipDir*r, r].join(" ")
					var leftLine = "h0 v" + (height/2 - 2*r)
					var bottomArc = "a" + [r, r, 0, 0, flipConcave, -flipDir*r, r].join(" ")
					var closure = "Z"
					var innerLine = "M" + [x + flipDir*r/2, y + r].join(" ") + leftLine
					
					return [start, topArc, leftLine, bottomArc, closure, innerLine].join(" ")
					
				},// drawHandle
					
				dragmove: function dragmove(rectDOM, ctrl){
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()

					
					var h = cfD3Histogram.interactivity.addBrush
					var x = ctrl.tools.xscale
					
					var rect = d3.select(rectDOM)
					var brush = d3.select(rectDOM.parentNode)
					
					
					
					// Update teh position of the left edge by the difference of the pointers movement.
					var oldWest = Number(rect.attr("x"))
					var oldEast = Number(rect.attr("x")) + Number(rect.attr("width"))
					var newWest = oldWest + d3.event.dx; 
					var newEast = oldEast + d3.event.dx;
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  d3.min(x.domain()) ){
						newWest = d3.min(x.range())
					} else if (x.invert(newEast) >  d3.max(x.domain()) ){
						newEast = d3.max(x.range())
					} // if
					
					
					// Update the xMin and xMax values.
					rect.attr("xMin", x.invert(newWest))
					rect.attr("xMax", x.invert(newEast))
					
					
					// Update the selection rect.
					h.updateBrush(ctrl);
					
					// Update the data selection
					h.updateSelection(ctrl)
					
					

					
				}, // dragmove
				
				dragsize: function dragsize(handleDOM, ctrl){
					
					// Setup the appropriate transition
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
					
					
					// Update teh position of the left edge by the difference of the pointers movement.
					var h = cfD3Histogram.interactivity.addBrush
					var x = ctrl.tools.xscale
					
					var handle = d3.select(handleDOM)
					var brush = d3.select(handleDOM.parentNode)
					var rect = brush.select("rect.selection")
					
					var oldWidth = Number(rect.attr("width"))
					var oldWest = Number(rect.attr("x"))
					var oldEast = oldWest + oldWidth
					
					
					
					switch(handle.attr("class")){
						case "handle handle--e":
							// Change the width.
							var newWidth = oldWidth + d3.event.dx
							var newWest = oldWest
						  break
						  
						case "handle handle--w":
							// Change the width, and x both
							var newWidth = oldWidth - d3.event.dx
							var newWest = oldWest + d3.event.dx
						  break
						  
					} // switch
					var newEast = newWest + newWidth
					
					
					
					// Check to make sure the boundaries are within the axis limits.
					if (x.invert(newWest) <  d3.min(x.domain()) ){
						newWest = d3.min(x.range())
					} else if (x.invert(newEast) >  d3.max(x.domain()) ){
						newEast = d3.max(x.range())
					} // if
					
					// Handle the event in which a handle has been dragged over the other.
					if (newWest > newEast){
						newWidth = newWest - newEast
						newWest = newEast
						newEast = newWest + newWidth
					
						// In this case just reclass both the handles - this takes care of everything.
						var he = d3.select(".brush").select(".handle--e")
						var hw = d3.select(".brush").select(".handle--w")
						
						hw.attr("class", "handle handle--e")
						he.attr("class", "handle handle--w")
					} // if
					
					
					// Update all brushes corresponding to the same dimId. This will take an overhaul of the process here. The update will have to read the min and max values straight from the filter, but this causes accelerated movement of the brush...
					
					
					// Update the xMin and xMax values.
					brush.select(".selection").attr("xMin", x.invert(newWest))
					brush.select(".selection").attr("xMax", x.invert(newEast))
					
					// Update the brush rectangle
					h.updateBrush(ctrl);
					
					
					// Update the data selection
					h.updateSelection(ctrl)
					
					
					
					
				}, // dragsize
				
				updateSelection: function updateSelection(ctrl){
					
					var nTasks_ = dbsliceData.data.taskDim.top(Infinity).length
					var x = ctrl.tools.xscale
					var rect = ctrl.figure.select("svg.plotArea").select(".selection")
					var lowerBound = Number(rect.attr("x"))
					var upperBound = Number(rect.attr("x")) + Number(rect.attr("width"))
					
					var selectedRange = [x.invert(lowerBound), x.invert(upperBound)]
					
					// Update the filter range
					filter.addUpdateDataFilter(ctrl.view.xVarOption.val, selectedRange)
					
					// Apply the appropriate filters to the crossfilter
					filter.apply();
					
					// Only update other plots if the number of elements in the filter has changed.
					var nTasks = dbsliceData.data.taskDim.top(Infinity).length
					if(nTasks_ != nTasks){
						render()
					} // if
					
				}, // updateSelection
				
				updateBrush: function updateBrush(ctrl){
				
					var h = cfD3Histogram.interactivity.addBrush
					
					// First get the scale
					var svg = ctrl.figure.select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
					var rect = svg.select(".selection")
					var x = ctrl.tools.xscale
					
					// Now get the values that are supposed to be selected.
					var xMin = Number(rect.attr("xMin"))
					var xMax = Number(rect.attr("xMax"))
					
					
					// Update teh rect.
					rect
					  .attr("x", x(xMin))
					  .attr("width", x(xMax) - x(xMin))
					  .attr("height", height)
					
					// Update the handles				
					svg.select(".brush").select(".handle--e")
					  .attr("x", x(xMax))
					  .attr("y", height/4 )
					  .attr("height", height/2)
					svg.select(".brush").select(".handle--w")
					  .attr("x", x(xMin) - 10)
					  .attr("y", height/4 )
					  .attr("height", height/2)
					
					
					// Update the handle decorations
					svg.select(".brush").select(".handle--decoration-e")
					  .attr("d", h.drawHandle(rect, "e"))
					svg.select(".brush").select(".handle--decoration-w")
					  .attr("d", h.drawHandle(rect, "w"))
					  
				} // updateBrush
				
				
			}, // addBrush
			
			addBinNumberControls: {
			
				make: function make(ctrl){
				
					// GENERALISE THE GROUP TRANSFORM!!
					var h = cfD3Histogram.interactivity.addBinNumberControls
					var svg = ctrl.figure.select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
				
					// Add in the markers
					var g = svg.select("g.markup").select("g.binControls")
					if(g.empty()){
						// this g already has a transform added to it (the y-axes translate). Therefore only the height needs to be corrected in order for the markers to be located at the x axis.
						g = svg.select("g.markup")
						  .append("g")
							.attr("class","binControls")
							.attr("transform", "translate(0," + height + ")")
					} // if
					 
						  
					// Add in the controls.
					h.updateMarkers(ctrl)
				

					
					// Add interactivity to the axis
					
	
					// Initialise the behaviour monitors
					var downx = Math.NaN
					var dx = Math.NaN
					svg.select("g.binControls")
					    .on("mousedown", function(d) {
							downx = d3.event.x
							dx = 0
					 }) // on
					  
					
					  
					// attach the mousemove and mouseup to the body
					// in case one wonders off the axis line
					svg
					    .on("mousemove", function(d) {
					    
							// Check if the update of bin numbers has been appropriately initiated.
							if (!isNaN(downx)) {
							
								// Update the distance moved.
							    dx = d3.event.x - downx
								
								
							    if (Math.abs(dx) > 20) {
								    // rebase the dx by changing downx, otherwise a new bin is added for every pixel movement above 20, wheteher positive or negative.
									downx = d3.event.x
									
									// Only the bin number depends on the dx, and it does so because the number of bins can be increased or decreased
									h.updateBinNumber(ctrl, dx)

									// Update the plot
									h.update(ctrl)
									
							    } // if
							} // if
					    })
					    .on("mouseup", function(d) {
						    downx = Math.NaN
						    dx = Math.NaN
					    });
						
						
						
						
						
					  
					  				
				}, // make
			
				update: function update(ctrl){
				
					var h = cfD3Histogram.interactivity.addBinNumberControls
					
					
									
					// First update the plotting tools.
					cfD3Histogram.setupPlot.setupPlotTools(ctrl)
									
					// Update the markers
					h.updateMarkers(ctrl)
					
					// Update transition times
					ctrl.view.transitions = cfD3Histogram.helpers.transitions.animated()
					
					// Update the chart graphics.
					cfD3Histogram.update(ctrl)
				
				
				}, // update
				
				
				updateBinNumber: function updateBinNumber(ctrl, dx){
							
					// Change the number of bins, and redo the plotting tools. Note that if the number of bins is 1 the bin should not be removed.
					
					// Control the direction of the behavior.
					var sign = dx > 0? -1 : 1
					
					// Update the bin number
					ctrl.view.nBins = ctrl.view.nBins + 1*sign
					
					// Impose minimum number of bins as 1
					if(ctrl.view.nBins < 1){ ctrl.view.nBins = 1 }
				
				}, // updateBinNumber

				updateMarkers: function updateMarkers(ctrl){
					
					var svg = ctrl.figure
					  .select("svg.plotArea")
					var height = svg.select("g.data").attr("height")
				

					// Update the bin control markers. The white markers do not interfere with the axis ticks as those are added later in the main update method.
					var markers = svg.select("g.markup")
					  .select("g.binControls")
					    .attr("transform", "translate(0," + height + ")")
					  .selectAll("polygon")
							
					markers
					  .data(ctrl.view.thresholds)
					  .enter()
						.append("polygon")
						  .attr("points", "0,0 10,12, -10,12")
						  .attr("transform", makeTranslate)
						  .attr("style","fill:white;cursor:ew-resize")
						  
						  
					markers
						.transition()
						.duration( ctrl.view.transitions.duration )
						.attr("transform", makeTranslate)
						
					markers.exit().remove()
					
					function makeTranslate(d){
						return "translate("+ctrl.tools.xscale(d)+",1)"
					} // makeTRanslate
				
				}, // updateMarkers
					

				
			}, // addBinNumberControls
			
			refreshContainerSize: function refreshContainerSize(ctrl){
				
				var container = d3.select(ctrl.format.parent)
				
				builder.refreshPlotRowHeight( container )
				
			} // refreshContainerSize
			
		}, // setupInteractivity
		
		helpers: {
			
			axes: {
				
				update: function update(ctrl){
					
					cfD3Scatter.helpers.axes.formatAxesY(ctrl)
					cfD3Scatter.helpers.axes.formatAxesX(ctrl)
					
					
					
				}, // update
				
				formatAxesY: function formatAxesY(ctrl){
				
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale)

					var gExponent = ctrl.figure.select(".axis--y")
						.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
					  
					// The y axis shows a number of items, which is always an integer. However, integers in scientific notation can have decimal spaces. Therefore pick integers from the original scale, and then transform them into the new scale.
					var yAxisTicks = ctrl.tools.yscale.ticks()
					  .filter(d=>Number.isInteger(d) )
					  .map(d=>Number.isInteger(format.exp) ? d/10**format.exp : d )
					
						
					ctrl.figure.select(".axis--y").call( 
						d3.axisLeft( format.scale )
							.tickValues(yAxisTicks)
							.tickFormat(d3.format("d")) 
					)
							  
					
				}, // formatAxesY
				
				formatAxesX: function formatAxesX(ctrl){
			
					var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

					var gExponent = ctrl.figure.select(".axis--x")
						.selectAll("g.exponent")
						
					gExponent.select("tspan.exp")
					  .html(format.exp)
						  
					gExponent.select("text")
					  .attr("fill", format.fill)
						
						
					ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
						  
				
				}, // formatAxesY
				
				addYLabel: function addYLabel(ctrl){
					
					ctrl.figure
					  .select("g.axis--y")
					  .selectAll("text.yAxisLabel")
					  .data( ["Number of tasks"] ).enter()
					  .append("text")
						.attr("class", "yAxisLabel")
						.attr("fill", "#000")
						.attr("transform", "rotate(-90)")
						.attr("x", 0)
						.attr("y", -25)
						.attr("text-anchor", "end")
						.style("font-weight", "bold")
						.style("font-size", 12)
						.text(function(d){return d});
					
				}, // addYLabel
				
			}, // axes
			
			createAxes: function createAxes(ctrl){
				
				var svg = ctrl.figure.select("svg.plotArea")

				svg
				  .select("g.axis--x")
				  .call( d3.axisBottom(ctrl.tools.xscale) );
				
				
				
				
				// Y AXIS
				
				// Find the desirable tick locations - integers.
				var yAxisTicks = ctrl.tools.yscale.ticks()
					.filter(function(d){ return Number.isInteger(d) });
					
				svg
				  .select("g.axis--y")
				  .transition()
				  .duration( ctrl.view.transitions.duration )
				  .call( 
					d3.axisLeft(ctrl.tools.yscale)
					  .tickValues(yAxisTicks)
					  .tickFormat(d3.format("d")) 
				);
			
				

				

			}, // createAxes
			
			transitions: {
				instantaneous: function instantaneous(){
				
					return {
						duration: 500,
						updateDelay: 0,
						enterDelay: 0
					}
				
				}, // instantaneous
				
				animated: function animated(){
				
					return {
						duration: 500,
						updateDelay: 500,
						enterDelay: 1000
					}
				
				} // animated
			}, // transitions
		
			
			// Initialisation
			createDefaultControl: function createDefaultControl(){
				
				
				var ctrl = {
					plotFunc: cfD3Histogram,
					figure: undefined,
					svg: undefined,
					view: {xVarOption: undefined,
						   nBins: undefined,
						   gVar: undefined,
						   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0
							  }
						   },
					tools: {xscale: undefined,
							yscale: undefined,
							histogram: undefined},
					format: {
						title: "Edit title",
						margin: {top: 10, right: 0, bottom: 30, left: 0},
						axesMargin: {top: 20, right: 20, bottom: 16, left: 45},
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
				
				var options = dbsliceData.data.dataProperties
				ctrl.view.xVarOption = {name: "varName",
					                     val: options[0],
								     options: options}
									 
				ctrl.view.gVar = options[0]
				
				return ctrl
				
				
			}, // createDefaultControl
			
			createLoadedControl: function createLoadedControl(plotData){
			
				var ctrl = cfD3Histogram.helpers.createDefaultControl()
				
				// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
				if(plotData.xProperty != undefined){
					if( dbsliceData.data.dataProperties.includes(plotData.xProperty) ){
						ctrl.view.xVarOption.val = plotData.xProperty
						ctrl.view.gVar =           plotData.xProperty
					} // if						
				} // if	

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
				  
				var xProperty = accessProperty( ctrl.view.xVarOption, "val" )
				
				  
				s = s + writeOptionalVal("xProperty", xProperty)
				
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
					
			
			getItems: function getItems(bins, subgroupKey){
				
				// For cfD3Histogram this function transforms the outputs from hte histogram into a format that allows individual color subgroups to be shown. As in the bar chart several rectangles are made for this.
				
				
				// Make the subgroup the graphic basis, and plot it directly. Then make sure that the grouping changes are handled properly!!
				
				var subgroupVals = subgroupKey == undefined ? [undefined] : dbsliceData.data.metaDataUniqueValues[subgroupKey]
				
				// Loop over them to create the rectangles.
				var items = []
				bins.forEach(function(bin){
					
					var x = 0
					
					subgroupVals.forEach(function(subgroupVal){
						// This will run at least once with the subgroup value of 'undefined'. In that case the item array will hold a single rectangle for each of the expected bars.
						
						var members = bin.filter(function(task){
							// In case where the subgroupKey passed in is 'undefined' this statement evaluates as 'undefined' == 'undefined'
							return task[subgroupKey] == subgroupVal
						})
						
						var rectData = {
							x0: bin.x0,
							x1: bin.x1,
							cKey: subgroupKey,
							cVal: subgroupVal,
							x: x,
							members: members
						}
						
						items.push(rectData)
						
						// Update the position for the next subgroup.
						x = x + members.length
					}) // subgroup
				}) // group
					
				return items
			}, // getItems
			
			getUnfilteredItems: function getUnfilteredItems(ctrl){
				
				var items = dbsliceData.data.cf.all();
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, undefined)
				
			}, // getUnfilteredItems
			
			getFilteredItems: function getFilteredItems(ctrl){
				
				var items = dbsliceData.data.taskDim.top(Infinity);
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, undefined)
				
			}, // getFilteredItems
			
			getFilteredItemsGrouped: function getFilteredItemsGrouped(ctrl){
				
				var items = dbsliceData.data.taskDim.top(Infinity);
				var bins = ctrl.tools.histogram(items)
				return cfD3Histogram.helpers.getItems(bins, color.settings.variable)
				
			}, // getFilteredItemsGrouped
			
			// Functions for cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				// Do nothing. On all actions the graphics showing the current selection are being updated, which changes the amount of elements on hte screen accordingly.
				
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				// Just redraw the view with allDataPoints. To avoid circularity move the data extent to the foreground?
				var highlightedBins = ctrl.tools.histogram(allDataPoints)
				
				var highlightedData = cfD3Histogram.helpers.getItems(highlightedBins, color.settings.variable)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
				// Draw the highlighted data.
				cfD3Histogram.draw.plotCurrentSelection(ctrl, highlightedData)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
				
				cfD3Histogram.draw.update(ctrl)
				
				// Adjust hte transition times.
				ctrl.view.transitions = cfD3Histogram.helpers.transitions.instantaneous()
									
			}, // defaultStyle
			
		} // helpers
		
    }; // cfD3Histogram

	var cfD3Scatter = {
		
			name: "cfD3Scatter",
		
			make: function(ctrl){
				
				// Major differences from the standalone example to the implemented one:
				// 1.) The input arguments to the make have been changed to (element, data, layout)
				// 2.) The data is now an object containing the selected inputs by the user, as well as the crossfilter object governing the data. Therefore the internal access to the data has to be changed. This is done on point of access to the data to ensure that the crossfilter selections are correctly applied.
				// 3.) Some actions are performed from outside of the object, therefore the ctrl has to be passed in. That is why the ctrl is hidden in layout now.
			
				
				
				var s = cfD3Scatter.setupPlot
				var hs= plotHelpers.setupPlot
				var i = cfD3Scatter.interactivity
				var hi= plotHelpers.setupInteractivity.twoInteractiveAxes
				
				
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
				
				// Add teh button menu - in front of the update for it!
				hs.twoInteractiveAxes.buttonMenu.make(ctrl)
				
				// Get the variable options
				s.updateUiOptions(ctrl)
				
				
				// Setup the scales for plotting
				plotHelpers.setupTools.go(ctrl)
				
				
				// Scatter plot specific interactivity.
				hi.addAxisScaling(ctrl)
				
				
				// General interactivity
				hi.addZooming(ctrl)
				i.createLineTooltip(ctrl)
				i.createPointTooltip(ctrl)
				
				// Draw the actual plot. The first two inputs are dummies.
				cfD3Scatter.update(ctrl)
			
			
			}, // make
			
			update: function update(ctrl){
				// On re-render the 'update' is called in the render, therefore it must exist. To conform with the line plot functionality the update plot here executes the redraw for now. Later on it should handle all preparatory tasks as well.
				
				cfD3Scatter.draw.plotDataExtent(ctrl)
				
				cfD3Scatter.draw.plotCurrentSelection(ctrl)
				
				cfD3Scatter.refresh(ctrl)
				
			}, // update
		
		
			draw: {
				
				plotDataExtent: function plotDataExtent(ctrl){
					
					// Plot everything there is.
					
					

					// Accessor functions
					var accessor = cfD3Scatter.helpers.getAccessors(ctrl)
					var clipPath = "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")"
					
					
					// Get the data to draw.
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
						
					// Deal with the points
					var points = ctrl.figure.select("svg.plotArea")
					  .select(".data")
					  .selectAll("circle")
					  .data(pointData, d => d.taskId)
					 
					points.join(
					  enter => enter.append("circle")
						.attr("r", 5)
						.attr("cx", accessor.x )
						.attr("cy", accessor.y )
						.style("fill", "Gainsboro")
						.style("opacity", 1)
						.attr("clip-path", clipPath)
						.attr("task-id", accessor.id )
						.each(function(d){ 
							cfD3Scatter.interactivity.addPointTooltip(ctrl, this) 
						}),
					  update => update,
					  exit => exit.remove()
					)

					
				}, // plotDataExtent
				
				plotCurrentSelection: function plotCurrentSelection(ctrl){
					// Current selection separates the current selection from the background data extent by coloring them appropriately.
					// Change the properties of the selected part.
					
					// Get the data to draw.
					var accessor = cfD3Scatter.helpers.getAccessors(ctrl)
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
					var taskIds = pointData.map(d=>d.taskId)
					
					// Weird... right now all data should still be drawn...
					
					var gData = ctrl.figure
						  .select("svg.plotArea")
						  .select("g.data")
						  
					gData.selectAll("circle")
					    .filter(function(d_){return taskIds.includes(d_.taskId)})
						.style("fill", d=> accessor.c(d) )
						.raise()
					
					// If drawing was needed, then also the lines need to be updated. Drawing should only be updated if the variable is actiually selected.
					ctrl.view.gVarOption.action = ctrl.view.gVarOption.val ? "draw" : undefined
					
				} // plotCurrentSelection
				
			}, // draw
		
			refresh: function refresh(ctrl){
				// Update also runs on manual reselct of points, and on brushing in other plots. It therefore must support the addition and removal of points.
		
				// Refresh is called on zoom!! On zoom nothing is entering or leaving, it's just readjusted.
				
				var h = cfD3Scatter.helpers
				var i = cfD3Scatter.interactivity
				
				// Check to adjust the width of the plot in case of a redraw.
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)
				
				
				// Accessor functions
				var accessor = h.getAccessors(ctrl)
				

				// Refresh point positions
				var points = ctrl.figure.select("svg.plotArea")
				  .select(".data")
				  .selectAll("circle")
				  .transition()
				    .duration(ctrl.view.transitions.duration)
				    .attr("r", 5)
				    .attr("cx", accessor.x )
				    .attr("cy", accessor.y )
				    .attr("task-id", accessor.id );
				
					
			
				// Update the markup lines to follow on zoom
				i.groupLine.update(ctrl)
				
				// Update the axes
				h.axes.update(ctrl)
			
			
				// Highlight any manually selected tasks.
				i.addSelection(ctrl);
					
					
				// Add in the interactivity of the tooltips
				i.addLineTooltip(ctrl)
				
				
			
			}, // refresh
			
			rescale: function rescale(ctrl){
				// What should happen if the window is resized?
				// 1.) The svg should be resized appropriately
				plotHelpers.setupPlot.general.rescaleSvg(ctrl)
			
				// 2.) The plot tools need to be updated
				plotHelpers.setupTools.go(ctrl)
			
				// 3.) The plot needs to be redrawn
				cfD3Scatter.refresh(ctrl)
				
			}, // rescale
		
			setupPlot: {
				
				
				// This object adjusts the default plot to include all the relevant controls, and creates the internal structure for them.
				
				updateUiOptions: function updateUiOptions(ctrl){
					// Improve this so that in case the metadata gets changed this changes appropriately - e.g. if the new metadata has the same values, then these options should keep them.
					var gh = plotHelpers.setupPlot.general
					var h = plotHelpers.setupPlot.twoInteractiveAxes
					
										 
					// Update the actual menus
					gh.updateVerticalSelection(ctrl)
					gh.updateHorizontalSelection(ctrl)
					
					
					
					// Update the dropup menu
					h.buttonMenu.update(ctrl, assembleButtonMenuOptions() )
					
					
					
					function assembleButtonMenuOptions(){
						// The button menu holds several different options that come from different sources. One is toggling the axis AR of the plot, which has nothing to do with the data. Then the coloring and grouping of points using lines, which relies on metadata categorical variables. Thirdly, the options that are in the files loaded on demand are added in.
						
						// Make a custom option that fires an aspect ratio readjustment.
						var arOption = {
							name: "AR",
							val: undefined,
							options: ["User / Unity"],
							event: cfD3Scatter.interactivity.toggleAR
						} // arOption
						
						
						// Make functionality options for the menu.
						var codedPlotOptions = [color.settings, ctrl.view.gVarOption, arOption]
						
						return codedPlotOptions
					
				} // assembleButtonMenuOptions

					
				}, // updateUiOptions
				
				updatePlotTitleControls: function updatePlotTitleControls(ctrl){
			
				// Add the toggle to switch manual selection filter on/off
				var container = d3.select( ctrl.figure.node().parentElement )
				  .select(".plotTitle")
				  .select("div.ctrlGrp")
				var onClickEvent = function(){ 
					
					var currentVal = this.checked
					
					// All such switches need to be activated.
					var allToggleSwitches = d3.selectAll(".plotWrapper[plottype='cfD3Line']").selectAll("input[type='checkbox']")
					
					allToggleSwitches.each(function(){
						
						this.checked = currentVal
						// console.log("checking")
					})
					
					// Update filters
					filter.apply()
					
					render()
				} // onClickEvent
				  
				plotHelpers.setupPlot.general.appendToggle( container, onClickEvent )
				
			}, // updatePlotTitleControls

		
				// Helpers for setting up plot tools.
				findPlotDimensions: function findPlotDimensions(svg){
				
					return {x: [0, Number( svg.select("g.data").attr("width") )],     y: [Number( svg.select("g.data").attr("height") ), 0]}
				
				
				}, // findPlotDimensions
					
				findDomainDimensions: function findDomainDimensions(ctrl){
					
					// Get the data to draw.
					var pointData = cfD3Scatter.helpers.getPointData(ctrl)
					
					// Dealing with single array.
					var xMinVal = d3.min(pointData, xAccessor)
					var yMinVal = d3.min(pointData, yAccessor)
				
					var xMaxVal = d3.max(pointData, xAccessor)
					var yMaxVal = d3.max(pointData, yAccessor)
					
					return {x: [xMinVal, xMaxVal], y: [yMinVal, yMaxVal]}
				
				
				
					function xAccessor(d){return d[ctrl.view.xVarOption.val]}
					function yAccessor(d){return d[ctrl.view.yVarOption.val]}
					
				} // findDomainDimensions
				
			
			}, // setupPlot
		
			interactivity: {
				
				onSelectChange: function onSelectChange(ctrl){
					
					// Reset the AR values.
					ctrl.view.dataAR = undefined
					ctrl.view.viewAR = undefined
					
					// Update the plot tools
					plotHelpers.setupTools.go(ctrl)
					
					// Update transition timings
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated()
					
					// Update plot itself
					cfD3Scatter.update(ctrl)
					
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
							.attr("type", "cfD3ScatterLineTooltip")
							.offset([-15, 0])
							.html(function (d) {
								return "<span>" + [ctrl.view.gVarOption.val,'=',d[0][ctrl.view.gVarOption.val]].join(' ') + "</span>";
							});
							
							ctrl.figure.select("svg.plotArea").call( tip );
						
						
					  return tip
						
					} // createTip
					
				}, // createLineTooltip
				
				addLineTooltip: function addLineTooltip(ctrl, lineDOM){
				  
					// This controls al the tooltip functionality.
				  
					var lines = d3.select(lineDOM);
				  
					lines.on("mouseover", tipOn)
						 .on("mouseout", tipOff);
				  
					  
					function tipOn(d) {
						lines.style("opacity", 0.2);
						d3.select(this)
							.style("opacity", 1.0)
							.style( "stroke-width", "4px" );
						
						
						var anchorPoint = ctrl.figure.select("svg.plotArea").select(".background").select(".anchorPoint")
							.attr( "cx" , d3.mouse(this)[0] )
							.attr( "cy" , d3.mouse(this)[1] );
						
						ctrl.view.lineTooltip.show(d, anchorPoint.node());
						
						
						
					}; // tipOn

					function tipOff(d) {
						lines.style("opacity", 1.0);
						d3.select(this)
							.style( "stroke-width", "2.5px" );
						
						ctrl.view.lineTooltip.hide();
						
						
						
					}; // tipOff
				  
				  
				}, // addLineTooltip
				
				createPointTooltip: function createPointTooltip(ctrl){
					
					if(ctrl.view.pointTooltip == undefined){
						ctrl.view.pointTooltip = createTip()
					} // if
					
					function createTip(){
						
						var tip = d3.tip()
						  .attr('class', 'd3-tip')
						  .attr("type", "pointTooltip")
						  .offset([-10, 0])
						  .html(function (d) {
							  return "<span>" + d.taskId + "</span>";
						  });
						  
						  ctrl.figure.select("svg.plotArea").call( tip );
						  
						return tip
						
					} // createTip
					
				}, // createPointTooltip
				
				addPointTooltip: function addPointTooltip(ctrl, pointDOM){
					  
					// This controls al the tooltip functionality.
					  
					var points = d3.select(pointDOM)
					  
					points.on("mouseover", tipOn)
						  .on("mouseout", tipOff);
					  
						  
						  
					function tipOn(d) {
						points.style("opacity", 0.2);
						d3.select(this).style("opacity", 1.0).attr("r", 7);
						ctrl.view.pointTooltip.show(d);
						
						crossPlotHighlighting.on(d, "cfD3Scatter")
					}; // tipOn

					function tipOff(d) {
						points.style("opacity", 1);
						d3.select(this).attr("r", 5);
						ctrl.view.pointTooltip.hide();
						
						crossPlotHighlighting.off(d, "cfD3Scatter")
					}; // tipOff
					  
					  
				}, // addPointTooltip
				
				
				// Manual selection
				addSelection: function addSelection(ctrl){
					// This function adds the functionality to select elements on click. A switch must then be built into the header of the plot t allow this filter to be added on.
					
					
					
					var points = ctrl.figure.select("svg.plotArea").select("g.data").selectAll("circle");
					
					points.on("click", selectPoint)
								
					function selectPoint(d){
						
						
						var filteredPoints = cfD3Scatter.helpers.getPointData()
						
						if(filteredPoints.includes(d)){
							
							// Toggle the selection
							var p = dbsliceData.data.manuallySelectedTasks
							
							// Is this point in the array of manually selected tasks?
							var isAlreadySelected = p.indexOf(d.taskId) > -1
							if(isAlreadySelected){
								// The poinhas currently been selected, but must now be removed
								p.splice(p.indexOf(d.taskId),1)
							} else {
								p.push(d.taskId)
							}// if
							
							// Highlight the manually selected options.
							crossPlotHighlighting.manuallySelectedTasks()
							
						} // if
						
						
						
					} // selectPoint
					
				}, // addSelecton
				
				// Custom options for dropup menu
				groupLine: {  
				
					update: function update(ctrl){
						// 'update' executes what 'make' lined up.
						
						// Shorthand handle
						var h = cfD3Scatter.interactivity.groupLine
						
						switch(ctrl.view.gVarOption.action){
							
							case "zoom":
							  // Just update the lines
							  h.updateLines( ctrl, 0 )
							  break;
							  
							case "draw":
							  h.drawLines(ctrl, ctrl.view.gVarOption.val)
							  break;
							
							case "remove":
							  h.removeLines(ctrl)
							  break;
							  
							case "replace":
							  h.replaceLines(ctrl, ctrl.view.gVarOption.val)
							  break;
							  
							default:
								// Do nothing.
							  break;
						} // switch
						
						// After the action is performed the action needs to be changed to the default - "zoom".
						ctrl.view.gVarOption.action = "zoom"
						
						
						
					}, // update
				
					make: function make(ctrl, varName, linesVarSame){
						
						// This is separated so that the lines just move with the zoom. Notice that this function does not handle zoom!!
						
						// Options to cover
						var noLines = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").empty()
						
						
						if( noLines ){
							// 1: no existing lines - draw new lines
							// h.drawLines(ctrl, varName)
							ctrl.view.gVarOption.action = "draw"
						
						} else if ( linesVarSame ){ 
							// 2: existing lines - same var -> remove lines
							// h.removeLines(ctrl)
							ctrl.view.gVarOption.action = "remove"
							
							
						} else {
							// 2: existing lines - diff var -> remove and add
							// h.replaceLines(ctrl, varName)
							ctrl.view.gVarOption.action = "replace"
						
						} // if
						
						cfD3Scatter.interactivity.groupLine.update(ctrl)
						
					
					}, // make
					
					drawLines: function drawLines(ctrl, varName){
					
						// Shorthand handles.
						var h = cfD3Scatter.interactivity.groupLine
						var i = cfD3Scatter.interactivity
						
						// Get the data to draw.
						var pointData = ctrl.plotFunc.helpers.getPointData(ctrl)
						
						// Retrieve all the series that are needed.
						var s = getUniqueArraySeries(pointData, varName)
						
							
						// Now draw a line for each of them.
						var paths = ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path")
						  .data(s)
						  
						paths
						  .enter()
						  .append("path")
						  .attr("stroke", "black")
						  .attr("stroke-width", "2")
						  .attr("fill", "none")
						  .attr("clip-path", "url(#" + ctrl.figure.select("svg.plotArea").select("clipPath").attr("id") + ")")
						  .each(function(d){ i.addLineTooltip(ctrl, this)} )
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						
						// Do the actual drawing of it in the update part.
						h.updateLines(ctrl, ctrl.view.transitions.duration)
						
						
						// Remove any now unnecessary lines.
						paths.exit()
						  .each(function(){
						
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration( ctrl.view.transitions.duration )
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){d3.select(this).remove()})
						})   
						
						
						// Update the tooltips. These can be missing if new data is added.
						ctrl.plotFunc.interactivity.addLineTooltip(ctrl)
						
						
						// HELPER
						function getUniqueArraySeries(array, varName){
				
							// First get the unique values of the variable used for grouping.
							var u = getUniqueArrayValues(array, varName)
						
						
							var s = []
							u.forEach(function(groupName){
								var groupData = array.filter(function(d){return d[varName] == groupName})
								s.push(groupData)
							})
						  return s
						
						} // getUniqueArraySeries
						
						function getUniqueArrayValues(array, varName){
							// This function returns all the unique values of property 'varName' from an array of objects 'array'.
							var u = []
							array.forEach(function(d){
								if( u.indexOf( d[varName] ) == -1){
									u.push( d[varName] )
								} // if
							})
						  return u
						
						} // getUniqueArrayValues
					  
					}, // drawLines
					
					removeLines: function removeLines(ctrl){
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						// Schedule removal transitions.
						ctrl.figure
						  .select("svg.plotArea")
						  .select(".markup")
						  .selectAll("path")
						  .each(function(){
						
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration( ctrl.view.transitions.duration )
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){d3.select(this).remove()})
						})   
					}, // removeLines
											
					replaceLines: function replaceLines(ctrl, varName){
					
						var h = cfD3Scatter.interactivity.groupLine
						
						// Update transitions:
						ctrl.view.transitions = ctrl.plotFunc.helpers.transitions.animated()
						
						// n is a coutner to allow tracking of when all the transitions have finished. This is required as the drawLines should only execute once at teh end.
						var n = 0
						ctrl.figure.select("svg.plotArea").select(".markup").selectAll("path").each(function(){
							n++
							var totalLength = this.getTotalLength();
							
							d3.select(this)
								.transition()
								.duration(ctrl.view.transitions.duration)
								.ease(d3.easeLinear)
								.attr("stroke-dashoffset", totalLength)
								.on("end", function(){
									n--
									d3.select(this).remove()
									
									if(n == 0){ 
										h.drawLines(ctrl, varName)
										
										// The lines were removed, therefore new tooltips are needed.
										ctrl.plotFunc.interactivity.addLineTooltip(ctrl)
									} // if
								}) // on
								
						}) // each
					}, // replaceLines
					
					updateLines: function updateLines(ctrl, t){
					
						// Accessor functions
						var accessor = ctrl.plotFunc.helpers.getAccessors(ctrl)
					
						var line = d3.line()
							.curve(d3.curveCatmullRom)
							.x( accessor.x )
							.y( accessor.y )
						
						var paths = ctrl.figure.select("svg.plotArea")
						  .select(".markup")
						  .selectAll("path")
							
						// The whole animation uses the framework of dashed lines. The total length of the desired line is set for the length of the dash and the blank space. Then the transition starts offsetting the start point of the dash to make the 'movement'.	
						paths.each(function(){
											
							var path = d3.select(this)
								.attr("d", line)
							
							var totalLength = path.node().getTotalLength();
							
							path.attr("stroke-dasharray", totalLength+" "+totalLength)
								.attr("stroke-dashoffset", totalLength)
								.transition()
								  .duration( t )
								  .ease(d3.easeLinear)
								  .attr("stroke-dashoffset", 0);
						})
					
					} // updateLines
				
				}, // groupLine
			
				toggleAR: function toggleAR(ctrl){
					
					if(ctrl.view.viewAR == 1){
						// Change back to the data aspect ratio. Recalculate the plot tools.
						ctrl.view.viewAR = ctrl.view.dataAR
						
						plotHelpers.setupTools.go(ctrl)
					} else {
						// Change to the unity aspect ratio. Adjust the y-axis to achieve it.
						ctrl.view.viewAR = 1
						
						// When adjusting the AR the x domain should stay the same, and only the y domain should adjust accordingly. The bottom left corner should not move.
					
						// Adjust so that the middle of the plot stays at the same place.
						
						// How many pixels per dx=1
						var xRange = ctrl.tools.xscale.range()
						var yRange = ctrl.tools.yscale.range()
						var xDomain = ctrl.tools.xscale.domain()
						var yDomain = ctrl.tools.yscale.domain()
						
						var xAR = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0])
						var yAR = xAR/ctrl.view.viewAR
						var yDomainRange = [yRange[0] - yRange[1]] / yAR
						var yDomain_ = [
							yDomain[0] - yDomainRange/2, 
							yDomain[0] + yDomainRange/2]
						
						
						ctrl.tools.yscale.domain( yDomain_ )
					} // if
					
					
					
					
					
					// t is the transformation vector. It's stored so that a delta transformation from event to event can be calculated. -1 is a flag that the aspect ratio of the plot changed.
					ctrl.view.t = -1
					
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.animated()
					cfD3Scatter.update(ctrl)
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous()
					
				}, // toggleAR
			
				// When resizing the axes interactively
				dragAdjustAR: function dragAdjustAR(ctrl){
					
					// Transitions
					ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous()
				  
					// Offload to the function itself!! Line cannot update as per new axes, because it uses transform -> translate to move the lines around.
					cfD3Scatter.update(ctrl)
					
				}, // dragAdjustAR
			
				// On resize/drag
				refreshContainerSize: function refreshContainerSize(ctrl){
				
					var container = d3.select(ctrl.format.parent)
					
					builder.refreshPlotRowHeight( container )
					
				} // refreshContainerSize
		
			}, // interactivity
			
			helpers: {
				
				
				// Initialisation
				createDefaultControl: function createDefaultControl(){
					
					var ctrl = {
						
						plotFunc: cfD3Scatter,
						figure: undefined,
						view: {
							   viewAR: NaN,
							   dataAR: NaN,
							   xVarOption: undefined,
							   yVarOption: undefined,
							   cVarOption: undefined,
							   gVarOption: undefined,
							   lineTooltip: undefined,
							   pointTooltip: undefined,
							   transitions: {
								duration: 0,
								updateDelay: 0,
								enterDelay: 0								
							   },
							   t: undefined},
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
					
					// Initialise the options straight away.
					var i = cfD3Scatter.interactivity
					var hs = plotHelpers.setupPlot.twoInteractiveAxes
					var options = dbsliceData.data.dataProperties 
					
					ctrl.view.xVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.yVarOption = {name: "varName",
					                         val: options[0],
										 options: options}
										 
					ctrl.view.cVarOption = color.settings

					// Custom option.
					ctrl.view.gVarOption = {name: "Line",
					                         val: undefined,
										 options: dbsliceData.data.metaDataProperties,
										   event: i.groupLine.make,
										  action: undefined}
					
					return ctrl
					
				}, // createDefaultControl
					
				createLoadedControl: function createLoadedControl(plotData){
				
					var ctrl = cfD3Scatter.helpers.createDefaultControl()
					
					// If the x and y properties were stored, and if they agree with the currently loaded metadata, then initialise them.
					if(plotData.xProperty != undefined){
						if( dbsliceData.data.dataProperties.includes(plotData.xProperty) ){
							ctrl.view.xVarOption.val = plotData.xProperty
						} // if						
					} // if
					
					if(plotData.yProperty != undefined){
						if( dbsliceData.data.dataProperties.includes(plotData.yProperty) ){
							ctrl.view.yVarOption.val = plotData.yProperty
						} // if						
					} // if
					
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
					  
					var xProperty = accessProperty( ctrl.view.xVarOption, "val" )
					var yProperty = accessProperty( ctrl.view.yVarOption, "val" )
					
					s = s + writeOptionalVal("xProperty", xProperty)
					s = s + writeOptionalVal("yProperty", yProperty)
					
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
					
						cfD3Scatter.helpers.axes.formatAxesY(ctrl)
						cfD3Scatter.helpers.axes.formatAxesX(ctrl)
					
						cfD3Scatter.helpers.axes.updateTicks(ctrl)
					
					}, // update
					
					
					formatAxesY: function formatAxesY(ctrl){
				
						var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.yscale)

						ctrl.figure.select(".axis--y")
							.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
							
						ctrl.figure.select(".axis--y").call( d3.axisLeft( format.scale ) )
							  
					
					}, // formatAxesY
					
					formatAxesX: function formatAxesX(ctrl){
				
						var format = plotHelpers.helpers.formatAxisScale(ctrl.tools.xscale)

						ctrl.figure.select(".axis--x")
							.selectAll("g.exponent")
							.select("text")
							  .attr("fill", format.fill)
							.select("tspan.exp")
							  .html(format.exp)
				
						ctrl.figure.select(".axis--x").call( d3.axisBottom( format.scale ).ticks(5) )
							  
					
					}, // formatAxesX
					
					updateTicks: function updateTicks(ctrl){
					  
						// Update all the axis ticks.
						ctrl.figure.select("svg.plotArea").select(".axis--x")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ew-resize")
						   
						ctrl.figure.select("svg.plotArea").select(".axis--y")
						   .selectAll(".tick")
						   .selectAll("text")
							 .style("cursor", "ns-resize")
						   
						ctrl.figure.select("svg.plotArea").selectAll(".tick")
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
			
				// Data handling
				getAccessors: function getAccessors(ctrl){
				
				return {
					x: function xAccessor(d){ 
						return ctrl.tools.xscale( d[ctrl.view.xVarOption.val] ) 
						},
					y: function yAccessor(d){ 
						return ctrl.tools.yscale( d[ctrl.view.yVarOption.val] ) 
						},
					c: function cAccessor(d){ 
						return color.get( d[ctrl.view.cVarOption.val] ) 
						},
					id: function idAccessor(d){ 
						return d.taskId 
						}
					}
				}, // getAccessors
				
				getPointData: function getPointData(ctrl){
							
				  return dbsliceData.data.taskDim.top(Infinity);
					
				}, // getPointData
			
				getUnfilteredPointData: function getUnfilteredPointData(ctrl){
					
					filter.remove();
					
					var unfilteredData = dbsliceData.data.taskDim.top(Infinity);
					
					filter.apply();
					
					return unfilteredData
					
				}, // getUnfilteredPointData
			
			
				
				// Functions for cross plot highlighting:
				unhighlight: function unhighlight(ctrl){
					
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
					    .style("fill", "Gainsboro");
						 // .style("opacity", 0.2);
					
				}, // unhighlight
				
				highlight: function highlight(ctrl, allDataPoints){
					
					var taskIds = allDataPoints.map(d=>d.taskId)
					
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
						.filter(function(d_){return taskIds.includes(d_.taskId)})
						  .style("fill", "cornflowerblue")
						  .attr("r", 7);
					
				}, // highlight
				
				defaultStyle: function defaultStyle(ctrl){
					
					// Use crossfilter to do these loops? How to speed this all up?
					
					var filteredItems = cfD3Scatter.helpers.getPointData(ctrl)
					var taskIds = filteredItems.map(d=>d.taskId)
					
					// This should only color the filtered items in blue.
					ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  .selectAll("circle")
					    .filter(function(d_){return taskIds.includes(d_.taskId)})
					    .style("fill", "cornflowerblue")
					    .attr("r", 5);
						
					
					
				}, // defaultStyle
			
				// Manual interactivity
				updateManualSelections: function updateManualSelections(ctrl){
				
					
					var g = ctrl.figure
					  .select("svg.plotArea")
					  .select("g.data")
					  
					// Instead of color change the border??
					// Default style
					g.selectAll("circle").style("stroke", "none")
					
					// Color in selected circles.
					dbsliceData.data.manuallySelectedTasks.forEach(function(d){
						g.selectAll("circle[task-id='" + d + "']")
						  .style("stroke", "rgb(255, 127, 14)")
						  .style("stroke-width", 4)
					}) //forEach
					
				} // updateManualSelections
			
			} // helpers
		
		} // cfD3Scatter
	
	var cfD3Line = {
		// • report to the user info about the data (missing, duplicated, intersect clashes, maybe even the things that will yield the largest addition of data to the screen)
	
		name: "cfD3Line",
	
		make: function(ctrl){
		
			// This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
			
			
			
			var hs = plotHelpers.setupPlot
			var hi= plotHelpers.setupInteractivity.twoInteractiveAxes
			var i = cfD3Line.interactivity
			
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
			cfDataManagement.getLineFileDataInfo(ctrl)
			
			
			
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
			if(ctrl.data.compatible.length > 0){
			
				// Update the axes
				cfD3Line.helpers.axes.update(ctrl)
				
				// CHANGE TO JOIN!!
				
				 // Assign the data
				var allSeries = ctrl.figure.select("svg.plotArea")
				  .select("g.data")
				  .selectAll("path.line")
				  .data( ctrl.data.series );

				// enter
				allSeries.enter()
				  .append( "g" )
						  .attr( "class", "plotSeries")
						  .attr( "task-id", ctrl.tools.getTaskId)
						.append( "path" )
						  .attr( "class", "line" )
						  .attr( "d", ctrl.tools.line )
						  .style( "stroke", ctrl.tools.getColor ) 
						  .style( "fill", "none" )
						  .style( "stroke-width", 2.5 / ctrl.view.t.k )
						  .on("mouseover", cfD3Line.interactivity.addTipOn(ctrl))
						  .on("mouseout", cfD3Line.interactivity.addTipOff(ctrl))
						  .on("click", cfD3Line.interactivity.addSelection)

				// update:
				allSeries.each( function() {
					// The taskId is in the parent wrapper.
					var series = d3.select( this.parentElement )
						.attr( "task-id",  ctrl.tools.getTaskId);
						
				})	
				
				// Keep a reference to the original draw domain to allow the data to be updated more seamlessly?
				allSeries
					  .transition()
					  .duration(ctrl.view.transitions.duration)
					  .attr( "d", ctrl.tools.line )
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
				
				ctrl.data.intersect.userOptions.forEach(function(dataOption){
					// For each different option that can be queried in the available compatible data, check if an option in the view is already selected, what it's value is, and update the value if it is not in the new set.
					
					var viewOption = helpers.findObjectByAttribute( ctrl.view.options, "name", [dataOption.name], true )
					
					if(viewOption.length == 0){
						ctrl.view.options.push({
							   name: dataOption.name,
							   val : dataOption.options[0],
							options: dataOption.options,
							  event: cfD3Line.updateData
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
					ctrl.view.cVarOption = color.settings
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
						event: cfD3Line.interactivity.toggleAR
					} // arOption
					
					
					// Make functionality options for the menu.
					var codedPlotOptions = [color.settings, arOption]
					
					return codedPlotOptions.concat( ctrl.view.options )
					
				} // assembleButtonMenuOptions
				
			}, // updateUiOptions
		
			// Functionality required to setup the tools.
			setupLineSeries: function setupLineSeries(ctrl){
				
				// Retrieve the data once.
				ctrl.data.series = ctrl.data.compatible.map(function(file){
					return cfDataManagement.getLineDataVals(file, ctrl)
				})
				
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
				
				var seriesExtremes = ctrl.data.series.map(function(series){
				
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
						.attr("type", "cfD3LineLineTooltip")
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
				ctrl.view.transitions = cfD3Scatter.helpers.transitions.instantaneous()
			  
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
						   processor: importExport.importing.line
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
				  .each(function(){
					  var plotSeries = d3.select(this)
					  var isSelected = dbsliceData.data.manuallySelectedTasks.includes(plotSeries.attr("task-id"))
					  
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
					
					if(highlightedTaskIds.includes(series.attr("task-id"))){
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
	
	var cfD3Contour2d = {
		
		// Externally visible methods are:
		// name, make, update, rescale, helpers.highlught/unhighlight/defaultStyle, helpers.createDefaultControl/createLoadedControl/writeControl
		
		// SHOULD: the contour plot always occupy the whole width? Should it just size itself appropriately? It has a potential to cover other plots... Should all plots just reorder. I think only the clashing plots should reorder. Maybe implement this as general functionality first.
		
		// SHOULD: instead of looping over the contours when figuring out the dimension the plot dimensions be updated internally on the fly? By saving the maximum ih for example?
	
		// SHOULD: when calculating the statistics create domain areas on which to calculate the value for particular contour? Or is this too much? It does involve integration...
	
		name: "cfD3Contour2d",
	
		make: function(ctrl){
		
			// This function only makes the plot, but it does not update it with the data. That is left to the update which is launced when the user prompts it, and the relevant data is loaded.
			
			// How should the user select the variable to be plotted? At the beginning there will be no contours, so the controls need to be elsewhere. For now put them into the plot title.
			
			// Scale the card appropriately so that it occupies some area. Needs to be adjusted for hte title height
			cfD3Contour2d.setupPlot.dimension(ctrl)
			
			
			cfD3Contour2d.setupPlot.setupTrendingCtrlGroup(ctrl)
			
			// `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.
			cfD3Contour2d.setupPlot.setupPlottingArea(ctrl)
			
			// Add the lassoing.
			cfD3Contour2d.interactivity.lassoing(ctrl)
			
			
			
			
			// The plotBody must be reassigned here so that the rightcontrolgroup svgs are appended appropriately.
			
			
			cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
			
			// NOTES:
			// How to configure the contour plot on the go? For now the positional variables will be just assumed.
			
		
		}, // make
		
				
		update: function update(ctrl){
			// This is called during render. Do nothing. Maybe only signal differences to the crossfilter.
			
		}, // update
	
		updateData: function updateData(ctrl){
			
			// This should do what? Come up with the initial contour data? Maybe calculate the initial threshold items? Set a number of levels to show. Calculate the ideal bin number?
			
			// First collect and report the data available.
			cfDataManagement.getContour2dFileDataInfo(ctrl)
			
			// How to handle contour data? The user should be expected to select the position variables once, and then just change the flow variable if needed. For now this is manually selected here, but the user should be able to select their varioable based on hte name. Implement that later. Maybe a focus out to adjust the contours, and then a focus in to show change. However, in json formats the user should just name the variables correctly!! How should it happen in csv?
			
			// Only use the first 6 files for now.
			// ctrl.data.available = ctrl.data.available.splice(0,6)
			

			// Calculate the extent of hte data and the thresholds
			cfD3Contour2d.setupPlot.setupPlotTools(ctrl)
			
			// Get the contours based on the thresholds
			cfD3Contour2d.draw.getContours(ctrl)
				
			// Draw the plot
			cfD3Contour2d.draw.cards(ctrl)
			
			// Draw teh colorbar
			cfD3Contour2d.draw.rightControlGroup(ctrl)
			
			
			// Resize the plot cotnainers
			cfD3Contour2d.resizing.plotOnInternalChange(ctrl)
			
			  
			
			// When panning over the levels markers on the colorbar highlight those on hte contours somehow.
			
			// Introduce a card folder to the side, and only present 4 at the same time at the beginning. Then the user should add other cards to the view.
			
			// A special tool to order the cards roughly? This is the grouping sort-of?
			
		}, // updateData
		
		// MOVE ALL RESCALING TO A SINGLE OBJECT?
		rescale: function rescale(ctrl){
			
			// Should rescale the whole plot and the individual contours in it.
			
			console.log("Rescaling cfD3Contour2d")
			
			// Make sure the overlay is the right size
			
		}, // rescale
		
		
		resizing: {
			
			contourCard: function contourCard(contourCtrl){
			
				// Retrieve the data AR from the plot ctrl.
				let card = contourCtrl.format.wrapper
				let p = contourCtrl.format.position
				let plotCtrl = d3.select(contourCtrl.format.parent).data()[0]
				
				let dy = positioning.dy(plotCtrl.figure)
				let dx = positioning.dx(plotCtrl.figure)
				
		
				// Update the position based on the new ih and iw.
				let position_ = cfD3Contour2d.draw.dimension(p.iw, p.ih, dx, dy, plotCtrl.data.domain.ar)
				
				p.w = position_.w
				p.h = position_.h
				p.sw = position_.sw
				p.sh = position_.sh
				p.minW = position_.minW
				p.minH = position_.minH
				p.ar = position_.ar
				
				// Update the relevant DOM elements.

				// Update the title div. Enforce a 24px height for this div.
				let title = card
				  .select("div.title")
				  .select("p")
					.style("text-align", "center")
					.style("margin-left", "5px")
					.style("margin-right", "5px")
					.style("margin-bottom", "8px")
				  
				  
				helpers.fitTextToBox(title, title, "height", 24)
		
				// Update the plot svg
				card.select("svg.plotArea")
				  .attr("width",  p.sw)
				  .attr("height", p.sh )
				
				
			}, // contourCard
			
			plotOnInternalChange: function plotOnInternalChange(ctrl){
				// An internal change has occured that prompted the plot to be resized (contours were added, moved, or resized).
				
				// Update the plot, AND the plot row. When updating the plot row also the other plots need to be repositioned on the grid.
				
				// Needs to update:
  				// 1 plot (div.plot holding the contours), 
				// 2 plotWrapper (containing hte whole plot)
				// 3 plotRowBody (containing the plot). 
				// 4 other plots of hte plot row need to be repositioned.
				
				// First update the size of the contour plotting area. Based on this size update the plot wrapper. Based on the new plot wrapper size update the plot row.
				
				
				let h = positioning.helpers
				let f = ctrl.format
				let w = ctrl.format.wrapper
				
				let dx = positioning.dx( d3.select( f.parent ) )
				let dy = positioning.dy( d3.select( f.parent ) )
				
				
				
				let rightControlSize = w.select("svg.rightControlSVG").node().getBoundingClientRect()
				let rightControlY = f.rightControls.format.position.iy * positioning.dy( d3.select(f.rightControls.format.parent) )
				
				
				// Heights of components
				let titleHeight = w.select("div.plotTitle").node().offsetHeight
				let plotHeight = h.findContainerSize(ctrl.figure, ".contourWrapper")
				let colorbarHeight = rightControlY + rightControlSize.height
				let figureHeight = colorbarHeight > plotHeight ? colorbarHeight : plotHeight
				
				// Size the plotWrapper appropriately.
				let ih = Math.ceil( (figureHeight + titleHeight) / dy) 
				f.position.ih = ih < 4 ? 4 : ih
				
				
				// Update the heights of the wrapper, hte plot body, and the svg overlay.
				let wrapperHeight = f.position.ih*dy
				let plotAreaHeight= wrapperHeight - titleHeight
				
				w.style("height", wrapperHeight + "px" )
				ctrl.figure.style("height", plotAreaHeight + "px" )
				
				w.select("svg.overlay").style("height", plotAreaHeight + "px")
				
				
				// Reposition other on-demand plots and size the plot row accordingly.
				cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
				
				
				
				
			}, // plotOnInternalChange
			
			plotOnExternalChange: function plotOnExternalChange(plotCtrl){
				// An external change occured - the plot was moved or resized.
				
				// The contour plot is not allowed to clash with other plots. Once an appropriate sizing logic will be selected and implemented this can be relaxed. Therefore when it is moved or resized other plots in the same plot row need to be repositioned.
				
				// If the body of the plot moves, then hte other plots must also move.
				positioning.helpers.repositionSiblingPlots(plotCtrl)
				
				// Update the plot row height itself.
				let plotRowBody = d3.select(plotCtrl.format.parent)
				builder.refreshPlotRowHeight(plotRowBody)
				
				
			}, // plotOnExternalChange
			
			
			
			
		}, // resizing
		

	
			
		// Rename setupPlot -> setup
		// Add groups: plot, controls, cards
	
		setupPlot: {
			
			// Broadly dimension the plot.
			dimension: function dimension(ctrl){
				
				// `makeNewPlot' sizes the plot wrapper. Here calculate the dimensions of the internals.
				let p = ctrl.format.position
				let w = ctrl.format.wrapper
				
				let dy = positioning.dy(d3.select( ctrl.format.parent ))
				let wrapperHeight = p.ih*dy
				
				p.titleHeight = w.select(".plotTitle").node().offsetHeight
				p.plotHeight = wrapperHeight - p.titleHeight
				p.plotWidth =  w.node().offsetWidth - p.rightControlWidth
				
				
			}, // dimension
			
			setupPlottingArea: function setupPlottingArea(ctrl){
				
				let p = ctrl.format.position
				
				// `cfD3Contour2d' has a different structure than the other plots, therefore the `ctrl.figure' attribute needs to be updated.
				let dataDiv = ctrl.figure.append("div")
				  .attr("class", "data")
				  .style("width",  p.plotWidth + "px" )
				  .style("height", p.plotHeight + "px" )
				  .style("position", "absolute")
				  
				// MOST OF BELOW IS DUE TO LASSOING. MOVE!!
				var overlaySvg = ctrl.figure.append("svg")
					.attr("class", "overlay")
					.style("width",  p.plotWidth + "px" )
					.style("height", p.plotHeight + "px" )
					.style("position", "absolute")
					.style("top", p.titleHeight + "px")
					.style("display", "none")
					
				
				  
				dataDiv.on("mousemove", function(){
					  if (event.shiftKey) {
						  overlaySvg.style("display", "")
					  } else {
						  overlaySvg.style("display", "none")
					  } // if
				})
				
				overlaySvg.on("mousemove", function(){
					if (event.shiftKey) {
						  
						  
					} else {
						// If shift is released, hide overlay
						overlaySvg.style("display", "none")
					} // if
				})
				
				
				// Add in hte tooltip that hosts the tools operating on lasso selection.
				cfD3Contour2d.interactivity.tooltip.add(ctrl)
				
				// Reassing hte figure to support drag-move.
				ctrl.figure = dataDiv
				
				
				
				
				// Also setup the right hand side controls
				cfD3Contour2d.setupPlot.setupRightControlDOM(ctrl)
				
			}, // setupPlottingArea
			
			setupTrendingCtrlGroup: function setupTrendingCtrlGroup(ctrl){
				
				let variables = dbsliceData.data.dataProperties
				
				let trendingCtrlGroup = ctrl.format.wrapper
				  .select("div.plotTitle")
				  .append("div")
				    .attr("class", "trendingCtrlGroup float-right")
					.style("display", "none")
					.datum(ctrl)
					
				let p = cfD3Contour2d.interactivity.piling
				p.addRoundButton(trendingCtrlGroup, p.minimise, "times")
				
					
				let menu = trendingCtrlGroup
				  .append("div")
				    .attr("class", "trendTools")
				    .style("position", "relative")
				    .style("top", "5px")
				    .style("display", "inline-block")
					.style("float", "right")
					.style("margin-right", "10px")
				
				menu.append("label")
					.html("x:")
					.style("margin-left", "10px")
					.style("margin-right", "5px")
				
				menu.append("select")
				    .attr("axis", "x")
				    .style("margin-right", "10px")
				  .selectAll("option")
				  .data(variables)
				  .enter()
				  .append("option")
					.attr("value", d=>d)
					.html(d=>d)
					
				menu.append("label")
					.html("y:")
					.style("margin-left", "10px")
					.style("margin-right", "5px")
				
				menu.append("select")
				    .attr("axis", "y")
				    .style("margin-right", "10px")
				  .selectAll("option")
				  .data(variables)
				  .enter()
				  .append("option")
					.attr("value", d=>d)
					.html(d=>d)
					
				// Add the functionalityto the dropdowns
				menu.selectAll("select").on("change", function(){
					
					console.log("Arrange the contours by: " + this.value)
					
					// Find the axis:
					let axis = d3.select(this).attr("axis")
					
					cfD3Contour2d.interactivity.sorting[axis](ctrl, this.value)
				})
				
					
				/* Buttons needed:
						Minimise
						Highlight
				*/
				
				
				p.addRoundButton(trendingCtrlGroup, p.highlight, "lightbulb-o")
				
			}, // setupTrendingCtrlGroup
			
			// Right colorbar control group
			
			setupContourTools: function setupContourTools(ctrl){
				
				var h = cfD3Contour2d.setupPlot
				var files = ctrl.data.available
				
				// Calculate the spatial domain.
				var xDomain = h.getDomain(files, d=>d.data.vals.surfaces.x)
				var yDomain = h.getDomain(files, d=>d.data.vals.surfaces.y)
				var vDomain = h.getDomain(files, d=>d.data.vals.surfaces.v)
				
				
				// Setup the domain.
				ctrl.data.domain = {
					x: xDomain,
					y: yDomain,
					v: vDomain,
					ar: ( yDomain[1] - yDomain[0] ) / ( xDomain[1] - xDomain[0] ),
					thresholds: undefined,
					nLevels: undefined
				}
				
				cfD3Contour2d.setupPlot.setupThresholds(ctrl, vDomain)
				

			}, // setupContourTools

			setupColorbarTools: function setupColorbarTools(ctrl){
				
				let c = ctrl.format.rightControls.colorbar
	
			    // Tools. `scaleSequential' maps into a range between 0 and 1.
				ctrl.tools.scales.px2clr = d3.scaleSequential(d3.interpolateViridis)
				  .domain([0, c.height ])
				  
				// Thresholds respond to selections on hte histogram. This is the corresponding scale.
				ctrl.tools.scales.val2px = d3.scaleLinear()
				  .domain( d3.extent( ctrl.data.domain.thresholds ) )
				  .range([0, c.height ])
				 
				// Histogram needs to use a fixed scale based on the data domain.
				ctrl.tools.scales.val2px_ = d3.scaleLinear()
				  .domain( ctrl.data.domain.v )
				  .range([0, c.height ])
				  
				// Coloring
				ctrl.tools.scales.val2clr = d3.scaleSequential(d3.interpolateViridis)
				  .domain( d3.extent( ctrl.data.domain.thresholds ) )
				  
				
			}, // setupColorbarTools
			
			setupHistogramTools: function setupHistogramTools(ctrl){
				
				
				// There is a lot of data expected, and therefore each pixel can be used as a bin. Avoid making a new large array by calculating the histogram for each file independently, and then sum up all the bins.
				
				let s = ctrl.tools.scales
				let c = ctrl.format.rightControls.colorbar
				let h = ctrl.format.rightControls.histogram
				
				// Get the histogram data
				let vMin = ctrl.data.domain.v[0]
				let vMax = ctrl.data.domain.v[1]
				let nBins = c.height
				let thresholds = d3.range(vMin, vMax, (vMax - vMin)/nBins )
				 
				let histogram = d3.histogram()
				  .domain( ctrl.data.domain.v )
				  .thresholds( thresholds );
								  
				let fileBins = ctrl.data.available.map(function(file){
					
					// The returned bins acutally contain all the values. Rework the bins to remove them and thus minimise memory usage.
					let bins = histogram( file.data.vals.surfaces.v )
					
					return bins.map(function(bin){return {x0:bin.x0, x1:bin.x1, n: bin.length}});
				})
				
				// Now summ all hte bins together.
				h.bins = fileBins.reduce(function(acc, val){
					// Acc and val are arrays of bins, which have to be summed individually.
					return acc.map(function(d,i){
						d.n += val[i].n
						return d
					})
				})
				
				// Take a log of the bin lengths to attempt to improve the histogram
				h.bins = h.bins.map(function(d){
					d.n = d.n == 0 ? 0 : Math.log10(d.n)
					return d
				})
				
				
				// Tools for the histogram.
				s.bin2px = d3.scaleLinear()
				  .domain([0, d3.max( h.bins, d=>d.n ) ])
				  .range([0, h.width ])
				  
				
			}, // setupHistogramTools
			
			
			sizeRightControlGroup: function sizeRightControlGroup(ctrl){
				
				// Histogram can be narrower!
				
				let groupDiv = ctrl.format.wrapper.select("div.rightControlGroup")
				let width  = groupDiv.node().getBoundingClientRect().width
				let height = groupDiv.node().getBoundingClientRect().height
				

				let h = ctrl.format.rightControls.histogram
				let c = ctrl.format.rightControls.colorbar

				// Dimension control group. X and Y are positions of the svgs.			
				c.width = width * 3/5 - c.margin.left - c.margin.right
			    c.height = height - c.margin.top - c.margin.bottom
				c.x = c.margin.left
				c.y = c.margin.top
				c.legendWidth = c.width * 1/2
				c.axisWidth   = c.width * 1/2
				
				
				h.width = width * 2/5 - h.margin.left - h.margin.right
			    h.height = height - h.margin.top - h.margin.bottom
				h.x = c.margin.left + c.width + c.margin.right + h.margin.left
				h.y = h.margin.top
				
				// The control group consists of two SVGs side-by-side. The left holds an interactive histogram, the right holds the interactive colorbar. Both have the same size.
				
				
				
				
				
			}, // sizeRightControlGroup
			
			setupRightControlDOM: function setupRightControlDOM(ctrl){
				
				//Separate this out into colorbar and histogram??
				let p = ctrl.format.position
				let c = ctrl.format.rightControls.colorbar
				let h = ctrl.format.rightControls.histogram
				
				// Let teh div be the wrapper, and the parent simultaneously.
				
				let rightControlDiv = ctrl.format.wrapper.select("div.plot")
				  .append("div")
					.attr("class", "rightControlGroup")
					.style("width",  p.rightControlWidth + "px" )
					.style("height", p.plotHeight + "px")
					.style("position", "absolute")
					.style("left", p.plotWidth + "px")
					.style("top", p.titleHeight + "px")
					
					
				// One stationary div
				let rightControlSvgWrapper = rightControlDiv.append("div").attr("class", "rightControlWrapper")
				  
					
				let rightControlSVG = rightControlSvgWrapper
				  .append("svg")
					.attr("class", "rightControlSVG")
					.attr("width",  p.rightControlWidth )
					.attr("height", Math.floor( p.plotHeight ) )
					.style("position", "absolute")
					
				ctrl.format.rightControls.format.parent = rightControlSvgWrapper.node()
				ctrl.format.rightControls.format.wrapper = rightControlSVG
			

				// Size the components.
				cfD3Contour2d.setupPlot.sizeRightControlGroup(ctrl)
			
				// These should be sized later on, so in case some resizing is needed it is easier to update.
				h.svg = rightControlSVG.append("svg")
				c.svg = rightControlSVG.append("svg")
				
				// Update teh svgs
				h.svg
				  .attr("height", h.height )
				  .attr("width", h.width )
				  .attr("x", h.x )
				  .attr("y", h.y )
				
			    c.svg
				  .attr("height", c.height )
				  .attr("width", c.width )
				  .attr("x", c.x )
				  .attr("y", c.y )

				
				
				// Colorbar: the transform is required as d3.axisLeft positions itself in reference to the top right corner.
				let gColorbar = c.svg.append("g")
				  .attr("transform", helpers.makeTranslate(c.axisWidth, 0) )
				gColorbar.append("g").attr("class", "gBar")
				gColorbar.append("g").attr("class", "gBarAxis")
				gColorbar.append("g").attr("class", "gBarLevels")
				
				// Histogram
				h.svg.append("g").attr("class", "gHist")
			    h.svg.append("g").attr("class", "gBrush")
			    h.svg.append("g").attr("class", "gHistAxis")
				
				// Additional text for histogram.
				let logNote = rightControlSVG
				  .append("g")
					.attr("class", "logNote")
				    .attr("transform", helpers.makeTranslate(h.x + 20, h.height + h.y + 9) )
				  .append("text")
				    .style("font", "10px / 15px sans-serif")
				    .style("font-size", 10 + "px")
				    .style("display", "none")
				logNote.append("tspan").text("log")
				logNote.append("tspan").text("10").attr("dy", 7)
				logNote.append("tspan").text("(n)").attr("dy", -7)
				
				
				
				
				// Add the dragging.
				let drag = d3.drag()
				  .on("start", positioning.dragStart)
				  .on("drag", positioning.dragMove)
				  .on("end", positioning.dragEnd)
				
				rightControlSVG
				  .append("g")
				    .attr("class", "gRightGroupDrag")
				  .append("circle")
				    .attr("r","5")
				    .attr("cx", h.x - 15 )
				    .attr("cy", p.plotHeight - 6 )
				    .attr("fill","gainsboro")
				    .attr("cursor", "move")
				    .attr("opacity", 0)
				    .datum( ctrl.format.rightControls )
				    .call(drag)
				
				
				  
				
				
			}, // setupRightControlDOM
			
			
			// The plotting tools
			setupPlotTools: function setupPlotTools(ctrl){
				
				// Setup the colorbar tools. This is in a separate function to allow it to be updated later if needed. Maybe create individual functions for all three? Contour, Colorbar, Histogram?
				cfD3Contour2d.setupPlot.setupContourTools(ctrl)
				
				cfD3Contour2d.setupPlot.setupColorbarTools(ctrl)
				
				cfD3Contour2d.setupPlot.setupHistogramTools(ctrl)
				  
			}, // setupPlotTools
			
			setupThresholds: function setupThresholds(ctrl, extent){
				// The domain of the data, and the domain of the visualisation need not be the same. This is needed when selecting a subset on hte colorbar histogram.
				
				// Calculate the initial threshold values. Note that thresholds don't include teh maximum value.
				
				// First check if the number of levels has been determined already.
				if( ctrl.data.domain.nLevels == undefined ){
					// Base it off of the values in a single contour.
					ctrl.data.domain.nLevels = d3.thresholdSturges( ctrl.data.available[0].data.vals.surfaces.v )
				} // if
				
				
				var thresholds = d3.range(extent[0], extent[1], (extent[1] - extent[0])/ctrl.data.domain.nLevels )
				
				ctrl.data.domain.thresholds = thresholds
				
				
			}, // setupThresholds
			
			getDomain: function getDomain(data, accessor){
				
				// Data is expected to be an array of contour chart data 
				// read from the attached json files.
				let domain = data.map(function(d){
					return d3.extent( accessor(d) )
				}) // map
						
				return d3.extent( [].concat.apply([], domain) )
			}, // getDomain
			
			// Contour cards
			design: function design(ctrl, file){
				// This is the initial dimensioning of the size of the contour cards.
				  
				// Find a range aspect ratio that will fit at least 6 similar contours side by side.
				
				
				  
				// Max width is 3 grid nodes. Find a combination of nx and ny that get an AR lower than the domain AR.
				let cardsPerRow = 6
				let bestCandidate = {ar: 0}
				
				// Margins are implemented on the svg itself. They are taken into account through the projection.
				
				let dy = positioning.dy(ctrl.figure)
				let dx = positioning.dx(ctrl.figure)
				let nx = positioning.nx(ctrl.figure)
				
				
				for(let iw = 1; iw <= nx/cardsPerRow; iw++){
					for(let ih = 1; ih <= nx; ih++){
					  
						// Calculate proposed card dimensions  
						let candidate = cfD3Contour2d.draw.dimension(iw, ih, dx, dy, ctrl.data.domain.ar)
						  
						// Enforce constraints. The data AR must be larger than the maximum available svg AR to allow the visualisation to fill the space as good as possible.
						// Find the maximum (!) inner ar of the cnadidates. As candidates are enforced to have an AR smaller than the data AR this will be the closest to the data AR.
						if( (ctrl.data.domain.ar >= candidate.ar) && (candidate.ar > bestCandidate.ar) ){
							bestCandidate = candidate
						} // if
					} // for
				} // for
				  
				  
				
				
				return bestCandidate
				
			}, // design
			
			
		}, // setupPlot
	
		// Keep both svg and webGL contour drawing. webGL can draw the colors, while the svg can draw teh levels. But even if the svg draws the levels it must go throug the same loops to do it...
	
		draw: {
			
			// Making the presentation blocks.
			cards: function cards(ctrl){
				// This should handle the enter/update/exit parts.
  
			    const div = ctrl.figure
				let dx = positioning.dx(div)
				let dy = positioning.dy(div)
			  
			    let drag = cfD3Contour2d.interactivity.dragging.make(ctrl)
				  
				function getPositionLeft(d){
					return d.format.position.ix*dx + d.format.parent.offsetLeft + "px"
				}
				function getPositionTop(d){
					return d.format.position.iy*dy + "px"
				}
			    
				// The key function must output a string by which the old data and new data are compared.
			    let cards = div.selectAll(".contourWrapper")
				  .data(ctrl.data.plotted, d => d.task.taskId)
			  
			    // The update needed to be specified, otherwise errors occured.
			    cards.join(
				  enter => enter.append("div")
					.attr("class", "card contourWrapper")
					.attr("task",d=>d.task.taskId)
					.style("position", "absolute")
					.style("background-color", "white")
					.style("left", getPositionLeft )
					.style("top", getPositionTop )
					.style("cursor", "move")
					.call(drag)
					.each(function(d){
						
						d.format.wrapper = d3.select(this)
						
						cfD3Contour2d.draw.contourBackbone(d)
					
						// Draw the actual contours.
						cfD3Contour2d.draw.contours(d)
					}),
				  update => update
				    .each( d => cfD3Contour2d.draw.contours(d) )
					.style("left", getPositionLeft )
					.style("top", getPositionTop ),
				  exit => exit.remove()
				)

			   
			   
			   
			}, // cards
			
			contourBackbone: function contourBackbone(d){
				
				// The projection should be updated here to cover the case when the user resizes the plot.
  
			    let card = d.format.wrapper
			    
			    // Set the width of the plot, and of the containing elements.
			    card
				  .style(     "width", d.format.position.w + "px" )
				  .style( "max-width", d.format.position.w + "px" )
				  .style(    "height", d.format.position.h + "px" )
			  
			    // Append the title div. Enforce a 24px height for this div.
			    let title = card.append("div")
				  .attr("class", "title")
				  .append("p")
				  .style("text-align", "center")
				  .style("margin-left", "5px")
				  .style("margin-right", "5px")
				  .style("margin-bottom", "8px")
				  .text( d=> d.task.taskId )
				  
				  
				helpers.fitTextToBox(title, title, "height", 24)
							  
			    // Append the svg
			    card.append("svg")
				    .attr("class", "plotArea")
				    .attr("width",  d.format.position.sw)
				    .attr("height", d.format.position.sh )
				    .style("fill", "smokewhite")
				    .style("display", "block")
				    .style("margin", "auto")
			      .append("g")
				    .attr("class", "contour")
				    .attr("fill", "none")
				    .attr("stroke", "#fff")
				    .attr("stroke-opacity", "0.5")

					
				// The resize behavior. In addition to resizeEnd the resizing should also update the contour.
				let resize = d3.drag()
				  .on("start", positioning.resizeStart)
				  .on("drag", positioning.resizeMove)
				  .on("end", function(d){
					  
					  positioning.resizeEnd(d)
					  
					  cfD3Contour2d.draw.updateContour(d)
				  })
				  
				card.append("svg")
					.attr("width",  "10")
					.attr("height", 10)
					.style("position", "absolute")
					.style("bottom", "0px")
					.style("right", "0px")
				  .append("circle")
					.attr("cx", "5")
					.attr("cy", 5)
					.attr("r", 5)
					.attr("fill", "gainsboro")
					.attr("cursor", "nwse-resize")
					.call(resize)
				
			}, // contourBackbone
			
			// Actual drawing
			contours: function contours(d){
				
				// The projection should be updated here to cover the case when the user resizes the plot.

			  
			    // Append the contour
			    d.format.wrapper.select("g.contour")
				  .selectAll("path")
				  .data(d => d.levels)
				  .join("path")
				    .attr("fill", d.format.color )
				    .attr("d", cfD3Contour2d.draw.projection(d) );
				
					  
			}, // contours
			
			updateContour: function updateContour(d){
				
				// By this point everything external to the contour has been rescaled. Here the internal parts still need to be rescaled, and the contour levels redrawn.
				
				// Readjust the card DOM
				cfD3Contour2d.resizing.contourCard(d)
				
				
				// The projection should be updated here to cover the case when the user resizes the plot.
  
			    let card = d.format.wrapper
			    let projection = cfD3Contour2d.draw.projection(d)

			  
			    // Update the contour
				card.select("g.contour")
				  .selectAll("path")
				  .data(d => d.levels)
				  .join(
					enter => enter.append("path")
					             .attr("fill", d.format.color )
				                 .attr("d", projection ),
					update => update
					             .attr("fill", d.format.color )
				                 .attr("d", projection ),
					exit => exit.remove()
				  )
					
					
				
				
			}, // updateContour
			
			
			// The control group
			rightControlGroup: function rightControlGroup(ctrl){
				
			    

			    // The histogram on the left.
			    cfD3Contour2d.draw.histogram(ctrl)
			  
			    // The colorbar on the right.
				cfD3Contour2d.draw.colorbar(ctrl)
				
				let r = ctrl.format.rightControls
				
				// Turn the group controls and the note on.
				r.format.wrapper
				  .select("g.gRightGroupDrag")
				  .selectAll("circle")
				  .attr("opacity", 1)
				  
				let histogramLogNote = r.format.wrapper
				  .select("g.logNote")
				  .select("text")
				    .style("display", "initial")
			    
				// Enforce that the axis text is the same size on both plots here!
				
				let colorbarAxisTicks = r.colorbar.svg.select("g.gBarAxis").selectAll("text")
				let histogramAxisTicks = r.histogram.svg.select("g.gHistAxis").selectAll("text")
				let histogramLogNoteText = histogramLogNote.selectAll("tspan")
				
				let minFontSize = d3.min([
					parseInt( colorbarAxisTicks.style("font-size") ),
					parseInt( histogramAxisTicks.style("font-size") ),
					parseInt( histogramLogNote.style("font-size") )
				])
				
				colorbarAxisTicks.style("font-size", minFontSize)
				histogramAxisTicks.style("font-size", minFontSize)
				histogramLogNote.style("font-size", minFontSize)
				
				// Draw ticks to show it's a log scale. This will have to be on the background svg. Axis to small to draw ticks - a text has been added instead.
				
				// Make the colorbar draggable. For the colorbar to move automatically a scrolling event would have to be listened to. Position sticky positions the colorbar below everything else.
				
				// Maybe draw the empty colorbar etc on startup already??
				
				// Make the colorbar interactive!!
				
			}, // rightControlGroup
			
			colorbar: function colorbar(ctrl){
				// The colorbar must have it's own axis, because the user may want to change the color extents to play with the data more. 
				
				let c = ctrl.format.rightControls.colorbar
				let s = ctrl.tools.scales
				

				// Color bars
			    c.svg.select("g.gBar").selectAll("rect")
				  .data( d3.range( c.height ) )
				  .enter()
				  .append("rect")
				    .attr("class", "bars")
				    .attr("x", 0)
				    .attr("y", d=>d)
				    .attr("height", 2)
				    .attr("width", c.legendWidth)
				    .style("fill", s.px2clr )    
			  
			    // Add in the axis with some ticks.
				let gBarAxis = c.svg.select("g.gBarAxis")
				gBarAxis.call( d3.axisLeft( s.val2px ) )
						
				// Dimension the axis apropriately. 
				helpers.fitTextToBox(gBarAxis.selectAll("text"), gBarAxis, "width", c.axisWidth)
				
				
				// Draw the contour plot levels.
				c.svg.select("g.gBarLevels").selectAll("rect")
				  .data( ctrl.data.domain.thresholds )
				  .enter()
				    .append("rect")
				      .attr("class", "bars")
				      .attr("x", 2)
				      .attr("y", d => s.val2px(d) )
				      .attr("height", 2)
				      .attr("width", c.legendWidth - 3)
					  .attr("cursor", "ns-resize")
				      .style("fill", "gainsboro" )
				
			}, // colorbar
			
			histogram: function histogram(ctrl){
				
				
				let h = ctrl.format.rightControls.histogram
				let s = ctrl.tools.scales
				
			    let gHist = h.svg.select("g.gHist")
				
				
			  
			    let rects = gHist.selectAll("rect").data( h.bins )
			    rects.enter()
				  .append("rect")
				    .attr("height", d => s.val2px_(d.x1) - s.val2px_(d.x0) )
				    .attr("width", d => s.bin2px(d.n) )
				    .attr("y", d => s.val2px_(d.x0) )
				    .style("fill", "DarkGrey")
			  
				
			  
			    // Brushing and axes.
			    let gBrush = h.svg.select("g.gBrush")
			    let gHistAxis = h.svg.select("g.gHistAxis")
				  
			    let brush = d3.brushY(s.val2px_).on("end", cfD3Contour2d.interactivity.rightControls.histogramBrushMove);
			  
			    gBrush.call(brush);
			  
			    // Add in the axis with some ticks.
				gHistAxis.call( d3.axisRight( s.val2px_ ) )
				
				
				h.svg.select("g.gHistBottom").append("p").text("log10(n)")
				
			}, // histogram
			
			
			
			// MOVE getContours, json2contour, dimensioning, projection TO SETUP PLOT!!
			
			getContours: function getContours(ctrl){
				// Assemble all information required to draw the individual contours in a single object.
			  

			  
				let item
				let alreadyPlottedTasks = ctrl.data.plotted.map(d=>d.task.taskId)
				
				// Create contours
				ctrl.data.plotted = ctrl.data.available.map(function(file){
					// The available files is a collection in the memory. Mapping this data into `plotted' establishes the connection to DOM, and allows to check whether this file already has a DOM card associated to it.
					
					// The files already have properties:
					// data, task, url.
					
					// Add properties: `plotFunc', `levels', `parent', `wrapper', `format'.
					
					// If the current file is already in hte plotted array then just return that. Otherwise initialise a new one.
					
					// What happens if the URL is duplicated?? Instead focus on retrieving the taskId
					let i = alreadyPlottedTasks.indexOf(file.task.taskId)
					
					if( i > -1 ){
						// Return the already existing object.
						item = ctrl.data.plotted[i]
						
					} else {
						// Initialise new plotting entry.
						
						item = {
							data: file.data,
							task: file.task,
							url: file.url,
							plotFunc: cfD3Contour2d,
							levels: cfD3Contour2d.draw.json2contour(file.data.vals.surfaces, ctrl.data.domain.thresholds),
							format: {
								parent: ctrl.figure.node(),
								wrapper: undefined,
								position: cfD3Contour2d.setupPlot.design(ctrl, file),
								domain: ctrl.data.domain,
								color: function(d){ return ctrl.tools.scales.val2clr(d.value) }
							}
						} // item
						
					
					} // if
					
					return item
				}) // items
				  
				  
				// Positioning needs to be re-done to allow for update to add cards. Position the new cards below the existing cards.
				positioning.newCard(ctrl)
				
				
				
				
			}, // getContours
			
			json2contour: function json2contour(surface, thresholds){
			  // Create the contour data
			  return d3.contours()
						.size(surface.size)
						.thresholds(thresholds)
						(surface.v)
			}, // json2contour


			dimension: function dimension(iw, ih, dx, dy, dataAR){
				// Calculates the inner dimensions of a contour plot card, which depend on the data aspect ratio, and the dimensions of the card.
				
				// Specify a margin to the card sides, and the title of hte card.
				// 24px for title, 10px for resize controls. The minimum height of the card in px is the title width plus 30px.
				let margin = {y: 7, x: 7}
				let title = 24 + 10
				
				// Calculate proposed card dimensions
				let divHeight = ih*dy
				let divWidth = iw*dx
				let divAR = divHeight/divWidth
				let innerHeight = divHeight - 2*margin.y - title
				let innerWidth = divWidth - 2*margin.x
				
				return {ix: undefined,
						iy: undefined,
						 x: undefined,
						 y: undefined,
						iw: iw, 
						ih: ih, 
						w: divWidth,
						h: divHeight,
						sw: innerHeight / dataAR,
						sh: innerHeight,
						minW: dx,
						minH: title + 30,
						ar: innerHeight / innerWidth,
						mouse: {}
				}
				
				
				
				
				
			}, // dimension
			
			projection: function projection(file){
				// The projection is only concerned by plotting the appropriate contour level points at the appropriate x and y positions. That is why the projection only relies on x and y data, and can be computed for all contours at the same time, if they use the same x and y locations.

				let xscale = d3.scaleLinear()
						.domain( file.format.domain.x )
						.range( [0, file.format.position.sw] );

				let yscale = d3.scaleLinear()
						.domain( file.format.domain.y ) 
						.range( [file.format.position.sh, 0] );
				
				let x = file.data.vals.surfaces.x;
				let y = file.data.vals.surfaces.y;
				let m = file.data.vals.surfaces.size[0];
				let n = file.data.vals.surfaces.size[1];

				// configure a projection to map the contour coordinates returned by
				// d3.contours (px,py) to the input data (xgrid,ygrid)
				let p = d3.geoTransform( {
					point: function( px, py ) {
						let xfrac, yfrac, xnow, ynow;
						let xidx, yidx, idx0, idx1, idx2, idx3;
						// remove the 0.5 offset that comes from d3-contour
						px = px - 0.5;
						py = py - 0.5;
						// clamp to the limits of the xgrid and ygrid arrays (removes "bevelling" from outer perimeter of contours)
						px < 0 ? px = 0 : px;
						py < 0 ? py = 0 : py;
						px > ( n - 1 ) ? px = n - 1 : px;
						py > ( m - 1 ) ? py = m - 1 : py;
						// xidx and yidx are the array indices of the "bottom left" corner
						// of the cell in which the point (px,py) resides
						xidx = Math.floor(px);
						yidx = Math.floor(py); 
						xidx == ( n - 1 ) ? xidx = n - 2 : xidx;
						yidx == ( m - 1 ) ? yidx = m - 2 : yidx;
						// xfrac and yfrac give the coordinates, between 0 and 1,
						// of the point within the cell 
						xfrac = px - xidx;
						yfrac = py - yidx;
						// indices of the 4 corners of the cell
						idx0 = xidx + yidx * n;
						idx1 = idx0 + 1;
						idx2 = idx0 + n;
						idx3 = idx2 + 1;
						// bilinear interpolation to find projected coordinates (xnow,ynow)
						// of the current contour coordinate
						xnow = (1-xfrac)*(1-yfrac)*x[idx0] + xfrac*(1-yfrac)*x[idx1] + yfrac*(1-xfrac)*x[idx2] + xfrac*yfrac*x[idx3];
						ynow = (1-xfrac)*(1-yfrac)*y[idx0] + xfrac*(1-yfrac)*y[idx1] + yfrac*(1-xfrac)*y[idx2] + xfrac*yfrac*y[idx3];
						this.stream.point(xscale(xnow), yscale(ynow));
					} // point
				}); // geoTransform
				
				return d3.geoPath( p );
			} // projection

			
			
			
		}, // draw
	
		interactivity: {
			
			// POTENTIALLY MOVE FOR ALL PLOTS?
			refreshContainerSize: function refreshContainerSize(ctrl){
				// This is used in other plots too, so must remain here.
				
				// There are 4 events that may prompt resisizing.
				// 1: Moving plots
				// 2: Resizing plots - cannot resize contour plot for now!!
				// 3: Moving contours
				// 4: Resizing contours
				
				if(ctrl.format.title !=undefined){
					// Plot. These don't have a title attribute.
					cfD3Contour2d.resizing.plotOnExternalChange(ctrl)
					
				} else {
					// Contour
					
					let contourPlot = d3.select(ctrl.format.parent)
					let contourPlotCtrl = contourPlot.data()[0]
					
					cfD3Contour2d.resizing.plotOnInternalChange(contourPlotCtrl)
					
				} // if
				
				
				
			}, // refreshContainerSize

			// Colorbar group
			rightControls: {
				// Move everything related to the right controls here!!
				update: function update(ctrl){
					
					let c = ctrl.format.rightControls.colorbar
					let s = ctrl.tools.scales
					
					// Needs to primarily update teh colorbar.
					let gBarAxis = c.svg.select("g.gBarAxis")
					gBarAxis.call( d3.axisLeft( s.val2px ) )
					
					
					// Update the threshold indicator positions.
					c.svg.select("g.gBarLevels").selectAll("rect")
					  .data( ctrl.data.domain.thresholds )
				      .attr("y", d => s.val2px(d) )
				      
					// Update the contour data. For this the levels need to be recalculated.
					ctrl.data.plotted.forEach(function(item){
						item.levels = cfD3Contour2d.draw.json2contour(item.data.vals.surfaces, ctrl.data.domain.thresholds)
					})
					
					// Update teh contour graphics.
					cfD3Contour2d.draw.cards(ctrl)
					
					
				}, // update
				
				
				histogramBrushMove: function histogramBrushMove(ctrl){
					
					let s = ctrl.tools.scales
					let extent = d3.event.selection.map(s.val2px_.invert, s.val2px_);
				
				    // Change the colorbar appearance by changing the scale.

					
					// This needs to figure out the new thresholds, and then update all the contours.
					cfD3Contour2d.setupPlot.setupThresholds(ctrl, extent)
					cfD3Contour2d.setupPlot.setupColorbarTools(ctrl)
					
					// Now update the right control group
					cfD3Contour2d.interactivity.rightControls.update(ctrl)
					
				}, // histogramBrushMove
				
				interactivity: {
					
					refreshContainerSize: function refreshContainerSize(rightControlCtrl){
					
						// Has to take the right controls object, and resize the plot. First extract the ctrl for the whole plot, and then resize.
						
						let plotCtrl = rightControlCtrl.format.wrapper.data()[0]
						
						// Resize the plot.
						cfD3Contour2d.resizing.plotOnInternalChange(plotCtrl)
						
						
						// Resize the plot row.
						let plotRowBody = d3.select(plotCtrl.format.parent)
						builder.refreshPlotRowHeight(plotRowBody)
						
					}, // refreshContainerSize
					
					
				}, // interactivity
				
				
				
			}, // rightControls

			// Lasso
			lassoing: function lassoing(ctrl){
				
				var svgOverlay = ctrl.format.wrapper.select("svg.overlay")
				
				var lassoInstance = {
					element: {
						// 'owner': element to attach the lasso to.
						// 'svg'  : where to draw the lasso to
						// 'ref'  : reference for position retrieval
						owner: svgOverlay,
						svg: svgOverlay,
						ref: ctrl.figure
					},
					data: {
						boundary: [],
						getBasisData: function(){ return ctrl.data.plotted; }
					},		
					accessor: {
						// Here the data that is searched after is the position of the card on the screen.
						x: function(d){
							let dx = positioning.dx(ctrl.figure)
							return d.format.position.x + 
								   d.format.position.iw*dx/2
						},
						y: function(d){
							let dy = positioning.dy(ctrl.figure)
							return d.format.position.y + 
								   d.format.position.ih*dy/2
						},
					},
					scales: {
						x: function(x){return x},
						y: function(y){return y}
					},
					preemptive: function(){
						cfD3Contour2d.interactivity.tooltip.tipOff(ctrl)
					},
					response: function(allDataPoints){
						// Highlight the selection
						cfD3Contour2d.helpers.highlight(ctrl, allDataPoints.map(d=>d.task))
						
						// Display the tooltip.
						cfD3Contour2d.interactivity.tooltip.tipOn(ctrl)
					},
				} // lassoInstance
				
				ctrl.tools.lasso = lassoInstance;
				
				lasso.add(lassoInstance)
				
				
			}, // lassoing

			// Use selection
			tooltip: {
		
				add: function add(ctrl){
					// Needs to know where to place the tooltip, and where to store the reference. How should the tooltip be triggered? Only on lasso selection! In that case just tipOn and tipOff must be presented, and should run given a selection of data. The data can them be used to calculate the appropriate position of hte tooltip.
					var f = cfD3Contour2d.interactivity.tooltip.functionality
					var tooltip = ctrl.figure.append("div")
						.attr("class", "contourTooltip")
						.style("display", "none")
						.style("cursor", "pointer")
						
					addButton("stack-overflow", d=>f.pileAndSummarise(ctrl))
					addButton("tags", d=>f.tag(ctrl))
					addButton("close", d=>cfD3Contour2d.interactivity.tooltip.tipOff(ctrl))
					
					
					ctrl.tools.tooltip = tooltip
					
					
					tooltip.datum({
						position: {
							x0: undefined,
							y0: undefined
						}
					})
					
					// Add dragging as well!
					var drag = d3.drag()
						.on("start", function(d){
							let delta = d3.mouse(tooltip.node())
							d.position.x0 = delta[0]
							d.position.y0 = delta[1]
						})
						.on("drag", function(d){
							tooltip
							  .style("left", d3.event.x-d.position.x0 +"px")
							  .style("top", d3.event.y+d.position.y0 +"px")
						})
						.on("end", function(d){
							d.position.x0 = undefined
							d.position.y0 = undefined
						})
					
					tooltip.call(drag)
					
					function addButton(icon, event){
						tooltip.append("button")
						.attr("class", "btn")
						.on("click", event)
					  .append("i")
						.attr("class", "fa fa-" + icon)
						.style("cursor", "pointer")
					} // addButton
				
				}, // add
				
				tipOn: function tipOn(ctrl){
					
					// Position hte tooltip appropriately. Use the lasso boundary to calculate a mean. Crude, but ok.
					
					var n = ctrl.tools.lasso.data.boundary.length
					var position = ctrl.tools.lasso.data.boundary.reduce(function(total, item){
						total.x += item.cx / n
						total.y += item.cy / n
						return total
					},
					{
						x: 0,
						y: 0
					})
					
					// Offset by the expected tooltip size. How to calculate that when display:none?
					ctrl.tools.tooltip
					  .style("display", "")
					  .style("left", (position.x-100) + "px")
					  .style("top",  (position.y-30) + "px")
					  
				}, // tipOn
						
				tipOff: function tipOff(ctrl){
					ctrl.tools.tooltip.style("display", "none")
				}, // tipOff
						
				functionality: {
							
					pileAndSummarise: function pileAndSummarise(ctrl){
					
						console.log("Pile and calculate standard deviation plot")
						
						// Call to make the pile.
						cfD3Contour2d.interactivity.piling.pile(ctrl)
						
						// Remove the tooltip? And add the functionality to highlight the members to the pile!
						
						
						cfD3Contour2d.interactivity.tooltip.tipOff(ctrl)
						
						
						
					}, // pileAndSummarise
					
					tag: function tag(ctrl){
						console.log("Run tagging interface")
					}, // tag
				
				} // functionality
				
			}, // tooltip

			// Introduce piling
			piling: {
	
				pile: function pile(ctrl){
				
					let p = cfD3Contour2d.interactivity.piling
					
					// Collect the contour plots from hte lasso, pile them up, and draw the piler.
					var selectedCards = ctrl.tools.lasso.data.selection
					
					// These must be recognised by the lasso!
					var selectedPiles = p.findPilesInLasso(ctrl)
					
					
					if(selectedPiles.length > 1){
						// There are several piles in the selection.
						// Well, in this case combine them all in a new pile, which contains all the constituent elements. And remove the old piles.
						
						selectedPiles.remove()
						
						p.makePile(ctrl.figure, selectedCards)
						
					} else if(selectedPiles.length == 1){
						// Exactly one pile selected -> add all the members to it, and consolidate in the existing pile.
						
						// The input to updatePile is a single d3.select(".pileWrapper")
						p.updatePile(selectedPiles[0], selectedCards)
					
					} else {
						// No piles in the selection. If there is more than one card selected, then create a pile for it.
						if(selectedCards.length > 1){
						
							p.makePile(ctrl.figure, selectedCards)
						
						} // if
						
					} // if		
				
				
				}, // pile
				
				unpile: function unpile(pileCtrl){
					// Return the contours to where they're supposed to be. Maybe this should be an external function? So that I can pass in a cutom positioning...
					console.log("Reposition cards.")
					
					// Remove the pile
					pileCtrl.wrapper.remove()
				}, // unpile
				
				makePile: function makePile(container, selectedCards){
					
					let i = cfD3Contour2d.interactivity
					
				
					// Calculate the pile position.
					var pileCtrl = i.piling.createPileObject(container, selectedCards)
					
					// Draw a pile over it.
					i.piling.drawPile(pileCtrl)
					
					// Consolidate the constituent cards
					i.piling.consolidatePile(pileCtrl)
				
					// Calculate the group statistics
					i.piling.statisticsPlots(pileCtrl)
					
					// Draw the stat plots.
					i.statistics.drawMu(pileCtrl)
				
				}, // makePile
				
				updatePile: function updatePile(selectedPile, selectedCards){
					
					let p = cfD3Contour2d.interactivity.piling
				
					var pileCtrl = selectedPile.datum()
						
					// Assign all the cards to the pile
					pileCtrl.members = selectedCards
						
					// Move them all to a pile
					p.consolidatePile(pileCtrl)
						
					// Raise the pile object.
					pileCtrl.wrapper.raise()
				
				}, // updatePile
			
				drawPile: function drawPile(ctrl){
					// Needs to have the position it draws to, and the cards it will contain.
					let s = cfD3Contour2d.interactivity.statistics
					let p = cfD3Contour2d.interactivity.piling
					let dx = positioning.dx(ctrl.container)
					let dy = positioning.dx(ctrl.container)
					let dw = ctrl.iw*dx/ctrl.members.length
					let width = 2*ctrl.iw*dx
					let height = ctrl.ih*dy 
					
					// For now just draw a card and add dragging to it.
					ctrl.wrapper = ctrl.container
					  .append("div")
					  .datum(ctrl)
						.attr("class", "pileCard pileWrapper")
						.style("position", "absolute")
						.style("left", d=>d.x+"px")
						.style("top", d=>d.y+"px")
						
					var pileTitle = ctrl.wrapper.append("div")
						.attr("class", "pileTitle")
						

						
					p.addRoundButton(pileTitle, p.unpile, "times")
					p.addRoundButton(pileTitle, p.maximise, "arrows-alt")	
					p.addRoundButton(pileTitle, p.highlight, "lightbulb-o")
					p.addRoundButton(pileTitle, s.drawSigma, "&sigma;")	
					p.addRoundButton(pileTitle, s.drawMu, "&mu;")
						
						
				
					var svg = ctrl.wrapper
					  .append("div")
					    .attr("class","pileBody")
					  .append("svg")
						.attr("class", "plotArea")
						.attr("width", width)
						.attr("height", height)
						
					// This is the sigma/mu plot
					p.drawCard(ctrl.members[0], ctrl)
					
					
					// Append a viewon element for each of the members. It should be 5px wide.
					svg.selectAll("rect.preview")
					  .data(ctrl.members)
					  .enter()
					  .append("rect")
						.attr("class", "preview")
						.attr("width", dw)
						.attr("height", height)
						.attr("x", (d,i)=>width/2+i*dw)
						.attr("fill", "Gainsboro")
						.on("mouseover", function(d){
							// Raise.
							d.format.wrapper.raise()
						})
						.on("mouseout", function(d){
							// Raise the wrapper.
							ctrl.wrapper.raise()
						})
						
					// Position: absolute is somehow crucial to make thedragging smooth at the start!
					let drag = d3.drag()
						.on("start", function(d){
							let position = d3.mouse(d.container.node())
						
							d.delta.x = position[0]
							d.delta.y = position[1]
							
						})
						.on("drag", function(d){
							let position = d3.mouse(d.container.node())
							
							
							d.x += position[0] - d.delta.x
							d.y += position[1] - d.delta.y
						
							d.wrapper
							  .style("left", d.x + "px")
							  .style("top", d.y + "px")
							  
							d.delta.x = position[0]
							d.delta.y = position[1]
							  
							// Move also all the members.
							p.consolidatePile(d)
						})
						.on("end", function(d){
							// Fix into grid positions?
						})
						
					ctrl.wrapper.call(drag)
					
					
				}, // drawPile
				
				addRoundButton: function addRoundButton(container, event, icon){
						// Greek letters will contain a "&", so parse for it.
						let class_ = "fa fa-" + icon
						let html_ = ""
						if(icon.search("&") > -1){
							class_ = "text-greek-button"
							html_ = icon
						} // if
						
						container
						  .append("button")
							.attr("class", "btn btn-circle")
							.on("click",event)
						  .append("i")
							.attr("class", class_)
							.html(html_)
							
						
				}, // addRoundButton
				
				drawCard: function drawCard(d, pileCtrl){
					// Draws a card that will hold the statistics plots.
					
					let offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl)
					
					let cards = pileCtrl.wrapper.select("div.pileBody").selectAll(".card")
						.data([d])
					
					cards.join(
					  enter => enter.append("div")
						.attr("class", "card summaryWrapper")
						.style("position", "absolute")
						.style("background-color", "white")
						.style("left", "0px" )
						.style("top", offset.y + "px" )
						.each(function(d){
							
							let card = d3.select(this)
							
			    
							// Set the width of the plot, and of the containing elements.
							card
							  .style(     "width", d.format.position.w + "px" )
							  .style( "max-width", d.format.position.w + "px" )
							  .style(    "height", d.format.position.h + "px" )
						  
							// Append the title div. Enforce a 24px height for this div.
							let title = card.append("div")
							  .attr("class", "title")
							  .append("p")
							  .style("text-align", "center")
							  .style("margin-left", "5px")
							  .style("margin-right", "5px")
							  .style("margin-bottom", "8px")
							  .text( "Sigma" )
							  
							  
							helpers.fitTextToBox(title, title, "height", 24)
										  
							// Append the svg
							card.append("svg")
								.attr("class", "plotArea")
								.attr("width",  d.format.position.sw)
								.attr("height", d.format.position.sh )
								.style("fill", "smokewhite")
								.style("display", "block")
								.style("margin", "auto")
							  .append("g")
								.attr("class", "contour")
								.attr("fill", "none")
								.attr("stroke", "#fff")
								.attr("stroke-opacity", "0.5")
						}),
					  update => update
						.each( d => cfD3Contour2d.draw.contours(d) ),
					  exit => exit.remove()
					)
					
				}, // drawCard
				
				redrawPile: function redrawPile(ctrl){
					// Needs to have the position it draws to, and the cards it will contain.
					let dx = positioning.dx(ctrl.container)
					let dy = positioning.dx(ctrl.container)
					let h = ctrl.ih*dy
					let w = ctrl.iw*dx
					let dw = ctrl.iw*dx / ctrl.members.length
					

					var svg = ctrl.wrapper.select("svg.plotArea")
						.attr("width", 2*w)
						.attr("height", h)
						
						
					// Append a viewon element for each of the members. It should be 5px wide.
					svg.selectAll("rect.preview")
					  .data(ctrl.members, d=>d.task.taskId)
					  .enter()
					  .append("rect")
						.attr("class", "preview")
						.attr("width", dw)
						.attr("height", h)
						.attr("x", (d,i)=>w + i*dw)
						.attr("fill", "Gainsboro")
						.on("mouseover", function(d){
							// Raise.
							d.format.wrapper.raise()
						})
						.on("mouseout", function(d){
							// Raise the wrapper.
							ctrl.wrapper.raise()
						})
					
					
					// Redo the statistics plot too.
					let s = cfD3Contour2d.interactivity.statistics
					switch(ctrl.statistics.plotted){
						case "mu":
							s.drawMu(ctrl)
							break;
							
						case "sigma":
							s.drawSigma(ctrl)
							break;
							
						default:
							break;
							
					} // switch
					
				}, // redrawPile
							
				consolidatePile: function consolidatePile(pileCtrl){
				
					// The card hosts the pile title
					let offset = cfD3Contour2d.interactivity.piling.calculateOffset(pileCtrl)
				
					// Move the cards to the pile position.
					pileCtrl.members.forEach(function(d, i){
						// When doing this they should also be resized, and redrawn if necessary.
						let position = d.format.position
						// Stagger them a bit?
						position.x = pileCtrl.x + offset.x
						position.y = pileCtrl.y + offset.y
						
						// Move the wrapper
						d.format.wrapper
							.style("left", position.x + "px")
							.style("top", position.y + "px")
							.style("border-width", "")
						    .style("border-style", "")
						    .style("border-color", "")
							.raise()
							
						// Resize the wrapper if needed.
						if((position.iw != pileCtrl.iw) || 
						   (position.ih != pileCtrl.ih)){
							   
							let dx = positioning.dx(pileCtrl.container)
							let dy = positioning.dy(pileCtrl.container)
							position.iw = pileCtrl.iw
							position.ih = pileCtrl.ih
							let width = position.iw*dx
							let height = position.ih*dx
							
							d.format.wrapper
							  .style("max-width", width + "px")
							  .style("width"    , width + "px" )
							  .style("height"   , height + "px" )
							  
							d.format.wrapper.select("div.card")
							  .style("max-width", width + "px")
							  .style("width"    , width + "px" )
							  .style("height"   , height + "px" )
							
							
							// UPDATE THE PLOT
							cfD3Contour2d.resizing.contourCard(d)
							cfD3Contour2d.draw.contours(d)
						
						} // if
						
					})
					
					pileCtrl.wrapper.raise()
				
				}, // consolidatePile
				
				createPileObject: function createPileObject(container, cardCtrls){
			
					let dx = positioning.dx(container)
					let dy = positioning.dy(container)
			
					var pileCtrl = {
						x: 0,
						y: 0,
						iw: Infinity,
						ih: Infinity,
						delta: {
							x: undefined,
							y: undefined
						},
						container: container,
						wrapper: undefined,
						members: cardCtrls,
						statistics: {
							  mu: undefined,
						   sigma: undefined
						}
					}
					
				
					var n = pileCtrl.members.length
					var position = pileCtrl.members.reduce(function(total, item){
						let pos = item.format.position
						total.x += pos.ix*dx/n
						total.y += pos.iy*dy/n
						
						if(total.iw*total.ih > pos.iw*pos.ih){
							total.iw = pos.iw
							total.ih = pos.ih
						} // if
						
						return total
					}, pileCtrl )
				
					return position
				
				}, // createPileObject
				
				calculateOffset: function calculateOffset(pileCtrl){
					
					var titleDom = pileCtrl.wrapper.select(".pileTitle").node()
					var bodyDom = pileCtrl.wrapper.select(".pileBody").node()
					let titleHeight = titleDom.offsetHeight
					let titleMargin = 
					parseInt(window.getComputedStyle(titleDom).marginBottom) + 
					parseInt(window.getComputedStyle(titleDom).marginTop)
					let bodyMargin = parseInt(window.getComputedStyle(bodyDom).padding)
					
					return {
						x: bodyMargin,
						y: titleHeight + titleMargin + bodyMargin
					}
				}, // calculateOffset
				
				addCardToPile: function addCardToPile(cardCtrl, pileCtrl){
					let p = cfD3Contour2d.interactivity.piling
					pileCtrl.members.push(cardCtrl)
					p.consolidatePile(pileCtrl)
					p.statisticsPlots(pileCtrl)
					p.redrawPile(pileCtrl)
					
				}, // addCardToPile
			
				isCardOverPile: function isCardOverPile(cardCtrl, pileCtrl){
					
					let height = pileCtrl.wrapper.node().offsetHeight
					let posy = cardCtrl.format.position.y - pileCtrl.y 
					
					let width = pileCtrl.wrapper.node().offsetWidth
					let posx = cardCtrl.format.position.x - pileCtrl.x 
 
					let isInsideWidth = ( posx > 0) &&
								        ( posx < width)
					
					let isInsideHeight = ( posy > 0) &&
								         ( posy < height)

					
					return (isInsideWidth && isInsideHeight) ? posx : false
					
				}, // isCardOverPile
				
				findAppropriatePile: function findAppropriatePile(cardCtrl, pileCtrls){
					
					let p = cfD3Contour2d.interactivity.piling
					let pileCtrl = undefined
					let dst = Infinity
					
					pileCtrls.forEach(function(pileCtrl_){
						let dst_ = p.isCardOverPile(cardCtrl, pileCtrl_)
						
						if( (dst_ != false) && (dst_ < dst)){
							pileCtrl = pileCtrl_
							dst = dst_
						} // if
					}) // each
					
					if(pileCtrl != undefined){
						p.addCardToPile(cardCtrl, pileCtrl)
					} // if
					
				}, // findAppropriatePile
				
				findPilesInLasso: function findPilesInLasso(ctrl){
					
					var dx = positioning.dx(ctrl.figure)
					var dy = positioning.dy(ctrl.figure)
					
					var pileCtrls = ctrl.figure.selectAll(".pileWrapper").data()
					
					var selectedPiles = pileCtrls.filter(function(pileCtrl){
						
						var pileMidpoint = {
							x: pileCtrl.x + pileCtrl.iw*dx,
							y: pileCtrl.y + pileCtrl.ih*dy
						}
						
						return lasso.isPointInside( pileMidpoint, ctrl.tools.lasso.data.boundary )
						
					}) // forEach
					
					return selectedPiles
					
				}, // findPileInLasso
				
				statisticsPlots: function statisticsPlots(pileCtrl){
					
					let i = cfD3Contour2d.interactivity
					

					// Calculate the statistics.
					i.statistics.mean(pileCtrl)
					i.statistics.standardDeviation(pileCtrl)
					

				}, // statisticsPlots
				
				highlight: function highlight(pileCtrl){
					
					crossPlotHighlighting.on(pileCtrl.members.map(d=>d.task), "cfD3Contour2d")
					
				}, // highlight
				
				maximise: function maximise(pileCtrl){
					
					// Assign the pile for trending
					let ctrl = pileCtrl.container.datum()
					ctrl.tools.trending = pileCtrl
					
					
					// Make the trending tools visible.
					let trendingCtrlGroup = d3.select( ctrl.format.wrapper.node() )
					  .select("div.plotTitle")
					  .select("div.trendingCtrlGroup")
					trendingCtrlGroup
						.style("display", "inline-block")
						
						
						
					// The buttons also need access to the right pile
					trendingCtrlGroup.selectAll("button")
						.datum(pileCtrl)
					
					// Hide the piles
					pileCtrl.container
					  .selectAll("div.pileWrapper")
					    .style("display", "none")
					
					
					// Hide / Re-position the contours
					var contourCtrls = pileCtrl.container.selectAll("div.contourWrapper").data()
					
					contourCtrls.forEach(function(d){
						if(pileCtrl.members.includes(d)){
							
						} else {
							d.format.wrapper.style("display", "none")
						} // if
					}) // forEach
					
				}, // maximise
				
				minimise: function minimise(pileCtrl){
					
					// Make the trending tools visible.
					let trendingCtrlGroup = d3.select( pileCtrl.container.datum().format.wrapper.node() )
					  .select("div.plotTitle")
					  .select("div.trendingCtrlGroup")
					
					trendingCtrlGroup
						.style("display", "none")
						
					pileCtrl.container
					  .selectAll("div.contourWrapper")
					  .style("display", "")
					  
					pileCtrl.container
					  .selectAll("div.pileWrapper")
					  .style("display", "")
					  
					pileCtrl.wrapper.style("display", "")
					cfD3Contour2d.interactivity.piling.consolidatePile(pileCtrl)
					
				}, // minimise
				
			}, // piling
	
	
			dragging: {
				
				make: function(ctrl){
					// Makes the dragging ctrl required by positioning.dragSmooth
					
					
					/*
					ctrl = {
						wrapper: accessor to the wrapper
						container: bounding element
						onstart: on-start event
						onmove: on-move event
						onend: on-end event
						position: position accessor
					}
					*/
					
					let dragCtrl = {
						
						wrapper: function(d){
							return d.format.wrapper
						},
						container: ctrl.figure,
						onstart: function(d){
							d.format.wrapper.raise()
						},
						onmove: function(d){
							// Check if the container needs to be resized.
							
							cfD3Contour2d.resizing.plotOnInternalChange(ctrl)
							
						},
						onend: function(d){
							
							let i = cfD3Contour2d.interactivity
							
							// Check if the card should be added to a pile.
							i.piling.findAppropriatePile(d, ctrl.figure.selectAll(".pileWrapper").data())
							
							// Update the correlations if trending tools are  active.
							let trendingCtrlGroup = ctrl.format.wrapper
							  .select("div.plotTitle")
							  .select("div.trendingCtrlGroup")
							  
							if( trendingCtrlGroup.style("display") != "none" ){
								// Here we can actually pass the pileCtrl in!
								i.statistics.drawCorrelation(trendingCtrlGroup)
								
							} // if
						},
						position: function(d){
							return d.format.position
						}
					}	
					
					
					
					return positioning.dragSmooth(dragCtrl)	
					
					
				} // add
				
			}, // dragging
	
			statistics: {
				
				draw: function draw(pileCtrl, statContour){
					
					pileCtrl.wrapper
					  .select("div.pileBody")
					  .select("div.summaryWrapper")
					  .each(function(d){
						  
						  // Has to be designed to ensure units are kept.
						  
						  let svg = d.wrapper
						    .select("div.pileBody")
							.select("div.summaryWrapper")
							.select("svg")
							
						  // The svg defineds the range, so change the domain.
						  cfD3Contour2d.interactivity.statistics.design(svg, statContour)
					      
						  let projection = cfD3Contour2d.draw.projection(statContour)
							
						  svg
						    .select("g.contour")
						    .selectAll("path")
						    .data(statContour.levels)
						    .join(
							  enter => enter
							    .append("path")
								  .attr("fill", statContour.format.color )
								  .attr("d", projection ),
							update => update
								  .attr("fill", statContour.format.color )
								  .attr("d", projection ),
							exit => exit.remove()
						  )
						  
					})
					
					
				}, // draw
				
				
				design: function design(svg, statContour){
					
					let f = statContour.format
					
					let xdiff = f.domain.x[1] - f.domain.x[0]
					let ydiff = f.domain.y[1] - f.domain.y[0]
					
					let arX = (xdiff)/ f.position.sw
					let arY = (ydiff)/ f.position.sh
					
					// Larges AR must prevail - otherwise the plot will overflow.
					if(arX > arY){
						let padding = arX*f.position.sh - ydiff
						f.domain.y = [f.domain.y[0] - padding/2,
									  f.domain.y[1] + padding/2]
					} else {
						let padding = arY*f.position.sw - xdiff
						f.domain.x = [f.domain.x[0] - padding/2,
									  f.domain.x[1] + padding/2]
					} // if
					
					
					
				}, // design
				
				
				drawMu: function drawMu(pileCtrl){
					
					pileCtrl.statistics.plotted = "mu"

					// Change the title
					pileCtrl.wrapper
					  .select("div.summaryWrapper")
					  .select("div.title")
					  .select("p")
					  .html("μ")
					
					// Change the contours
					cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.mu)
					
				}, // drawMu
				
				drawSigma: function drawSigma(pileCtrl){
					
					pileCtrl.statistics.plotted = "sigma"
					
					pileCtrl.wrapper
					  .select("div.summaryWrapper")
					  .select("div.title")
					  .select("p")
					  .html("σ")
					
					cfD3Contour2d.interactivity.statistics.draw(pileCtrl, pileCtrl.statistics.sigma)
					
				}, // drawSigma
				
				drawCorrelation: function drawCorrelation(trendingCtrlGroup){
					
					let i = cfD3Contour2d.interactivity
					
					// Get the scores
					var scores = i.statistics.correlation(trendingCtrlGroup.datum().tools.trending )
					
					// Get a palette
					var score2clr = d3.scaleLinear()
						.domain([0,1])
						.range([0, 0.75])
					
					 
  

					
					trendingCtrlGroup.selectAll("select").each(function(){
						
						// Determine if it's x or y select
						let axis = d3.select(this).attr("axis")
						
						var color = d=>d3.interpolateGreens(score2clr(Math.abs(d.score[axis])))
						
						d3.select(this)
						  .selectAll("option")
						  .data( scores )
						  .join(
						    enter => enter
							  .append("option")
							    .attr("value", d=>d.name)
								.html(d=>d.label[axis])
								.style("background-color", color),
							update => update
								.attr("value", d=>d.name)
								.html(d=>d.label[axis])
								.style("background-color", color),
							exit => exit.remove()
						  )
					})
					
				}, // drawCorrelation
				
				
				mean: function mean(pileCtrl){

					let tasks = pileCtrl.members
				    let mu, domain_
				    let n = tasks.length
				  
				    // calculate mean
				    tasks.forEach(function(task){
					  let d= task.data.vals.surfaces
					
					  if(mu == undefined){
					  
					  mu = {x: d.x.map(function(x){ return x/n }), 
							y: d.y.map(function(y){ return y/n }), 
							v: d.v.map(function(v){ return v/n }), 
							size:  d.size}
					  
					  } else {

					    d.x.forEach((d_,i)=> mu.x[i] += d_/n)
					    d.y.forEach((d_,i)=> mu.y[i] += d_/n)
					    d.v.forEach((d_,i)=> mu.v[i] += d_/n)
					  
					  
					  } // if
					}) // forEach
 
					
							
					let plotCtrl = d3.select(pileCtrl.wrapper.node().parentElement).datum()
					let svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg")
					
							
					// Create a statistics output:
				    pileCtrl.statistics.mu = {
						filename: "mean@obs",
					    data: {vals: {surfaces: mu}},
						levels: cfD3Contour2d.draw.json2contour(mu, plotCtrl.data.domain.thresholds),
					    task: {taskId: "μ"},
					    format: {
							wrapper: svg,
							position: {
								sh: parseFloat( svg.attr("height") ),
								sw:  parseFloat( svg.attr("width") )
							},
							domain: {
								x: [d3.min(mu.x), d3.max(mu.x)],
							    y: [d3.min(mu.y), d3.max(mu.y)],
							    v: [d3.min(mu.v), d3.max(mu.v)] 
							},
							color: function(d){
								return plotCtrl.tools.scales.val2clr(d.value)
							}
						}
					}
				  

				}, // mean
				
				standardDeviation: function(pileCtrl){
				 
					let tasks = pileCtrl.members
					let mean = pileCtrl.statistics.mu
					let mu = mean.data.vals.surfaces
				    let sigma
				    let n = tasks.length
				  
				    // calculate standard deviation based on the mean.
				    tasks.forEach(function(task){
					  let t = task.data.vals.surfaces
					  if(sigma == undefined){
					    sigma = {x: mu.x, 
							     y: mu.y, 
							     v: t.v.map( (d,i)=> 
									1/(n-1)*(d - mu.v[i])**2 
								 ), 
							  size: mu.size}
					  } else {
					    t.v.forEach( (d,i)=> 
						  sigma.v[i] += 1/(n-1)*(d - mu.v[i])**2 
						)
					  } // if
					  
				    }) // forEach
					
					
					let svg = pileCtrl.wrapper.select("div.pileBody").select("div.summaryWrapper").select("svg")
					
					
					// Use another way to calculate
					let domain = d3.extent(sigma.v)
					let thresholds = d3.range(domain[0], domain[1], (domain[1] - domain[0])/7)
				

				    // Create a statistics output:
				    pileCtrl.statistics.sigma = {
						filename: "stdev@obs",
					    data: {vals: {surfaces: sigma}},
						levels: cfD3Contour2d.draw.json2contour(sigma, thresholds),
					    task: {taskId: "σ"},
					    format: {
							wrapper: svg,
							position: {
								sh: parseFloat( svg.attr("height") ),
								sw:  parseFloat( svg.attr("width") )
							},
							domain: {
							  x: mean.format.domain.x,
							  y: mean.format.domain.y,
							  v: d3.extent(sigma.v),
							  size: mean.format.domain.size 
						    },
							color: function(d){
								let val2clr = d3
								  .scaleSequential(d3.interpolateViridis)
								  .domain( d3.extent( thresholds ) )
								
								return val2clr(d.value)
							}
						}
					}

				}, // standardDeviation
				
				
				correlation: function correlation(pileCtrl){
				    // Given some on-screen order show the user which variables are most correlated with it.
					let s = cfD3Contour2d.interactivity.statistics
				  
				    // Order is based given the left edge of the contour. The order on the screen is coordinated with the sequential order in contours.tasks in 'dragMove', and in 'ordering'.
				    
				  
				    let scores = dbsliceData.data.dataProperties.map(function(variable){
						// For each of the data variables calculate a correlation.
						
						
						// Collect the data to calculate the correlation.
						let d = pileCtrl.members.map(function(contour){
						  return {x: contour.format.position.x,
								  y: contour.format.position.y,
								  var: contour.task[variable]
								 }
						}) // map
						
						// Get Spearman's rank correlation scores for the order in the x direction.
						// (https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient)
						
						// The coefficient is
						// covariance (x_rank, y_rank ) / ( sigma(rank_x) sigma(rank_y) )
						
						let cov = s.covariance(d)
						let sigma_x   = d3.deviation(d, d=>d.x)
						let sigma_y   = d3.deviation(d, d=>d.y)
						let sigma_var = d3.deviation(d, d=>d.var)
						
						sigma_x = sigma_x == 0 ? Infinity : sigma_x
						sigma_y = sigma_y == 0 ? Infinity : sigma_y
						sigma_var = sigma_var == 0 ? Infinity : sigma_var
						
						let score = {
							x: cov.x / ( sigma_x*sigma_var ),
							y: cov.y / ( sigma_y*sigma_var )
						}
						
						let label = {
							x: score.x < 0 ? "- " + variable : "+ " + variable,
							y: score.y < 0 ? "- " + variable : "+ " + variable,
						}
						
						return {
							name: variable, 
							label: label,
							score: score
						}
				    }) // map
				  
				  // Before returning the scores, order them.
				  scores.sort(function(a,b){return a.score - b.score})
				  
				  return scores
				  
				}, // correlation
				
				
				covariance: function covariance(d){

				    // 'd' is an array of observations. Calculate the covariance between x and the metadata variable.
				    let N = d.length
				    let mu_x = d3.sum(d, d=>d.x) / N
					let mu_y = d3.sum(d, d=>d.y) / N
				    let mu_var = d3.sum(d, d=>d.var) / N
				  
				  
				    var sumx = 0;
					var sumy = 0;
				    for(var i=0; i< N; i++) {
						sumx += ( d[i].x - mu_x )*( d[i].var - mu_var );
						sumy += ( d[i].y - mu_y )*( d[i].var - mu_var );
				    }
				  
				    return {
						x: 1/(N - 1)*sumx,
						y: 1/(N - 1)*sumy
					}

				} // covariance
				
			}, // statistics
	
			sorting: {
				
				x: function x(ctrl, variable){
					
					let dx = positioning.dx(ctrl.figure)
					let dy = positioning.dy(ctrl.figure)
					
					// Find the appropriate metadata, and the range to plot it to.
					let vals = ctrl.tools.trending.members.map(d=>d.task[variable])
					
					let range = cfD3Contour2d.interactivity.sorting.getRange(ctrl)
					
					// Create a scale
					let scale = d3.scaleLinear()
					  .domain( d3.extent(vals) )
					  .range( range.x )
					  
					// Position the contours.
					ctrl.tools.trending.members.forEach(function(d){
						
						let x = scale( d.task[variable] )
						
						d.format.position.x = x
						d.format.position.ix = Math.floor( x/dx )
						
						d.format.wrapper.style("left", x + "px")
					})
					
				}, // x
				
				y: function y(ctrl, variable){
					
					let dx = positioning.dx(ctrl.figure)
					let dy = positioning.dy(ctrl.figure)
					
					// Find the appropriate metadata, and the range to plot it to.
					let vals = ctrl.tools.trending.members.map(d=>d.task[variable])
					
					let range = cfD3Contour2d.interactivity.sorting.getRange(ctrl)
					
					// Create a scale
					let scale = d3.scaleLinear()
					  .domain( d3.extent(vals) )
					  .range( range.y )
					  
					// Position the contours.
					ctrl.tools.trending.members.forEach(function(d){
						
						let y = scale( d.task[variable] )
						
						d.format.position.y = y
						d.format.position.iy = Math.floor( y/dy )
						
						d.format.wrapper.style("top", y + "px")
					})
					
				}, // y
				
				getRange: function getRange(ctrl){
					
					let height = ctrl.figure.node().offsetHeight
					let width = ctrl.figure.node().offsetWidth
					
					let maxCardHeight = d3.max( ctrl.tools.trending.members.map(d=>d.format.position.h) )
					let maxCardWidth = d3.max( ctrl.tools.trending.members.map(d=>d.format.position.w) )
					
					return {
						x: [0, width - maxCardWidth],
						y: [0, height - maxCardHeight]
					}
					
				}, // getRange
				
			}, // sorting
	
		}, // interactivity
		
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
				    plotFunc: cfD3Contour2d,
					figure: undefined,
					svg: undefined,
					grid: {nx: 12},
					data: {plotted: [],
						   promises: [],
					       requested: [],
						   available: [],
						   duplicates: [],
					       missing : [],
						   compatible: [],
						   incompatible: [],
						   intersect: [],
						   domain: {
							   x: undefined,
							   y: undefined,
							   v: undefined,
							   ar: undefined,
							   thresholds: undefined,
							   nLevels: undefined,
						   },
						   processor: importExport.importing.contour2d
					       },
					view: {sliceId: undefined,
					       options: [],
						   viewAR: NaN,
						   dataAR: NaN,
						   xVarOption: undefined,
						   yVarOption : undefined,
						   cVarOption : undefined,
						   transitions: {
								duration: 500,
								updateDelay: 0,
								enterDelay: 0								
							   },
						   t: undefined
						   },
					tools: {
							scales: {
								px2clr: undefined,
								val2clr: undefined,
								val2px: undefined,
								val2px_: undefined,
								bin2px: undefined
							},
							lasso: {
								points: [],
								tasks: []
							},
							tooltip: undefined,
							trending: undefined
						},
					format: {
						title: "Edit title",
						parent: undefined,
						wrapper: undefined,
						position: {
							ix: 0,
							iy: 0,
							iw: 12,
							ih: 4,
							minH: 290,
							minW: 340,
							titleHeight: undefined,
							plotHeight: undefined,
							plotWidth: undefined,
							rightControlWidth: 170
						},
						rightControls: {
							plotFunc: cfD3Contour2d.interactivity.rightControls,
							grid: {nx: 1},
							format: {
								parent: undefined,
								wrapper: undefined,
								position: {
									ix: 0,
									iy: 0,
									iw: 12,
									ih: undefined							
								},
							},							
							colorbar: {
								margin: {top: 20, bottom: 20, left: 10, right: 5},
								svg: undefined,
								height: undefined,
								width: undefined,
								x: undefined,
								y: undefined,
							}, // colorbar
							histogram: {
								margin: {top: 20, bottom: 20, left: 5, right: 10},
								svg: undefined,
								height: undefined,
								width: undefined,
								x: undefined,
								y: undefined,
								bins: undefined
							} // histogram
						}
					}
				} // ctrl
				
				
				return ctrl
			
			}, // createDefaultControl
		
			createLoadedControl: function createLoadedControl(plotData){
				
				var ctrl = cfD3Contour2d.helpers.createDefaultControl()
				
				// If sliceId is defined, check if it exists in the metadata. If it does, then store it into the config.
				if(plotData.sliceId != undefined){
					// Needs to check the slice properties that this plot cal draw. 
					if(dbsliceData.data.contour2dProperties.includes(plotData.sliceId)){
						ctrl.view.sliceId = plotData.sliceId
					} // if
				} // if
				
				
				ctrl.format.title = plotData.title
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
		

			// Functions supporting cross plot highlighting
			unhighlight: function unhighlight(ctrl){
				
				ctrl.figure
				  .selectAll("div.contourWrapper")
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // unhighlight
			
			highlight: function highlight(ctrl, allDataPoints){
				
				// Udate the boundary.
				var allCards = ctrl.figure
				  .selectAll("div.contourWrapper")
				  
				var selectedCards = allCards.filter(function(d){
					  return allDataPoints.includes(d.task)
				})
				
				var others = allCards.filter(function(d){
					  return !allDataPoints.includes(d.task)
				})
				
				
				selectedCards
				  .style("border-width", "4px")
				  .style("border-style", "dashed")
				  .style("border-color", "black")
				
				others
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // highlight
			
			defaultStyle: function defaultStyle(ctrl){
					
				ctrl.figure
				  .selectAll("div.contourWrapper")
				  .style("border-width", "")
				  .style("border-style", "")
				  .style("border-color", "")
				
			}, // defaultStyle
		
			
		
		} // helpers
	
		
	} // cfD3Contour2d
	
	// Plot creation abstract object.
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
					var titleBox = plotHeader
					  .append("div")
					    .attr("class", "title")
						.style("display","inline")
						
						
						
						
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
					
					  
					// Now add the text - this had to wait for hte button to be added first, as it takes up some space.
					titleBox.html(plotCtrl.format.title)
					  .attr("spellcheck", false)
					  .attr("contenteditable", true)
					  .style("cursor", "text")
					  .on("mousedown", function() { d3.event.stopPropagation(); })
					  .each(function(ctrl){
						  this.addEventListener("input", function(){
							  ctrl.format.title = this.innerHTML
						  })
					  })
					  
					  
					  
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
					  .append("g")
					    .attr("class", "exponent")
					  .append("text")
					    .attr("fill", "none")
						.attr("y", "-0.32em")
					  .append("tspan")
					    .html("x10")
					  .append("tspan")
					    .attr("class","exp")
					    .attr("dy", -5)
						
					// Group for the y axis
					svg.append("g")
						.attr( "class", "axis--y")
					  .append("g")
					    .attr("class", "exponent")
					  .append("text")
					    .attr("fill", "none")
						.attr("x", -8)
					  .append("tspan")
					    .html("x10")
					  .append("tspan")
					    .attr("class","exp")
					    .attr("dy", -5)
					  
						
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
					  .select("g.exponent")
					  .select("text")
					    .attr("x", plotWidth - 12)
						
					// Group for the y axis
					svg.select("g.axis--y")
						.attr( "transform", axesTranslate )
						.attr("x", -12)
						.attr("y", 5)
				
						
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
						   .attr("value", function(d){return d})
						   
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
									
							// `this' is the vertical select! 
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
        
        
		helpers: {
			
			formatAxisScale: function formatAxisScale(scale){
				// With a million tasks it is possible that the min and max are more than O(3) different. In that case a logarithmic scale would be better!
				
				
				var dom = scale.domain()
				
				var format = {
					scale: scale,
					exp: undefined,
					fill: undefined
				} // format
				
				// In cases where the exponent of hte min and the exponent of the max are very different, pick the one in between! We're likely only going to be able to handle 1e6 tasks, in which case the most extreme case is minExp = 0, and maxExp = 6. In that case pick the middle value of 3.
				var maxExp = helpers.calculateExponent(dom[1])
				var minExp = helpers.calculateExponent(dom[0])
				format.exp = (maxExp - minExp) > 3 ? 3 : minExp
				
				if (format.exp > 0){
					format.scale = d3.scaleLinear()
						.domain( dom.map(d=>d/10**format.exp) )
						.range( scale.range() )
						
					format.fill = "currentColor"
				} else {
					format.fill = "none"
					format.exp = ""
				} // if
				
				return format
				
			}, // formatExponent
			
			
		}
        	
		
	} // plotHelpers

	
	
	// Coloring and highlighting
	var color = {
		// The color controls should probably be moved to a single location, i.e. a single button on a toolbar somewhere. Maybe create a floating top toolbat to control all general behaviour.
		
		// To perform the task it seems it is the simplest if this variable holds the color palette for all other plots to share. The color change effects need then only change the color palette here. Specifically: this palette will replace ctrl.tools.cscale.
		
		defaultPalette: function defaultPalette(){
			return "cornflowerblue"
		}, // defaultPalette
		
		colorPalette: d3.scaleOrdinal(d3.schemeDark2), // colorPalette
		
		togglePalette: function togglePalette(varName){
			
			// Setup the color function.
			if( color.settings.scheme == undefined){
				// Color scale is set to the default. Initialise a color scale.
			
				// The default behaviour of d3 color scales is that they extend the domain as new items are passed to it. Even if the domain is fixed upfront, the scale will extend its domain when new elements are presented to it.
				color.settings.scheme   = "color"
				color.settings.variable = varName
			} else if (color.settings.variable != varName){
				// The color metadata option has changed. Clear the scale domain so that the scale will be used with the new parameter.
			
				color.colorPalette.domain([])
				color.settings.variable = varName
			} else {
				// The same color option has been selected - return to the default color options.
				color.settings.scheme = undefined
				color.settings.variable = undefined
				color.colorPalette.domain([])
			} // if
			
		}, // togglePalette
		
		// settings holds the flag for the scheme to use, and the variable it is supposed to be used with. 
		settings: { 
		            name: "Colour",
					scheme: undefined,
		          val: undefined,
				  options: undefined,
				  event: function(ctrl, varName){
					  
					// The on-click functionality takes care of the options that are specific to an individual plot. Coloring is cross plot, and therefore must coordinate the menus of several plots. This is done here.
							
					// Update the plot ctrls
					toggleAllColorSubmenuItems()
					
					// If a color option is defined, and this is the option corresponding to it, then make it active.
				  
					
					color.togglePalette(varName)
					
					
					// do the render so that all plots are updated with the color.
					render()
					
					
					function toggleAllColorSubmenuItems(){
						
						
						dbsliceData.session.plotRows.forEach(function(plotRow){
						  plotRow.plots.forEach(function(plot){
							if(plot.view.cVarOption != undefined){
							  
							  // Adjust the plot color value
							  plot.view.cVarOption.val = varName
							
							  // Toggle the html options
							  plot.figure
								.select("div.bottomLeftControlGroup")
								.selectAll("p.submenu-toggle")
								.each(function(){
								  
								  if(this.innerHTML == "Colour"){
									// Color submenu to be adjusted.
									  
									d3.select(this.parentElement)
									  .selectAll("a.submenu-item")
									  .each(function(){
											
										if( this.innerHTML == varName ){
										  this.classList.replace("deselected", "selected")
										} else {
										  this.classList.replace("selected", "deselected")
										} // if
											
									  }) // each
								  } // if
							  }) // each
								  
							} // if
						  }) // forEach
						}) // forEach
						
					} // toggleAllColorSubmenuItems
					  
				  } // event
		},
		
		get: function get(key){
			// Coloring is expected to be done on the categorical variable key basis.
			// Perform any input check on the input key, and return the appropriate color code. So that the colors don't baloon out of control?
			var palette = color.defaultPalette
			
			var colorIsChosen = color.settings.scheme != undefined
			var keyIsValid    = color.settings.val == undefined? false : dbsliceData.data.metaDataUniqueValues[color.settings.val].includes(key)
			
			if( colorIsChosen && keyIsValid ){
				palette = color.colorPalette
			} // if			
			
			return palette(key)
			
		}, // get
		
		
		
	} // crossPlotColoring

	var crossPlotHighlighting = {
			
		on: function on(d, sourcePlotName){
		
			// Functionality:
			//    - highlight points in scatter plots on other plots too on mouseover.
			//    - same for bar plots and histograms?
			
			// The input is a data object. For scatter plots this is the entire line from metadata.csv corresponding to a particular point.
			
			
			// For this datapoint find all other plots that might be interesting, determine what they are plotting, and which variables they are using, collect the elements belonging to the particular datapoint, and highlight it by updating it's style.
			
			// First go through all plot rows to see if there are data.
			
			// Note that different functionality must be allowed for different source and target plots. For each of the available plot types (bar, histogram, scatter, line, contour) for which the on-mouseover effects are required a different functionality might be needed.
			
			// Find all the data that needs to be highlighted.
			var allDataPoints = crossPlotHighlighting.helpers.findAllData(d, sourcePlotName);
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					
					// First all the elements need to be unhiglighted.
					// crossPlotHighlighting.helpers.unHighlightAll(plotDOM, plot);
					plotCtrl.plotFunc.helpers.unhighlight( plotCtrl )
					
					// Now highlight the needed datapoints.
					plotCtrl.plotFunc.helpers.highlight(plotCtrl, allDataPoints);
					
					
				}) // each
				
				
			}); // forEach
		
		}, // on
		
		off: function off(d, sourcePlotName){
		
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					plotCtrl.plotFunc.helpers.defaultStyle( plotCtrl );
				}) // forEach
				
				
			}); // forEach
		
		}, // off
		
		helpers: {
			
			
			findAllData: function findAllData(d, sourcePlotName){
				
				
				var allDataPoints;
			    switch(sourcePlotName){
					
					case "cfD3Scatter":
					    allDataPoints = [d];
					  break;
					  
					case "cfD3BarChart":
						// Collect all the relevant data points. An additional filter needs to be applied here!! DON'T USE crossfilter.filter - IT MESSES UP WITH ORIGINAL FUNCTIONALITY
						//var allPoints = dbsliceData.data.cf.all()
						
						// This should return the data in the filter, as well as the data corresponding to the outline that has the cursor over it. It relies on the fact that when all items are in the filter the filter is in fact empty.
						
						// 
						
						var highlight = true
						
						var varFilter = dbsliceData.data.filterSelected[d.key]
						if(varFilter != undefined){
							
							// FOR NOW: when mousing over rectangles that are not selected only display the data that is already in hte filter. In the future implement a preview, but to do this functionalities of all plots need to be adjusted to contain points for all tasks at all times.
							
							// if:
							// Rect not chosen, but moused over: do nothing
							// Rect chosen,     but moused over: show data corresponding to it
							
							
							
							// mouse over selected item: d.val in filter
							
							// If the filter has some values then some rectangles are active! Highlight the data is the moused over rectangle is one of the active ones.
							var filterHasValues = varFilter.length > 0
							var filterHasRect   = varFilter.includes(d.val)
							
							if( filterHasValues && filterHasRect ){
								highlight = true
							} // if	
						} // if
						
						
						// If highlighting is desired, then find the items in hte current filter that should be highlighted. Otherwise return all the filter contents.
						var allDataPoints = dbsliceData.data.taskDim.top(Infinity)
						if(highlight){
							allDataPoints = allDataPoints.filter(function(p){
								return p[d.key] == d.val
							}) // filter
						} // if
						
						
					  break;
					  
					case "cfD3Line":
						// Collect all the relevant data points by tskId.
						var cfDataPoints = dbsliceData.data.taskDim.top(Infinity)
						allDataPoints = cfDataPoints.filter(function(p){return p.taskId == d.task.taskId});
						
					  break;
					  
					  
					case "cfD3Contour2d":
						// Tasks to be highlighted come directly from the pile.
						allDataPoints = d;
					  
					  					  
					default:
					  break;
				} // switch
				
			  return allDataPoints;
				
			} // findAllData
		}, // helpers
		
		manuallySelectedTasks: function manuallySelectedTasks(){
			
			// Loop through all the plots, and if they have a function that highlights manually selected tasks, run it.
			
			dbsliceData.session.plotRows.forEach(function(plotRow){
				
				// If it has any plots in do the required tasks for them. Plots will always be there, and can be empty, in which case the following loop is skipped.
				plotRow.plots.forEach(function(plotCtrl){
					
					// Check if manually selected tasks need to be included.
					if(plotCtrl.plotFunc.helpers.updateManualSelections != undefined){
						plotCtrl.plotFunc.helpers.updateManualSelections(plotCtrl)
					} // if
					
				}) // each
			}); // forEach
		}, // manuallySelectedTasks
		
	} // crossPlotHighlighting 
		

	// REMOVE DATA CONTROLS STILL USES JQUERY SOMEHOW!!

	// App interactivity
    var addMenu = {

        addPlotControls: {
            
            elementOptionsArray: function(plotRowType){
                
				let d = dbsliceData.data
				
                var options = [{val: "undefined"    , text: " "}];
                switch(plotRowType){
                    case "metadata":
					
						if( existsAndHasElements(d.metaDataProperties) ){
							options.push( {val: "cfD3BarChart" , text: "Bar Chart"} )
						}
						
						if( existsAndHasElements(d.dataProperties) ){
							options.push( {val: "cfD3Scatter"  , text: "Scatter"} )
							options.push( {val: "cfD3Histogram", text: "Histogram"} )
						}
                        break;
                    
                    case "plotter":
					
						if( existsAndHasElements(d.line2dProperties) ){
							options.push( {val: "cfD3Line"     , text: "Line"} )
						}
					
						if( existsAndHasElements(d.contour2dProperties) ){
							options.push( {val: "cfD3Contour2d", text: "2D Contour"} )
						}
					
                        break;
                }; // switch
                
                return options;
				
				
				
				function existsAndHasElements(A){
					let response = false
					if(A){
						response = A.length > 0
					}
					return response
				}
                
            },
                            
            make: function make(ownerButton, containerCtrl){
                
				// Container ctrl is required bcause the plot needs to be pushed into it!!
                
				
				// Create the config element with all required data.
                var config = addMenu.addPlotControls.createConfig(ownerButton, containerCtrl);
			
                // Make the corresponding dialog.
                addMenu.helpers.makeDialog(config);
                
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
				
				// Add the buttons
				addMenu.helpers.addDialogButtons(config)

				// Add the on click event to the dialog owner button
				config.ownerButton.on("click", function(){
					addMenu.helpers.showDialog(config)
				}) // on

                        
                
            }, // make
            
			// Config handling
            createConfig: function createConfig(ownerButton, containerCtrl){
                // ownerButton    - the button that prompts the menu
				// ownerContainer - container to add the menu and button to
				// ownerCtrl      - plot row ctrl to update with user selection
                
                var config = {
					
					f: addMenu.addPlotControls,
					
					position: {
						left: undefined, 
						 top: undefined, 
					   delta: undefined
					},
					
					buttons: [
						{text: "ok"    , onclick: ok    , class: "btn btn-success"},
						{text: "cancel", onclick: cancel, class: "btn btn-danger"}
					],
					
                    userSelectedVariables: ["xProperty", "yProperty", "slice"],
                    
					menuItems: [
						{ variable : "plottype",
						  options  : addMenu.addPlotControls.elementOptionsArray(containerCtrl.type),
                          label    : "Select plot type",
						  event    : addMenu.addPlotControls.onPlotTypeChangeEvent
						}
					],
						
                    newCtrl: {
						plottype  : undefined,
						xProperty : undefined, 
						yProperty : undefined,
						slice     : undefined
					},

					ownerButton: ownerButton,
					ownerCtrl: containerCtrl
                };
				
				// MOVE THESE OUTSIDE
				function ok(dialogConfig){
					
				
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)

					// Add the plot row.
					addMenu.addPlotControls.submitNewPlot(dialogConfig)
					
					// Clear the dialog selection
					addMenu.addPlotControls.clearNewPlot(dialogConfig)
					
					
					// Clear newPlot to be ready for the next addition.
					addMenu.addPlotControls.clearMenu(config);
					
					 // Redraw the screen.
					render();
					
					
					
				} // ok

				function cancel(dialogConfig){
					
					addMenu.addPlotControls.clearNewPlot(dialogConfig)
				
					addMenu.helpers.hideDialog(dialogConfig)
					
					// Clear newPlot to be ready for the next addition.
					addMenu.addPlotControls.clearMenu(config);
					
				} // ok
                

                return config;
                
            }, // createConfig
            
            copyNewPlot:   function copyNewPlot(config){
                // Based on the type of plot selected a config ready to be submitted to the plotting functions is assembled.

                
                
                var plotCtrl = {};
                switch( config.newCtrl.plottype ){
                    
                    case "cfD3BarChart":
					
						
						plotCtrl = cfD3BarChart.helpers.createDefaultControl()
						
						plotCtrl.view.yVarOption.val = config.newCtrl.yProperty
						plotCtrl.view.gVar = config.newCtrl.yProperty
						
					
					  break;
					
                    case "cfD3Histogram":
						
						plotCtrl = cfD3Histogram.helpers.createDefaultControl()
						
						plotCtrl.view.xVarOption.val = config.newCtrl.xProperty
						
						
                      break;
                      
                    case "cfD3Scatter":
						
						
						
						
						// Custom functionality for the d3interactive2axes imposter function is here. The idea is that the ctrl is hidden in 'layout'.
						
						plotCtrl = cfD3Scatter.helpers.createDefaultControl()
						
						plotCtrl.view.xVarOption.val = config.newCtrl.xProperty
						plotCtrl.view.yVarOption.val = config.newCtrl.yProperty
						
						
                      break;
                      
                    case "cfD3Line":
                    
                        // The user selected variable to plot is stored in config.newCtrl, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
                        // Store the currently selected slice, then push everything forward.
                        
                    
                        plotCtrl = cfD3Line.helpers.createDefaultControl()
						
						plotCtrl.view.sliceId = config.newCtrl.slice
						
                      break;
					  
					case "cfD3Contour2d":
                    
                        // The user selected variable to plot is stored in config.newCtrl, with all other user selected variables. However, for this type of plot it needs to be one level above, which is achieved here.
                        // Store the currently selected slice, then push everything forward.
                        
                    
                        plotCtrl = cfD3Contour2d.helpers.createDefaultControl()
						
						plotCtrl.view.sliceId = config.newCtrl.slice
						
                      break;  
					
                      

                    default:
                        break;
                    
                }; // switch

                
                return plotCtrl;
                
            }, // copyNewPlot
            
            clearNewPlot: function clearNewPlot(config){
                
                        config.newCtrl.plottype = undefined;
                        config.newCtrl.xProperty = undefined;
                        config.newCtrl.yProperty = undefined;
                        config.newCtrl.slice = undefined;

            }, // clearNewPlot
			
			submitNewPlot: function submitNewPlot(config){
                
                // IMPORTANT! A PHYSICAL COPY OF NEWPLOT MUST BE MADE!! If newPlot is pushed straight into the plots every time newPlot is updated all the plots created using it will be updated too.
                
				var plotToPush = addMenu.addPlotControls.copyNewPlot(config);
				var plotRow = dbsliceData.session.plotRows.filter(function(plotRowCtrl){
					return plotRowCtrl == config.ownerCtrl
				})[0]
				
				// Position the new plot row in hte plot container.
				positioning.newPlot(plotRow, plotToPush)
				
				
				plotRow.plots.push(plotToPush)
                
                
            }, // submitNewPlot
			
			// Menu functionality
            onPlotTypeChangeEvent: function onPlotTypeChangeEvent(config, selectDOM, variable){
                
				// Update the config.
				config.newCtrl.plottype = selectDOM.value;
				
				// Based on the selection control the other required inputs.
                var a = addMenu.addPlotControls;
                var h = addMenu.helpers;
                
				switch( config.newCtrl.plottype ){
					case "undefined":
					  
					  // Remove all variable options.
					  h.removeMenuItemObject( config, "xProperty" );
					  h.removeMenuItemObject( config, "yProperty" );
					  h.removeMenuItemObject( config, "slice" );

					  break;
					  
					// METADATA PLOTS
					  
					case "cfD3BarChart":
					
					  // yProperty required.
					  h.addUpdateMenuItemObject( config, 'yProperty' , dbsliceData.data.metaDataProperties, "Select y variable");
					  
					  // xProperty must not be present.
					  h.removeMenuItemObject( config, "xProperty" );
					  
					  break;
					  
					case "cfD3Histogram":
					  
					  
					  // xProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty" , dbsliceData.data.dataProperties, "Select x variable");
					  
					  // yProperty must not be present.
					  h.removeMenuItemObject( config, "yProperty" );
					  
					  break;
					  
					case "cfD3Scatter":
					  
					  
					  // xProperty and yProperty required.
					  h.addUpdateMenuItemObject( config, "xProperty", dbsliceData.data.dataProperties, "Select x variable");
					  h.addUpdateMenuItemObject( config, "yProperty", dbsliceData.data.dataProperties, "Select y variable");
					  break;
					  
					  
					// 2D/3D PLOTS
					case "cfD3Line":
					  
					  
					  // slice is required.
					  h.addUpdateMenuItemObject( config, "slice", dbsliceData.data.line2dProperties, "Select slice");
					  break;
					  
					case "cfD3Contour2d":
					  
					  
					  // slice is required.
					  h.addUpdateMenuItemObject( config, "slice", dbsliceData.data.contour2dProperties, "Select 2d contour");
					  break;
					  
					
					  
					default :
					 
					
					  // Remove all variable options.
					  h.removeMenuItemObject( config, "xProperty" );
					  h.removeMenuItemObject( config, "yProperty" );
					  h.removeMenuItemObject( config, "slice" );
												
					  console.log("Unexpected plot type selected:", config.newCtrl.plottype);
					  break;
				}; // switch
				
				
				
				// Since there was a change in the plot type reset the variable selection menus. Also reset the config object selections.
				a.clearOptionalMenus(config)
				
				
				// Update.
				h.updateMenus(config);
                    

                
            }, // onPlotTypeChangeEvent
            
			onVariableChangeEvent: function onVariableChangeEvent(config, selectDOM, variable){
				
				// Selected value is updated in the corresponding config.
				config.newCtrl[variable] = selectDOM.value;
						  
				// Check if menu buttons need to be active.
				addMenu.addPlotControls.enableDisableSubmitButton(config)
				
			}, // onVariableChangeEvent
			
			enableDisableSubmitButton: function enableDisableSubmitButton(config){
        
				var disabledFlag = true
                switch( config.newCtrl.plottype ){
                    case "undefined":
                        // Disable
                        
                        disabledFlag = true;
                      break;
                      
                    case "cfD3BarChart":
                    
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newCtrl.xProperty === undefined) && 
                                            (config.newCtrl.yProperty !== undefined);
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                        
                      break;
                      
                    case "cfD3Histogram":
                        // xProperty enabled, yProperty disabled.
                        var isConfigValid = (config.newCtrl.xProperty !== undefined) && 
                                            (config.newCtrl.yProperty === undefined);
                        
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                      break;
                      
                    case "cfD3Scatter":
                        // xProperty enabled, yProperty  enabled.
                        var isConfigValid = (config.newCtrl.xProperty !== undefined) && 
                                            (config.newCtrl.yProperty !== undefined);
                        
                        if(isConfigValid){disabledFlag = false}
                        else             {disabledFlag = true};
                      break;
                      
                    case "cfD3Line":
                        // Nothing else is needed, just enable the submit button.
                        disabledFlag = false;
                    
                      break;
					  
					case "cfD3Contour2d":
                        // Nothing else is needed, just enable the submit button.
                        disabledFlag = false;
                    
                      break;
                      
                    default :
                        // Disable
                        disabledFlag = true;
                      break;
                }; // switch(selectedPlotType)


				// Set button enabled or disabled. Note that from the menu container we need to go one step up to reach the button, as the custom menu container is simply docked into the dialog.
                config.dialogWrapper
				  .select("button.btn-success")
				  .each(function(){
					  this.disabled = disabledFlag
				  });


            }, // enableDisableSubmitButton
            
            
			// Shorthands
			clearOptionalMenus: function clearOptionalMenus(config){
				
				var h = addMenu.helpers;
				
				h.resetVariableMenuSelections(config, "xProperty");
				h.resetVariableMenuSelections(config, "yProperty");
				h.resetVariableMenuSelections(config, "slice");
				
				config.newCtrl.xProperty = undefined;
				config.newCtrl.yProperty = undefined;
				config.newCtrl.slice = undefined;
				
			}, // clearOptionalMenus
            
            clearMenu: function clearMenu(config){
                
                addMenu.addPlotControls.clearNewPlot(config);
                
                // Reset the menu selection!
                addMenu.helpers.resetVariableMenuSelections(config, "plottype");
                addMenu.helpers.resetVariableMenuSelections(config, "xProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "yProperty");
                addMenu.helpers.resetVariableMenuSelections(config, "slice");
                
                
                // Remove the select menus from the view.
                addMenu.helpers.removeMenuItemObject( config, "xProperty" );
                addMenu.helpers.removeMenuItemObject( config, "yProperty" );
                addMenu.helpers.removeMenuItemObject( config, "slice" );
                
                // Update the menus so that the view reflects the state of the config.
                addMenu.helpers.updateMenus(config);
                
            }, // clearMenu
            
			makeMenuItem: function makeMenuItem(config, variable, options, label){
				// 'makeMenuItem' creates the menu item option in order to allow different functionalities to add their own events to the menus without having to declare them specifically in otehr functions.
				return {
						  variable: variable,
						  options : options, 
						  label: label,
						  event: config.f.onVariableChangeEvent
					  }
				
			}, // makeMenuItem
			
        }, // addPlotControls
        
        removePlotControls:  function removePlotControls(clickedPlotCtrl){
								
			// Find the ctrl of this plot. 
			// this = button -> ctrlGrp -> plotTitle -> card.
			var plotWrapperDOM = this.parentElement.parentElement.parentElement.parentElement
			
			
			// plotWrapperDOM -> plotRowBody
			var thisPlotRowBody = d3.select( plotWrapperDOM.parentElement )
			

			// Remove the plot from the object.
			thisPlotRowBody.each(function(plotRowCtrl){
				plotRowCtrl.plots = plotRowCtrl.plots.filter(function(plotCtrl){
					// Only return the plots that are not this one.
					return plotCtrl != clickedPlotCtrl
				}) // filter
			}) // each
				

			// Remove from DOM
			plotWrapperDOM.remove()
			
			// Remove any filters that have been removed.
			filter.remove()
			filter.apply()
			
			// Re-render the view
			render()

			
		}, // removePlotRowControls

        addPlotRowControls: { 
        
            elementOptionsArray: [
                    {val: "undefined", text: " "},
                    {val: "metadata", text: 'Metadata overview'},
                    {val: "plotter", text: 'Flow field plots'}
                ],
        
            make : function make(ownerButton){

                // Create the config element with all required data.
                var config = addMenu.addPlotRowControls.createConfig(ownerButton);
                
                // First create the ids of the required inputs
                addMenu.helpers.makeDialog(config);
            
                // Update the menus with appropriate options
                addMenu.helpers.updateMenus(config);
				
				// Add the buttons
				addMenu.helpers.addDialogButtons(config)

				// Add the on click event to the dialog owner button
				config.ownerButton.on("click", function(){
				
					addMenu.helpers.showDialog(config)
					
				}) // on
                
            }, // make
            
            createConfig: function createConfig(ownerButton){
                
                var config = {
					f: addMenu.addPlotRowControls,
					
					position: {
						left: undefined, 
						 top: undefined, 
					   delta: undefined
					},
					
					buttons: [
						{text: "ok"    , onclick: ok    , class: "btn btn-success"},
						{text: "cancel", onclick: cancel, class: "btn btn-danger"}
					],
                    
                    menuItems: [
						{
							variable: "type",
							options : addMenu.addPlotRowControls.elementOptionsArray,
							label   : "Select plot row type",
							event   : addMenu.addPlotRowControls.onPlotRowTypeChangeEvent,
                        }
					],
                    
                    newCtrl: {title: "New row", 
                              plots: [],
							   grid: {nx: 12, ny: undefined},
                               type: "undefined",
                      addPlotButton: {label : "Add plot"}},
					  
					ownerButton: ownerButton,
                    
					ownerCtrl: {addPlotButton: {}}
                };
				
				
				function ok(dialogConfig){
					
				
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)

					// Add the plot row.
					addMenu.addPlotRowControls.submitNewPlotRow(dialogConfig)
					
					// Reset the menu DOM elements.
					addMenu.helpers.resetVariableMenuSelections(config, "type");
				
					// Redraw to show changes.
					render();				
					
				} // ok

				function cancel(dialogConfig){
					
					addMenu.addPlotRowControls.clearNewPlotRow(dialogConfig)
				
					addMenu.helpers.hideDialog(dialogConfig)
					
					// ALSO READJUST THE MENUS!!
				
					console.log("Cancel")
				} // ok


				
                // The addPlotButton id needs to be updated when the row is submitted!
                
                return config;
            }, // createConfig
            
            clearNewPlotRow: function clearNewPlotRow(config){
                config.newCtrl.title = "New row";
                config.newCtrl.plots = [];
                config.newCtrl.type  = "undefined";
                config.newCtrl.addPlotButton = {label : "Add plot"};
				
				// Here also readjust the menu.
				config.dialogWrapper.selectAll("select").each(function(){
					this.value = "undefined"
				})
            }, // clearNewPlotRow
            
            submitNewPlotRow: function submitNewPlotRow(config){
                // Submits the dialog selections to dbsliceData, and clears the dialog object selections.
                
                var plotRowToPush = {title: config.newCtrl.title, 
                                      type: config.newCtrl.type,
									 plots: config.newCtrl.plots, 
                                      grid: config.newCtrl.grid,
                            addPlotButton : config.newCtrl.addPlotButton
                };
                

                // Push and plot the new row.
                dbsliceData.session.plotRows.push( plotRowToPush );
				
                // Clear the config
                addMenu.addPlotRowControls.clearNewPlotRow(config);
                
            }, // submitNewPlotRow
            
            
            enableDisableSubmitButton: function enableDisableSubmitButton(config){
                
				// If either 'metadata' or 'plotter' were chosen then enable the button.
                var disabledFlag = true
				switch ( config.newCtrl.type ){
                    case "metadata":
                    case "plotter":
                        disabledFlag = false
                      break;
                }; // switch
				
				// Why would thi sremove the data??
                config.dialogWrapper
				  .select(".btn-success")
				  .each(function(d){
					  this.disabled = disabledFlag
				  })
				
            }, // enableDisableSubmitButton
            
            onPlotRowTypeChangeEvent: function onPlotRowTypeChangeEvent(config, selectDOM, variable){
                
                // When the plot row type is changed just check if the button should be enabled.
				config.newCtrl.type = selectDOM.value;
				
				addMenu.addPlotRowControls.enableDisableSubmitButton(config);

                
                
            }, // onPlotRowTypeChangeEvent
            
			
			
			
			
        }, // addPlotRowControls

		removePlotRowControls: {
			
			make: function make(removePlotRowButton, clickedPlotRowCtrl){
				
				
				removePlotRowButton
				  .on("click", function(){
					  
					  // button -> plotrowTitle -> plotRow
					  var plotRowDOM = this.parentElement.parentElement
					  
					  // Remove the dialog corresponding to the 'add plot' button in this plot row.
					  d3.select(plotRowDOM)
					    .select("div.plotRowTitle")
						.select("button.btn-success")
						.each(function(d){
							d.addPlotButton.dialogWrapper.node().remove()
						})
					  
					  // Remove row from object
					  dbsliceData.session.plotRows = dbsliceData.session.plotRows.filter(function(plotRowCtrl){
						  return plotRowCtrl != clickedPlotRowCtrl
					  }) // filter  
					  
					  // Remove the plot row from view.
					  plotRowDOM.remove()
					  
					  // Remove any filters that have been removed.
					  filter.remove()
					  filter.apply()

					  // Re-render the to update the filter
					  render()
					  
					  
					  
				  }); // on
				
				
			}, // make
			
		}, // removePlotRowControls

		removeDataControls: {
			
			make: function make(ownerButton){
			
				// Create the container required
				var config = addMenu.removeDataControls.createConfig(ownerButton);
				
				// Make the dialog
				addMenu.helpers.makeDialog(config);
				
				// Add the buttons
				addMenu.helpers.addDialogButtons(config)
			  
			  
				// Add teh functonaliy to the option in the "sesson options" menu.
				config.ownerButton.on("click", function(){
						
					// Get the options required
					var options = dbsliceData.data.fileDim.group().all()

					
					// Create the appropriate checkboxes.
					addMenu.removeDataControls.addCheckboxesToTheForm(config, options);
						  
				   
				   // Show the dialog:
				   addMenu.helpers.showDialog(config)
				   
				})
				
				
			}, // make
			
			createConfig: function createConfig(ownerButton){
                // ownerButton    - the button that prompts the menu
				// ownerContainer - container to add the menu and button to
				// ownerCtrl      - plot row ctrl to update with user selection
                
                var config = {
					
					f: addMenu.removeDataControls,
					
					position: {
						left: undefined, 
						 top: undefined, 
					   delta: undefined
					},
					
					buttons: [
						{text: "ok"    , onclick: ok    , class: "btn btn-success"},
						{text: "cancel", onclick: cancel, class: "btn btn-danger"}
					],
					
                    
					ownerButton: ownerButton,
					ownerCtrl: {addPlotButton: {}}
                };
				
				// MOVE THESE OUTSIDE
				function ok(dialogConfig){
					
					var checkboxInputs = dialogConfig.gMenu
					  .selectAll("g.checkbox")
					  .selectAll("input")
					var uncheckedDataFiles = checkboxInputs.nodes()
					  .filter(function(d){return !d.checked})
					  .map(function(d){return d.value})
					
					// Pass these to the data remover.
					cfDataManagement.cfRemove(uncheckedDataFiles)
					
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)
					
					// Update the session due to data change.
					importExport.helpers.onDataAndSessionChangeResolve()
					
					// Redraw the view.
					render();
					
				} // ok

				function cancel(dialogConfig){
					
					// Remove all the checkboxes.
					dialogConfig.gMenu
					  .selectAll("g.checkbox")
					  .remove()
					
					// Hide the dialog
					addMenu.helpers.hideDialog(dialogConfig)
					
				} // ok
                

                return config;
                
            }, // createConfig
            

			addCheckboxesToTheForm: function addCheckboxesToTheForm(config, options){
				
				
				
				options.forEach(function(o){
					var gCheckBox = config.gMenu
					  .append("g")
					    .attr("class", "checkbox")
						
					gCheckBox.append("input")
					  .attr("type", "checkbox")
					  .attr("name", o.key)
					  .attr("value", o.key)
					  .attr("checked", true)
					  .attr("class", "dialogContent")
					  
					gCheckBox.append("label")
					  .attr("class", "dialogContent")
					  .html(o.key)
				}) // forEach	
				
			}, // addCheckboxesToTheForm
			
			enableDisableSubmitButton: function enableDisableSubmitButton(config){
				// The submit button is always available.
			}, // enableDisableSubmitButton
			
			
		}, // removeDataControls

        helpers: {
            
            makeDialog: function makeDialog(config){
	
				var drag = d3.drag()
				.on("start", function(d){
					let mousePos = d3.mouse(this)
					d.position.delta = {x: mousePos[0], y: mousePos[1]}
				})
				.on("drag", function(d){ 
					
					d3.select(this)
					  .style("left", (d3.event.sourceEvent.clientX - d.position.delta.x) + "px")
					  .style("top", (d3.event.sourceEvent.clientY - d.position.delta.y ) + "px")

				})
				.on("end", function(d){
					d.position.delta = undefined
				})
				

			
				// Place the dialog directly into the body! Position it off screen
				// position: fixed is used to position the dialog relative to the view as opposed to absolute which positions relative to the document.
				config.dialogWrapper = d3.select("body")
				  .append("div")
					.datum( config )
					.style("position", "fixed")
					.style("height", "auto")
					.style("width", "auto")
					.style("top", -window.innerWidth +"px")
					.style("left",  -window.innerHeight +"px")
					.style("display", "none")
					.call( drag )
					
				config.dialogCard = config.dialogWrapper
				  .append("div")
					.attr("class", "card border-dark")
					.style("width", "auto")
					.style("height", "auto")
					.style("min-height", 94 + "px")
					
				config.gMenu = config.dialogCard.append("g")
			
				// Assign the dialog wrapper to the container config too.
				config.ownerCtrl.addPlotButton.dialogWrapper = config.dialogWrapper
			
			}, // makeDialog
        
			addDialogButtons: function addDialogButtons(config){
	
				var buttonsDiv = config.dialogCard
				  .append("div")
				  .style("margin-left", "10px")
				  .style("margin-bottom", "10px")
				
				
				config.buttons.forEach(function(b){
					buttonsDiv
					  .append("button")
						.html(b.text)
						.attr("class", b.class)
						.on("click", b.onclick )
				})
			
			}, // addDialogButtons
		
			hideDialog: function hideDialog(config){
	
				// By default the dialog is not visible, and is completely off screen.
				// 1 - make it visible
				// 2 - move it to the right position
				var dialogDOM = config.dialogWrapper.node() 
				
				dialogDOM.style.display = "none"
				
				
				// Move it to the middle of the screen
				dialogDOM.style.left = - window.innerWidth + "px"
				dialogDOM.style.top =  - window.innerHeight + "px"
			
			}, // hideDialog

			showDialog: function showDialog(config){
			
				// By default the dialog is not visible, and is completely off screen.
				// 1 - make it visible
				// 2 - move it to the right position
				var dialogDOM = config.dialogWrapper.node()
				
				// Make dialoge visible
				dialogDOM.style.display = ""
				
				// To get the appropriate position first get the size:
				var dialogRect = dialogDOM.getBoundingClientRect()
				
				
				
				// Move it to the middle of the screen
				dialogDOM.style.left = ( window.innerWidth - dialogRect.width ) /2 + "px"
				dialogDOM.style.top =  ( window.innerHeight - dialogRect.height ) /2 + "px"
			
			
				// Check which buttons should be on.
				config.f.enableDisableSubmitButton(config)
			
			}, // showDialog

		
		
            updateMenus: function updateMenus(config){
				// Handles all selection menus, including the plot selection!
				// A 'label' acts as a wrapper and contains html text, and the 'select'.

                // This function updates the menu of the pop-up window.
                var menus = config.gMenu.selectAll("g").data(config.menuItems);
                
                // Handle the entering menus. These require a new 'select' element and its 'option' to be appended/updated/removed.
                menus.enter()
				  .append("g")
				  .each(function(d){
					  d3.select(this)
					    .append("label")
						  .attr("class", "dialogContent unselectable")
				           .text(d.label)
						.append("select")
						  .attr("type", d.variable)
					      .style("margin-left", "10px")
					  d3.select(this).append("br")
				  })
                  
					
                    
                // Remove exiting menus.
                menus.exit().remove();
				
				
                
                // Update all the menu elements.
                config.gMenu.selectAll("label")   
                  .each( function(menuItem){
                      // This function handles the updating of the menu options for each 'select' element.
					  
					  // Update the label text as well.
					  this.childNodes[0].value = menuItem.label
                  
                      // Update the menu and it's functionality.
					  var menu = d3.select(this)
					     .select("select")
						 
					  
						 
                      var options = menu
						 .selectAll("option")
						 .data(menuItem.options);
						 
                      options
                        .enter()
                          .append("option")
                            .text( function(d){ return d.text; } )
                            .attr("value", function(d){ return d.val; } );
                            
                      
                      options.attr("value", function(d){ return d.val; })
                             .text( function(d){ return d.text; } );
                      
                      options.exit().remove();
					  
					  // Add the functionality to update dependent properties of the new element we're adding to the view. E.g. x and y variable names. THIS HAS TO BE HERE, AS THE MENUS ENTER AND EXIT THE VIEW UPON UPDATE, AND THEIR ON CHANGE EVENTS NEED TO BE UPDATED. An 'on("change")' is used instead of addEventListener as it will replace instead of add functionality.
					  menu.on("change", function(){
						  // This is a special function to allow the appropriate inputs to be piped into the desired event.
						  menuItem.event(config, this, menuItem.variable)
					  })
					  
                  }); // d3.select ... each


            }, // updateMenus

			resetVariableMenuSelections: function resetVariableMenuSelections(config, variable){
				// Needs to only reset the appropriate select!!
				config.dialogWrapper
				  .selectAll("select[type='" + variable + "']")
				  .each(function(){
					  this.value = "undefined"
				  })

            }, // resetVariableMenuSelections
			
            addUpdateMenuItemObject: function addUpdateMenuItemObject(config, variable, options, label){

				// Transform the options into a form expected by the select updating functionality. Also introduce an empty option.
				options = options.map(function(d){return {val: d, text:d }})
				options.unshift({val: "undefined", text: " "})

                // First remove any warnings. If they are needed they are added later on.
                config.dialogWrapper.selectAll(".warning").remove();

                // Only add or update the menu item if some selection variables exist.
                // >1 is used as the default option "undefined" is added to all menus.
                if (options.length>1){

                    var menuItems = config.menuItems;
                              
                    // Check if the config object already has a comparable option.
                    var requiredItem = menuItems.filter(function(menuItem){
						return menuItem.variable == variable
					})[0];
                    

                    if (requiredItem !== undefined){
                      // If the item exists, just update it.
                      requiredItem.options = options;
					  requiredItem.label = label;

                    } else {
                      // If it doesn't, create a new one.
                      requiredItem = config.f.makeMenuItem(config, variable, options, label)
                      
                      config.menuItems.push(requiredItem);
                    };      

                
                } else {
                      // There are no variables. No point in having an empty menu.
                      addMenu.helpers.removeMenuItemObject(config, variable);
                      
                        
                }; // if
                
            }, // addUpdateMenuItemObject

            removeMenuItemObject: function removeMenuItemObject(config, variable){
                // Removes the menu item with that controls <variable>.
                config.menuItems = config.menuItems.filter(function(menuItem){
					return menuItem.variable != variable
				});
                
            }, // removeMenuItemObject

            enableDisableAllButtons: function enableDisableAllButtons(){
                // This functionality decides which buttons should be enabled.
				var metadata = dbsliceData.data.taskDim.top(Infinity)
                var isDataInFilter = metadata.length !== undefined && metadata.length > 0;
				
				// For the data to be loaded some records should have been assigned to the crossfilter.
				var isDataLoaded = false
				if(dbsliceData.data !== undefined){
					isDataLoaded = dbsliceData.data.cf.size() > 0
				} // if
				
				
				
				
				// GROUP 1: SESSION OPTIONS
				// Button controlling the session options is always available!
                document.getElementById("sessionOptions").disabled = false;
				
				// "Load session" only available after some data has been loaded.
				// Data: Replace, add, remove, Session: save, load
				// These have to have their class changed, and the on/click event suspended!!
				listItemEnableDisable( "replaceData" , true )
				listItemEnableDisable( "addData"     , true )
				listItemEnableDisable( "removeData"  , isDataLoaded )
				listItemEnableDisable( "saveSession" , true )
				listItemEnableDisable( "loadSession" , isDataLoaded )
				
				
				
				
				
				
				// GROUP 2: ON DEMAND FUNCTIONALITY
                // "Plot Selected Tasks" is on only when there are tasks in the filter, and any 'plotter' plot row has been configured.
				var refreshTasksButton = d3.select("#refreshTasksButton")
                arrayEnableDisable(refreshTasksButton, isDataInFilter)
				
				
                
				
                // GROUP 3: ADDING/REMOVING PLOTS/ROWS
                // "Add plot row" should be available when the data is loaded. Otherwise errors will occur while creating the apropriate menus.
				document.getElementById("addPlotRowButton").disabled = !isDataLoaded;
                
                
                // "Remove plot row" should always be available.
                var removePlotRowButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-danger")
                arrayEnableDisable(removePlotRowButtons, true)
                
				
                // "Add plot" should only be available if the data is loaded.
                var addPlotButtons = d3.selectAll(".plotRowTitle").selectAll(".btn-success");
				arrayEnableDisable(addPlotButtons, isDataInFilter)
				                
                // "Remove plot" should always be available.
                var removePlotButtons = d3.selectAll(".plotTitle").selectAll(".btn-danger");
				arrayEnableDisable(removePlotButtons, true)
				
				
				// GROUP 4: Plot interactive controls.
				var plotInteractionButtons = d3.selectAll(".plot").selectAll(".btn")
				arrayEnableDisable(plotInteractionButtons, true)
				
				
				
				function arrayEnableDisable(d3ButtonSelection, conditionToEnable){
					
					if(conditionToEnable){
						// Enable the button
						d3ButtonSelection.each(function(){ this.disabled = false })
					} else {
						// Disable the button
						d3ButtonSelection.each(function(){ this.disabled = true })         
					}; // if					
					
				} // arrayEnableDisable
				
				
				function listItemEnableDisable(elementId, conditionToEnable){
					
					if(conditionToEnable){
						// Enable the button
						d3.select("#" + elementId).attr("class", "dropdown-item")
						document.getElementById(elementId).style.pointerEvents = 'auto'
					} else {
						// Disable the button
						d3.select("#" + elementId).attr("class", "dropdown-item disabled")
						document.getElementById(elementId).style.pointerEvents = 'none'
					}; // if
					
				} // listItemEnableDisable
				
                
            }, // enableDisableAllButtons
            
            
            
        } // helpers

    }; // addMenu
 
    // Building the app.
	var builder = {
		
		makeSessionHeader: function makeSessionHeader() {
		
			// Check if there was a previous session header already existing. 
			var element = d3.select("#" + dbsliceData.elementId);
			var sessionHeader = element.select(".sessionHeader");
			if (!sessionHeader.empty()) {
				// Pre-existing session header! Remove any contents. Print a message to the console saying this was done.
				sessionHeader.selectAll("*")
			} // if
			
			var sessionTitle = element
			  .append("div")
				.attr("class", "row sessionHeader")
			  .append("div")
				.attr("class", "col-md-12 sessionTitle");
		 
			sessionTitle
			  .append("br");
			
			sessionTitle
			  .append("h1")
			    .attr("class", "sessionTitle")
				.attr("style", "display:inline")
				.attr("spellcheck", "false")
				.html(dbsliceData.session.title)
				.attr("contenteditable", true)
				.each(function(){
					this.addEventListener("input", function(){
						dbsliceData.session.title = this.innerHTML
					})
				})
			
		  
		  
			if (dbsliceData.session.plotTasksButton) {
				sessionTitle
				  .append("button")
					.attr("class", "btn btn-success float-right")
					.attr("id", "refreshTasksButton")
					.html("Plot Selected Tasks")
					.on("click", function () {
						cfDataManagement.refreshTasksInPlotRows();
					});
			} // if

			if (dbsliceData.session.subtitle !== undefined) {
				sessionTitle
				  .append("p")
				  .html(dbsliceData.session.subtitle);
			} // if
		  
			sessionTitle
			  .append("br")
			sessionTitle
			  .append("br");

			sessionTitle
			  .append("div")
				.attr("class", "filteredTaskCount")
			  .append("p")
				.attr("style", "display:inline");
			
			// CREATE THE MENU WITH SESSION OPTIONS
			var sessionGroup = sessionTitle
			  .append("div")
				.attr("class", "btn-group float-right")
				.attr("style", "display:inline")
				
			sessionGroup
			  .append("button")
				.attr("id", "sessionOptions")
				.attr("type", "button")
				.attr("class", "btn btn-info dropdown-toggle")
				.attr("data-toggle", "dropdown")
				.attr("aria-haspopup", true)
				.attr("aria-expanded", false)
				.html("Session options")
				
			var sessionMenu = sessionGroup
			  .append("div")
				.attr("class", "dropdown-menu")
			  
			
			var dataReplace = createFileInputElement( importExport.importing.metadata.go, "replace")
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "replaceData")
				.html("Replace data")
				.on("click", function(){dataReplace.click()})
				
			
			var dataInput = createFileInputElement( importExport.importing.metadata.go, "add")
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "addData")
				.html("Add data")
				.on("click", function(){dataInput.click()})
			
				
			var removeDataItem = sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "removeData")
				.html("Remove data")
			addMenu.removeDataControls.make(removeDataItem)
					
			
			var sessionInput = createFileInputElement( importExport.importing.session )
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "loadSession")
				.html("Load session")
			    .on("click", function(){sessionInput.click()})
			
			sessionMenu
			  .append("a")
			    .attr("class", "dropdown-item")
				.attr("href", "#")
				.attr("id", "saveSession")
				.html("Save session").on("click", function(){
				
					// Get the string to save
					var s = importExport.exporting.session.json()
					
					// Make the blob
					var b = importExport.exporting.session.makeTextFile(s)
					
					
					// Download the file.
					var lnk = document.createElement("a")
					lnk.setAttribute("download", "test_session.json")
					lnk.setAttribute("href", b)
					
					var m = d3.select( document.getElementById("sessionOptions").parentElement ).select(".dropdown-menu").node()
					m.appendChild(lnk)
					lnk.click()	
				})
			
				
				
				
			  
			sessionTitle
			  .append("br")
			sessionTitle
			  .append("br")
			  

			
			
			// Add a callback for when hte window is resized.
			window.addEventListener("resize", function(){
				
				// All the plotrows should be resized to the width of the screen. The plots will need to be repositioned.
				let session = d3.select( "#" + dbsliceData.elementId )
				
				// Calculate the width so that the plots will still actually fit.
				var width = session.node().offsetWidth - 45
				
				let plotRows = session.selectAll("div.plotRow")
				  .style("width", width + "px")
				  
				  
				// Because teh width changed the internal positions of the plots must be readjusted. Maybe just reposition them?
				
				
				let plots = plotRows.selectAll("div.plotWrapper")
				
				// First redo the widths and heights of all plots.
				plots.each(function(plotCtrl){
					positioning.helpers.readjustPlotSize(plotCtrl)
					
					positioning.helpers.readjustPlotPosition(plotCtrl)
				})
				
				// For now just keep the positions, but redraw. Adequate for now.
				
				
				
			})

			// HELPER FUNCTIONS:
			function createFileInputElement(loadFunction, dataAction){
				
				// ERROR! DATA INPUT ONCHANGE SHOULD BE CHANGED - THE USER SHOULD BE ALLOWED TO RELOAD A FILE STRAIGHT AFTER REMOVING IT. CHANGE THIS IN THE IMPORTING - STORE THE METADATA FILES IN HTE CENTRAL BOOKING TOO!
				
				// This button is already created. Just add the functionaity.
				var dataInput = document.createElement('input');
				dataInput.type = 'file';

				// When the file was selected include it in dbslice. Rerender is done in the loading function, as the asynchronous operation can execute rendering before the data is loaded otherwise.
				dataInput.onchange = function(e){
					// BE CAREFULT HERE: file.name IS JUST THE local name without any path!
					var file = e.target.files[0]; 
					// importExport.importing.handler(file);
					loadFunction(file, dataAction)
				}; // onchange
				
			  return dataInput
				
			} // createGetDataFunctionality
		   
		}, // makeSessionHeader
		
		updateSessionHeader: function updateSessionHeader(element){
			
			var metadata = dbsliceData.data.taskDim.top(Infinity)
			if (metadata !== undefined) {
				element.select(".filteredTaskCount").select("p")
				  .html("Number of Tasks in Filter = " + metadata.length);
			} else {
				element.select(".filteredTaskCount").select("p")
				  .html("<p> Number of Tasks in Filter = All </p>");
			}; // if
			
			// Update the session title.
			element
			  .select("div.sessionTitle")
			  .select("h1.sessionTitle")
			    .html(dbsliceData.session.title)
			
		}, // updateSessionHeader
		
		makePlotRowContainers: function makePlotRowContainers(plotRows){
			// This creates all the new plot rows.
			
			var width = d3.select( "#" + dbsliceData.elementId ).node().offsetWidth - 45
			
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
					  d3.select(this).each(function(plotRow){ plotRow.title = newTitle })
				  }, false);
			  }) // each
			  
			// Buttons
			newPlotRowsHeader.each(function(plotRowCtrl){
				
				var removePlotRowButton = d3.select(this)
				  .append("button")
					.attr("class", "btn btn-danger float-right removePlotButton")
					.html("x")
				addMenu.removePlotRowControls.make( removePlotRowButton, plotRowCtrl );
				
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
		
		makeAddPlotRowButton: function makeAddPlotRowButton(){
			
			var addPlotRowButton = d3.select("#addPlotRowButton")
			
			if(addPlotRowButton.empty()){
			    
				addPlotRowButton = d3.select("#" + dbsliceData.elementId)
			      .append("button")
			        .attr("id", "addPlotRowButton")
				    .attr("class", "btn btn-info btn-block")
				    .html("+");
			
			    addMenu.addPlotRowControls.make(addPlotRowButton)
			} // if
			
		}, // makeAddPlotRowButton
		
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
			  .style("left"  , d=> d.format.parent.offsetLeft+d.format.position.ix*dx+"px")
			  .style("top"   , d=> d.format.parent.offsetTop +d.format.position.iy*dy + "px")
              .style("width" , d=> d.format.position.iw*dx + "px")
              .style("height", d=> d.format.position.ih*dy + "px")
            
        } // refreshPlotRowWidth
		
		
	} // builder
		
	// Drawing of the app.

    function render() {
        var element = d3.select( "#" + dbsliceData.elementId );

		// Update the selected task counter
		builder.updateSessionHeader(element)
		

	  
        var plotRows = element
		  .selectAll(".plotRow")
		  .data(dbsliceData.session.plotRows);
      
        // HANDLE ENTERING PLOT ROWS!
		var newPlotRows = builder.makePlotRowContainers(plotRows)
        
      
        // Add in the container for the title of the plotting section.
        // Make this an input box so that it can be change on te go!
		builder.makePlotRowHeaders(newPlotRows)
		

			
      
        // Give all entering plot rows a body to hold the plots.
        builder.makePlotRowBodies(newPlotRows)
      
        // In new plotRowBodies select all the plots. Selects nothing from existing plotRows.
        builder.makeUpdatePlotRowPlots(newPlotRows)
      
      
      
        // UPDATE EXISTING PLOT ROWS!!
		builder.makeUpdatePlotRowPlots(plotRows)


	  
	  
	  
        // ADD PLOT ROW BUTTON.
		builder.makeAddPlotRowButton()
        
        


	    // DROPDOWN MENU FUNCTIONALITY - MOVE TO SEPARATE FUNCTION??
      // Control all button and menu activity;
        addMenu.helpers.enableDisableAllButtons();
      
        
 
		// Add plot button must always be at the bottom
		var buttonDOM = document.getElementById("addPlotRowButton")
		var buttonParentDOM = buttonDOM.parentElement
		buttonDOM.remove()
		buttonParentDOM.appendChild(buttonDOM)
		
		
		
    } // render

    function initialise(elementId, session, data) {
		
		
		let dataInitPromise = new Promise(function(resolve, reject){
		    // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
		  
		    // resolve and reject are in-built names. They allow the user to handle the following scenarios. Resolve allows the user to pass inputs onto the branch which is taken when the promise was resolved. Reject allows the same, but in case of a rejected promise, and allows error handling. Both of these scenarios happen in the '.then' functionality below.
		  
		    // Here the promise is used to wait until the execution of the data initialisation is completed before the app is drawn.
			
			
			// Initialise the crossfilter.
			cfDataManagement.cfInit( data );
			
			// Store the app configuration and anchor.
			dbsliceData.session = session;
			dbsliceData.elementId = elementId;
			

			// The state is ready. 
			resolve("")
			
			
		}) // Promise 

		Promise.all([dataInitPromise])
		  .then(function(successInputs){
			
			// Draw the header.
			builder.makeSessionHeader()
		  
			// Draw the rest of the app.
			render()
			},
			function(error){
				// The reject hasn't been called, so this shouldn't run at all. See info in `dataInitPromise'.
				console.log("I shouldn't have run, why did I?")
			})
		  
		  
		

	    
    } // initialise

    



	// Merge with data management, import/export
    var filter = {
		
		remove: function remove(){
			// Remove all filters if grouping information etc is required for the whole dataset.
			var cf = dbsliceData.data
			
			// Bar charts
			Object.keys(cf.metaDims).forEach(function(property){
					cf.metaDims[property].filterAll()
			}) // forEach
			
			// Histograms
			Object.keys(cf.dataDims).forEach(function(property){
					cf.dataDims[property].filterAll()
			}) // forEach
			
			
			// Plots with individual tasks.
			cf.taskDim.filterAll()
			
		}, // remove
		
		apply: function apply(){
			// Crossfilter works by applying the filtering operations, and then selecting the data.
			// E.g.:
			//
			// var dim = dataArrayCfObject.dimension(function(d) { return d.[variable]; });
			// dim.filter(“Design A”)
			//
			// This created a 'crossfilter' dimension obeject on the first line, which operates on the poperty named by the string 'variable'. his objecathen be used to perform filtering operations onthe data.
			// On the second line a filter is added. In this case the filter selects only 'facts' (individual items of data), for which the 'variable' is equal to "Design A". The selection is applied directly on the dataArrayCfObject, so trying to retrive the top 10 data points using dataArrayCfObject.top(10) will return the first 10 points of "Design A".
			//
			// Thus the filters can be applied here, and will be observed in the rest of the code.
			
			// UPDATE THE CROSSFILTER DATA SELECTION:
			var cf = dbsliceData.data
			
			// Bar charts. Maybe this should be split between two separate functions? This would also make it clearer for the user, as well as making hte object clearer. First make it work though.
			updateBarChartFilters()
			 applyBarChartFilters()
		  
			// Histograms
			updateHistogramChartFilters()
			 applyHistogramChartFilters()
		
			// Manual selections - but this should happen only if the manual switch is on!! 
			updateManualSelections()
			 applyManualSelections()
			
			
			// Checking for bar charts.
			function updateBarChartFilters(){
				// 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
				
				// 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
				var filteredVariables = Object.keys(cf.filterSelected)
				
				// Check which of the filters stored still correspond to the on screen bar charts.
				filteredVariables.forEach(function(variable){
					
					// Loop through the bar charts to see if this variable is still on screen.
					var isVariableActive = false
					dbsliceData.session.plotRows.forEach(function(plotRow){
						
						plotRow.plots.forEach(function(plot){
							if(plot.plotFunc.name == "cfD3BarChart"){
								// The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
								isVariableActive = isVariableActive || plot.view.yVarOption.val == variable
							} // if
							
						}) // forEach
					}) // forEach
					
					// If the variable is no longer active, then remove the filter by deleting the appropriate object property.
					if(!isVariableActive){
						delete cf.filterSelected[variable]
					} // if
					
					
				}) // forEach
			} // updateBarChartFilters
			
			function applyBarChartFilters(){
				// 'applyBarChartFilters' applies the filters selected based on metadata variables to the crossfilter object.
				
				// First deselect all filters, and then subsequently apply only those that are required.
				
				// Deselect all metadata filters.
				Object.keys(cf.metaDims).forEach(function(variable){
					cf.metaDims[variable].filterAll()
				}) // forEach
				
				// Apply required filters. Reselect the filtered variables, as some might have been removed.
				var filteredVariables = Object.keys(cf.filterSelected)
			
				filteredVariables.forEach(function (variable) {
					
					var filterItems = cf.filterSelected[variable]
					
					// if the filters array is empty: ie. all values are selected, then reset the dimension
					if ( filterItems.length === 0) {
						// Reset the filter
						cf.metaDims[variable].filterAll();
					} else {
						// Apply the filter
						cf.metaDims[variable].filter(function (d) {
							// Here d is the value of the individual task property called <variable> already.
							return filterItems.indexOf(d) > -1;
						}); // filter
					}; // if
				}); // forEach
				
			} // applyBarChartFilters
			
			
			// Checking for histograms
			function updateHistogramChartFilters(){
				// 'updateBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. This is required as the user could select a bar, and then change variables. In this case the filter would be retained, and the variable not seen anymore, which would potentially mislead the user. Therefore it has been decided that filters should be visible at all times, and if the user desires to hide some information from the screen then they should be given the option to minimise the plot rows.
				
				// 'keys' vs 'getOwnPropertyNames' returns only the enumerable properties, in this case the property 'length' of array is not returned by 'keys'.
				var filteredVariables = Object.keys(cf.histogramSelectedRanges)
				
				// Check which of the filters stored still correspond to the on screen bar charts.
				filteredVariables.forEach(function(variable){
					
					// Loop through the bar charts to see if this variable is still on screen.
					var isVariableActive = false
					dbsliceData.session.plotRows.forEach(function(plotRow){
						
						plotRow.plots.forEach(function(plot){
							if(plot.plotFunc.name == "cfD3Histogram"){
								// The flag is cumulative over all the bar charts, and if it is present in any of them the variable is active. Therefore an or statement is used.
								isVariableActive = isVariableActive || plot.view.xVarOption.val == variable
							} // if
							
						}) // forEach
					}) // forEach
					
					// If the variable is no longer active, then remove the filter by deleting the appropriate object property.
					if(!isVariableActive){
						delete cf.histogramSelectedRanges[variable]
					} // if
					
					
				}) // forEach
			} // updateHistogramChartFilters
			
			function applyHistogramChartFilters(){
				// 'updateApplyBarChartFilters' checks if the filters still correspond to a variable visualised by a bar chart. Same logic as for the bar chart.
				
				
				
				// Deselect all metadata filters.
				Object.keys(cf.dataDims).forEach(function(variable){
					cf.dataDims[variable].filterAll()
				}) // forEach
				
				// Get the fitlered variables. These are selected differently than for filter deselection as an additional safety net - all filters are definitely removed this way.
				var filteredVariables = Object.keys(cf.histogramSelectedRanges)
				
				// Apply required filters. Reselect the filtered variables, as some might have been removed.
				filteredVariables.forEach(function (variable) {
					
					var selectedRange = cf.histogramSelectedRanges[variable]
					
				
					if (selectedRange.length !== 0) {
						// If the selected range has some bounds prescribed attempt to apply them. Note that the filter here is NOT the array.filter, but crossfitler.dimension.fitler.
						cf.dataDims[variable].filter(function (d) {
						  return d >= selectedRange[0] && d <= selectedRange[1] ? true : false;
						}); // filter
					}; // if
				}); // forEach
				
			} // applyHistogramChartFilters
			
			
			// Individual selection plots
			function updateManualSelections(){
				
				// Ensure that the manually selected points are coherent with the other filters.
				var filterTaskIds = cf.taskDim.top(Infinity).map(function(d){return d.taskId});
				
				cf.manuallySelectedTasks = cf.manuallySelectedTasks.filter(function(d){
					return filterTaskIds.includes(d)
				})
				

			} // updateManualSelections
			
			function applyManualSelections(){
				
				var isManualFilterApplied = checkIfManualFilterIsApplied()
				if( isManualFilterApplied ){
					var filters = cf.manuallySelectedTasks
					if (filters.length === 0) {
						// if the filters array is empty: ie. all values are selected, then reset the dimension
						cf.taskDim.filterAll();
					} else {
						// If there are tasks, then apply the filter.
						cf.taskDim.filter(function (d) {
							return filters.indexOf(d) > -1;
						}); // filter
					}; // if
				} else {
					cf.taskDim.filterAll();
				} // if
				
			} // applyManualSelections
			
			
			
			// Helpers
			function checkIfManualFilterIsApplied(){
				var isManualFilterApplied = false
				
				var scatterPlots = d3.selectAll(".plotWrapper[plottype='cfD3Scatter']")
				if( !scatterPlots.empty() ){
					var toggle = scatterPlots.select("input[type='checkbox']")
					if ( !toggle.empty() ){
						isManualFilterApplied = toggle.node().checked
					} // if
				} // if
				
			  return isManualFilterApplied
				
			} // checkIfManualFilterIsApplied
			
		}, // apply
		
		addUpdateMetadataFilter: function addUpdateMetadataFilter(property, value){
			
			// Initialise filter if necessary
			if (dbsliceData.data.filterSelected[property] === undefined){
				dbsliceData.data.filterSelected[property] = [];
			} // if


			// check if current filter is already active
			var currentFilter = dbsliceData.data.filterSelected[property]
			if ( currentFilter.indexOf(value) !== -1){
				// This value is already in the filter, therefore the user decided to remove it from the filter on it's repeated selection.
				var ind = currentFilter.indexOf(value);
				currentFilter.splice(ind, 1);
			} else {
				// Filter not active, add the item to the filter.
				currentFilter.push(value);
			} // if
			
			
			
		}, // addUpdateMetadataFilter
		
		addUpdateDataFilter: function addUpdateDataFilter(property, limits){
			/*
			var dimId = dbsliceData.data.dataProperties.indexOf(ctrl.view.xVarOption.val)
			var filter = dbsliceData.data.histogramSelectedRanges[dimId]
			if(filter !== undefined){
				xMin = filter[0]
				xMax = filter[1]
			} else {
				dbsliceData.data.histogramSelectedRanges[dimId] = [xMin, xMax]
			} // if
			*/
			
			dbsliceData.data.histogramSelectedRanges[property] = limits
			
			
		}, // addUpdateDataFilter
		
		
    } // filter

    
	var inputTesting = {
	
		getTestRow: function getTestRow(metadata){
		
		
			
			let rowInd = Math.floor( Math.random()*metadata.length )
			let row = metadata[rowInd]
			
			// Find all variables to test. Exclude the artificially generated __file__.
			let variablesToTest = Object.getOwnPropertyNames(row).filter(d=> d!="__file__") 
			
			
			return variablesToTest.map(function(varName, colInd){
				 return {
					tag: "metadata",
					parent: row.__file__,
					rowInd: rowInd,
					colInd: colInd,
					colName: varName,
					testVal: row[varName],
					type: typeof(row[varName]),
					category: undefined,
					vals: metadata.map(d=>d[varName])
				}

			})
		
		}, // getTestRow
	
		classifyVariables: function(metadata, storeData){
		
			let vars = inputTesting.getTestRow(metadata)
		
			let promises = []
			vars.forEach(function(varObj){
				// Check this column.
				promises.push( inputTesting.handleVariables(varObj) )
				
			})
			
			// Promises are tests- they cannot be rejected, they can only come
			Promise.all(promises)
			.then(function(variableClassification){
				// Resolve - communicate the results onwards.
				
				inputTesting.displayResults(variableClassification)
				
				// When the classification is finished store the results.
				storeData(variableClassification)
				
			})
		
		}, // classifyVariables
	
		displayResults: function displayResults(variableClassification){
			
			console.log("Hand variables on!")
			console.log(variableClassification)
			
			// Maybe make the report in the same div as used for the variable handling? And have it as a two stage?
			
			// Make a report
			inputTesting.report.make();
			
			// Make the variable handling
			variableHandling.make(variableClassification)
			
		}, // displayResults
		
		handleVariables: function handleVariables(varObj){
			// Split the testing as per the variable type received.
			let promise
			switch( varObj.type ){
				case "string":
					// String can be a file too.
					promise = inputTesting.handleFiles(varObj)
					
				  break;
				  
				case "number":
					varObj.category = "Ordinal"
					promise = varObj
					
				  break;
				  
				default:
					inputTesting.error.wrongVarType.instances.push(varObj)
					
					varObj.category = "Unused";
					promise = varObj
			} // switch
				
			return promise
			
		}, // handleVariables
	
		handleFiles: function handleFiles( stringVar ){
	
			let promise
			let extension = stringVar.testVal.split(".").pop();
			switch(extension){
				case "json":
					promise = inputTesting.test.json(stringVar)
				  break;
				case "csv":
					promise = inputTesting.test.csv(stringVar)
				  break;
				default:
					// Unsupported extension.
					promise = inputTesting.test.dummy(stringVar)
			} // switch
			
			return promise
		
		}, // handleString
	
		// MOVE TO HELPERS
		getConvertedValues: function getConvertedValues(metadata){
		
			data = []
			metadata.forEach(function(d){
				data.push( inputTesting.convertNumbers(d) )
			})

					
			return data
			
		}, // getConvertedValues
		
		convertNumbers: function convertNumbers(row) {
				// Convert the values from strings to numbers.
				
				var r = {};
				for (var k in row) {
					r[k] = +row[k];
					if (isNaN(r[k])) {
						r[k] = row[k];
					} // if
				} // for
			  return r;
		}, // convertNumbers
		
		unique: function unique(d){		
			// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
			function onlyUnique(value, index, self) { 
				return self.indexOf(value) === index;
			} // unique
			
			return d.filter( onlyUnique )
		
		}, // unique
		
	
		// REPORT
		report: {
			
			show: function show(){
				
					let fullscreenContainer = d3.select("div.report-container")
				
					fullscreenContainer.style("display", "")
				
				}, // show
				
			hide: function hide(){
			
					let fullscreenContainer = d3.select("div.report-container")
				
					// Hide the container. Bring up the variable handling.
					fullscreenContainer.style("display", "none")
					
					variableHandling.show()
			
			}, // hide
		
			make: function make(){
				
				// Instead of opening this in a separate window draw it into a dedicated container.
				
				let parent = d3.select("div.report-container")
				parent.selectAll("*").remove()
				
				inputTesting.metadata.report.make(parent)
				
				let menus = parent.node().querySelectorAll(".accordion")
				
				inputTesting.report.addFunctionality(menus)
				
			}, // make
		
			makeMenu: function makeMenu(parent, ctrl){
				let r = inputTesting.report
	
				// Make the overhead menu item.
				let content = r.makeMenuItemBackbone(parent, ctrl)
				
				// For each particular error type make a dedicated submenu.
				ctrl.errorTypes.forEach(function(errorType){
					r.makeSubMenu(content, errorType)
				})
			
				// The report items should open. - This is done after it is printed to the new window. As it's printe as a string the new window creates new elements, without the functionality attached.
				// r.addFunctionality(parent.node().querySelectorAll(".accordion"))
				
				
			
			}, // makeMenu
				
			makeSubMenu: function makeSubMenu(parent, ctrl){
				let r = inputTesting.report

				let content = r.makeMenuItemBackbone(parent, ctrl)
				
				content
				  .append("p")
					.attr("class", "description")
					.html(ctrl.description)
				content
				  .append("div")
					.attr("class", "panel-content")
				  .append("ul")
				  .selectAll("li")
				  .data( ctrl.errors )
				  .enter()
				  .append("li")
					.html(ctrl.printout)  
			
			}, // makeSubMenu
			
			makeMenuItemBackbone: function makeMenuItemBackbone(parent, ctrl){
			
				let button = parent
				  .append("button")
					.attr("class", "accordion")
					.style("outline", "none")
					
				if(ctrl.titleEl != undefined){
					button = button.append(ctrl.titleEl)
				}
				
				button
				  .append("strong")
					.html(ctrl.title)
				button
				  .append("span")
					.attr("class", "badge badge-pill badge-info")
					.style("float", "right")
					.html(ctrl.nErrors)
					
				let content = parent
				  .append("div")
					.attr("class", "panel")
			
				return content
			
			}, // makeMenuItemBackbone
				
			addFunctionality: function addFunctionality(menus){
			
				for (let i = 0; i < menus.length; i++) {
				  menus[i].addEventListener("click", function() {
					this.classList.toggle("active");
					var panel = this.nextElementSibling;
					if (panel.style.display === "block") {
					  panel.style.display = "none";
					} else {
					  panel.style.display = "block";
					}
				  });
				} // for
			
			
			}, // addFunctionality
			
		}, // report
		
		
		// WHEN COMBINING WITH IMPORTEXPORTFUNCTIONALITY Combine with metadata to keep all relevant functionality together.
		metadata: {
		
			report: {

				make: function make(parent){
				
				
					// Have the fullscreen container in index.html
					
					let menuContainer = parent
					  .append("div")
						.attr("class", "card card-menu")
						
					menuContainer
					  .append("div")
						.attr("class", "card-header")
					  .append("h1")
						.html("Report:")

					// Body
					
					// Collect the error data.
					let allFilesWithErrors = inputTesting.metadata.report.generate()
					
					let varCategories = menuContainer
					  .append("div")
						.attr("class", "card-body")
						.style("overflow-y", "auto")
						.style("overflow-x", "auto")
					  .selectAll("div")
					  .data(allFilesWithErrors)
					  .enter()
					    .append("div")
						.each(function(d){
							inputTesting.report.makeMenu(d3.select(this), d)
						})
					  
					// Footer
					menuContainer
					  .append("div")
						.attr("class", "card-footer")
					  .append("button")
						.attr("class", "btn btn-success")
						.html("Understood")
						.on("click", inputTesting.report.hide)	
				
				
				}, // make
				
				message: function message(d){
					return d.colName + " (" + d.rowInd + ", " +d.colInd + "): " + d.testVal
				}, // message
			
				generate: function generate(){
					// Generate the appropriate data to draw the error report. For metadata the report is structured per metadata file type.
					let error = inputTesting.error
					let errorTypes = Object.getOwnPropertyNames(error)
				
				
					// Metadata files have the tag 'metadata' and a property 'parent', which denotes the particular file. Collect all unique files with errors.
					let filenames = []
					errorTypes.forEach(function(errorName){
						error[errorName].instances.forEach(function(varObj){
							if(varObj.tag == "metadata"){
								filenames.push(varObj.parent)
							} // if
						})
					})
					filenames = inputTesting.unique(filenames)
					
					
					// Create the reports for all the files.
					return filenames.map(function(filename){
					
						let fileReport = {
							title: filename,
							titleEl: "h2",
							nErrors: undefined,
							errorTypes: []
						}
						
						errorTypes.forEach(function(errorName){
						
							// Get all the errors of a particular type for this file.
							var fileErrors = error[errorName].instances.filter(function(varObj){
								return varObj.parent == filename
							})
							
							// Generate the error report object
							if(fileErrors.length > 0){
								fileReport.errorTypes.push(
									new error[errorName].report(fileErrors)
								)
							} // if
						
						})
						
						// Sum up hte number of all errors.
						fileReport.nErrors = fileReport.errorTypes.reduce(function(sum, errorType){return sum + errorType.errors.length},0)
						
						return fileReport
					})
					
				
				}, // generate
				
			}, // 
		
			
		}, // metadata
	
		// All the tests.
		test: {
	
			// File formats
			json: function json(varObj){
			
				return new Promise(function(resolve, reject){

					d3.json(varObj.testVal).then(function(content){
						// json files can be lines or contours.
						let test = inputTesting.test
						
						let isContour = test.contour.json(content)
						let isLine = test.line.json(content)
						
						
						// The contents are not in expected form - alert the user.
						if(isContour){
							varObj.category = "Contour"
							varObj.type = "file-contour"
						} else if(isLine){
							varObj.category = "Line"
							varObj.type = "file-line"
						} else {
							// Some other format. Don't allow the file to be loaded in by marking the column as categorical.
							varObj.category = "Categorical"
							
							inputTesting.error.unsupportedFileStructure.instances.push(varObj)
						}
						
						resolve(varObj)
						
					}).catch(function(){
						varObj.category = "Categorical"
						
						inputTesting.error.fileNotFound.instances.push(varObj)
						
						resolve(varObj)
					}) // then
					
				}) // Promise
			
			}, // json
			
			csv: function csv(varObj){
			
				return new Promise(function(resolve, reject){

					// This promise CAN fail - e.g. no file.
					d3.csv(varObj.testVal).then(function(content){
						let test = inputTesting.test
						// csv are always loaded in as strings. Need to convert what can be converted before testing.
						let content_ = inputTesting.getConvertedValues(content)
						
						// Csv could be line.
						let isLine = test.line.csv(content_)
						
						
						// The contents are not in expected form - alert the user.
						if(isLine){
							varObj.category = "Line"
							varObj.type = "file-line"
						} else {
							varObj.category = "Categorical"
							
							inputTesting.error.unsupportedFileStructure.instances.push(varObj)
							
							
							
						}
						
						resolve(varObj)
						
					}).catch(function(){
						varObj.category = "Categorical"
						
						inputTesting.error.fileNotFound.instances.push(varObj)
							
						resolve(varObj)
					}) // then
					
				}) // Promise
			
			}, // csv
			
			dummy: function dummy(varObj){
				// All real categorical variables pass through here, alongside to any with extensions.
			
				return new Promise(function(resolve, reject){

					varObj.category = "Categorical"
					
					// Add a report if there is an extension.
					let extension = varObj.testVal.split(".").pop()
					if(extension != varObj.testVal){
						inputTesting.error.unsupportedFileExtension.instances.push(varObj)			
					} // if
					
					
					
					// Directly pass the category to resolve.
					resolve(varObj)
					
				}) // Promise
			
			}, // dummy
			
			// Data formats
			contour: {
			
				json: function json(content){
				
					let isContour = false
				
					try {
				
						if(content.surfaces != undefined){
							// surfaces must have an object with properties y, x, and v, and size
							let s = content.surfaces
							let hasRequiredProperties = 
								Array.isArray(s.x) &&
								Array.isArray(s.y) &&
								Array.isArray(s.v) &&
								Array.isArray(s.size);
							if(hasRequiredProperties){
								isContour = true
							} // if
						} // if
						return isContour
				
					} catch (e){
						return isContour
					} // try
				
				}, // json
			
			}, // contour
			
			line: {
			
				json: function json(content){
				
					// Check if 'content.data' is an array containing only numbers in a random row.
					return inputTesting.test.helpers.testArray(content.data)
				
				}, // json
				
				csv: function csv(content){
				
					// Check if 'content' is an array containing only numbers in a random row.
					return inputTesting.test.helpers.testArray(content)
				
				}, // csv
			
			}, // line
				
			// Helpers
			helpers: {
			
				testArray: function testArray(expectedArray){
				
					let isArray = false
					
					try { 
					
						if( Array.isArray(expectedArray) ){
							// Pick a random row and test it. It can include only numbers.
							let randomEl = expectedArray[Math.floor(Math.random()*(expectedArray.length-1))]
							
							
							let allPropertiesAreNumber = inputTesting.test.helpers.areAllPropertiesNumeric(randomEl)
							
							if(allPropertiesAreNumber){
								isArray = true
							} // if
						} // if
						return isArray
						
					} catch (e){
						return isArray
					} // try
				
				}, // testArray
				
				areAllPropertiesNumeric: function areAllPropertiesNumeric(singleEl){
				
					let properties = Object.getOwnPropertyNames(singleEl)
							
					let areAllNumeric = properties.reduce(function(isNumber, property){
						return isNumber && typeof(singleEl[property]) == "number"
					}, true)
					
					return areAllNumeric
				
				}, // areAllPropertiesNumeric
			
			}
			
		}, // test
	
		// Maybe make the errors for each file separately?
		error: {
		
			// UNEXPECTED METADATA DATA TYPE
			wrongVarType: {
				report: class wrongVarTypeReport {
					constructor(items){
						this.title = "Metadata variables: unsupported type";
						this.description = "I only know how to support strings and numbers. The following variables have therefore been removed from the session.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // wrongVarTypeReport
				
				
				instances: []
			}, // wrongVarType
		
		
		// ON DEMAND FILES:
		
			// FILE NOT FOUND
			fileNotFound: {
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Missing files";
						this.description = "I thought the following were files that I am able to load. However, I could not find them. The columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport

			
				instances: []
			}, // missingFile
		
		
			// UNSUPPORTED FILE EXTENSION
			unsupportedFileExtension: {
			
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Unsupported file extensions";
						this.description = "I thought the following are files that I am expected to load. However, Aljaz didn't teach me how to load anything but .csv and .json files with particular formats. Instead the columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport
			
				instances: []
			}, // unsupportedFileExtension
		
			
			// UNSUPPORTED FILE STRUCTURE
			unsupportedFileStructure: {
				report: class fileNotFoundReport {
					constructor(items){
						this.title = "On-demand variables: Unexpected data structure";
						this.description = "I loaded the following files, however, I wasn't taught how to handle their particular formats. Instead the columns containing the filenames are available as categorical variables.";
						this.nErrors = items.length,
						this.errors = items;
					}
					
					printout(d){return inputTesting.metadata.report.message(d)} 
				}, // fileNotFoundReport
				
			
				instances: []		
			}, // wrongFileStructure
		
		} // errors
	
	} // inputTesting
  
	
	var variableHandling = {
	
		show: function show(){
		
			let fullscreenContainer = d3.select("div.variable-container")
		
			fullscreenContainer.style("display", "")
			
			variableHandling.coordinateColumnStyles( fullscreenContainer.node() )
		
		}, // show
		
		hide: function hide(){
			
			d3.select("div.variable-container").style("display", "none")
			
		}, // hide
		
		submit: function submit(fullscreenContainer){
		
			return function(d){
				// Collect the classification, and report it for use with dbslice.
				
				// For now change it so that it reports the name and the category.
				let output = fullscreenContainer
				  .select("div.card-body")
				  .selectAll("button.shape-pill")
				  .data()
				  .map(function(d){
					return d.variable
				  })
				
				fullscreenContainer.style("display", "none")
				
				
				// Form a new header.
				let header = importExport.importing.helpers.assignVariables(output)
				
				cfDataManagement.variableUseChange(header)
				
			}	
		
		}, // submit

		make: function make(variableClassification){
			
			// Create the particular config that can flow to all of the DOM elements.
			
			// Maybe merge these?
			var categoryInfo = variableHandling.varData2CategoryData(variableClassification)
		
			// Have the fullscreen container in index.html
			let fullscreenContainer = d3.select("div.variable-container")
			let menuContainer = fullscreenContainer
			  .append("div")
				.attr("class", "card card-menu")
				.datum(categoryInfo)
				
			// Header - add a legend?
			menuContainer
			  .append("div")
				.attr("class", "card-header")
				.each(variableHandling.makeHeader)

			// Body
			let varCategories = menuContainer
			  .append("div")
				.attr("class", "card-body")
				.style("overflow-y", "auto")
				.style("overflow-x", "auto")
			  .append("div")
				.style("display", "table-row")
			  .selectAll("div")
			  .data(d=>d.categories)
			  
			varCategories.enter()
			  .append("div")
				.style("display", "table-cell")
			  .append("div")
				.style("margin-right", "10px")
				.each(variableHandling.makeVariableList)
				
			// Footer
			menuContainer
			  .append("div")
				.attr("class", "card-footer")
			  .append("button")
				.attr("class", "btn btn-success")
				.html("Submit")
				.on("click", variableHandling.submit(fullscreenContainer))	


			// Apply the dragging
			var drag = variableHandling.drag.make()

			menuContainer
			  .select("div.card-body")
			  .selectAll(".draggable")
			  .call(drag)
					
		}, // make
		
		drag: {
		
			make: function make(){
				let h = variableHandling.drag.helpers
			
				var drag = d3.drag()
				  .on("start", function(d){
					  this.classList.add('dragging')
				  
					  
					  d.position.t0 = d3.mouse(this.parentElement)
					  
				  
					  d3.select(this)
						.style("position", "relative")
						.style("left", 0 + "px")
						.style("top", 0 + "px")
					  
					  // Ordinal plots do not support string values. Check if the variable type is compatible with the category.
					  let parent = this.parentElement.parentElement.parentElement.parentElement
					  d.dom = h.findAndSignalPosition(parent)
					  
				  })
				  .on("drag", function(d){
					  let position = d3.mouse(this.parentElement)
				  
					  
					  d.position.x += position[0] - d.position.t0[0]
					  d.position.y += position[1] - d.position.t0[1]
					  
					  d3.select(this)
						.style("position", "relative")
						.style("left", d.position.x + "px")
						.style("top", d.position.y + "px")
				  
					  d.position.t0 = position
					  
					  // This should find the element to move the tag to, and the element to append it after, and store it into d. on end can then just perform the final assignment.
					  // Make a gap as a preview.
					  
					  let parent = this.parentElement.parentElement.parentElement.parentElement
					  let dom_ = h.findAndSignalPosition(parent)
					  
					  if(h.checkVariableCategoryCompatibility(d.variable.type, d3.select(dom_.container).datum().category )){
						  d.dom = dom_
					  } // if
					  
					  
				  })
				  .on("end", function(d){
					  
					  this.remove()
					  d.dom.container.insertBefore(this, d.dom.afterElement)
					  
					  this.classList.remove('dragging')
				  
					  d3.select(this)
						.style("position", "")
						
					  d.position.x = 0
					  d.position.y = 0
					  
					  // Remove gaps, and adjust column heights.
					  variableHandling.coordinateColumnStyles( d.dom.container.parentElement.parentElement.parentElement )
					  
					  // Change the category in the data.
					  d.variable.category = d3.select( d.dom.container ).datum().category
					  
					  
					  
				  })
				  
				return drag
			
			}, // make
		
			helpers: {
			
				findAndSignalPosition: function findAndSignalPosition(parent){
					let h = variableHandling.drag.helpers
		
					let pos = d3.mouse(document.body)
					
					let containers = parent.querySelectorAll('.variable-category')
				
					let currentContainer = h.getDragContainer(containers, pos[0])
					
					// Is it the gap making??
					let afterElement = h.makeGapPreview(currentContainer, pos[1])
				
					return {
						container: currentContainer,
						afterElement: afterElement
					}
				}, // makeGapPreview
				
				makeGapPreview: function makeGapPreview(container, y){
					// A gap should open up in the list to indicate the drop position. 
					let h = variableHandling.drag.helpers
				
					
					let all = [...container.querySelectorAll('.draggable:not(.dragging)')]
					let below = h.getDragAfterElement(all, y)
					
					
					
					// Only add a gap if the closest element isn't the one right after the dragged element.
					
					let draggable = [...container.querySelectorAll(".draggable")];
					let dragged = container.querySelector(".dragging");
					let neighbour = draggable[draggable.indexOf(dragged) + 1]
					
					// Default margin = 2px
					d3.selectAll(draggable).style("margin-top", "2px")
					
					if(neighbour != below.closest){
						d3.select( below.closest ).style("margin-top", "20px")
					} // if

					
					
					
					return below.closest
				}, // makeGapPreview

				getDragAfterElement: function getDragAfterElement(allElements, y) {
				  

				  return allElements.reduce((below, child) => {
					const box = child.getBoundingClientRect()
					const offset = y - box.top - box.height / 2
					// Introduce a counter that also tracks all below. This will be used to offset them.
					if(offset < 0){
						below.elements.push(child)
					} // if
					
					if (offset < 0 && offset > below.offset) {
						below.offset = offset
						below.closest = child
					}
					return below
				  }, { offset: Number.NEGATIVE_INFINITY, elements: [] })
				}, // getDragAfterElement
				
				getDragContainer: function getDragContainer(containers, x){
					// Find the appropriate container, as the dragging was not particularly aesthetic.
					return [...containers].reduce(function(closest, current){
						
						let pos_= closest.getBoundingClientRect()
						let pos = current.getBoundingClientRect()
						
						let isLeft = (x - pos.x) > 0
						let isCloser = (x - pos_.x) > (x - pos.x)
						
						if( isLeft && isCloser ){
							closest = current
						} // if
						return closest
					}, containers[0])
					
				}, // getDragContainer
			
			
				// Move to input testing?
				checkVariableCategoryCompatibility: function checkVariableCategoryCompatibility(varType, categoryType){
					let compatibility
					switch(categoryType){
						case "Categorical":
							compatibility = ["number", "string","file-line","file-contour","file-surface"].includes(varType)
						  break;
						case "Ordinal":
							compatibility = ["number"].includes(varType)
						  break;
						case "Line":
							compatibility = ["file-line"].includes(varType)
						  break;
						case "Contour":
							compatibility = ["file-contour"].includes(varType)
						  break;
						case "Surface":
							compatibility = ["file-surface"].includes(varType)
						  break;
						default:
							compatibility = true
					} // switch
					return compatibility
					
				}, // checkVariableCategoryCompatibility
			
			} // helpers
		
		}, // drag
		
		makeHeader: function makeHeader(){
			
			let color = variableHandling.color(d=>d)
			let types = variableHandling.availableTypes
			
			let header = d3.select(this)
			
			let title = header
				.append("div")
				
			title
			 .append("h4")
				.html("Variable declaration:")
			title
			 .append("button")
			 .attr("class", "btn report")
			 .style("float", "right")
			 .on("click", function(){
				 variableHandling.hide()
				 inputTesting.report.show()
			 })
			 .append("i")
				.attr("class", "fa fa-exclamation-triangle")
			
			
			header.append("div")
			  .selectAll("button.shape-pill")
			  .data(types)
			  .enter()
			  .append("button")
				.attr("class", "shape-pill")
				.style("background-color", color)
			  .append("strong")
				.html(d=>d)
			
		}, // makeHeader
		
		makeVariableList: function makeVariableList(d){
		
			let h = variableHandling
			let color = h.color(d=>d.variable.type)
			let category = d3.select(this)
			function nUnique(vals){
				
				function onlyUnique(value, index, self) { 
					return self.indexOf(value) === index;
				} // unique
				
				return vals.filter(onlyUnique).length
			} // nUnique
			
		
			category
			  .append("h6")
				.html(d.category)
				
			let variableList = category
			  .append("div")
				.attr("class", "variable-category")
			
			let varObjects = h.makeVariableTagObjects(d.vars)
			variableList
			  .selectAll("button")
			  .data(varObjects)
			  .enter()
			  .append("button")
				.attr("class", "shape-pill draggable")
				.style("background-color", color)
				.html(d=>"<strong>"+d.variable.colName+"</strong>")
			  .append("span")
				.attr("class", "badge badge-pill badge-light")
				.style("margin-left", "4px")
				.html(d=>nUnique(d.variable.vals))
				
			
		}, // makeVariableList
		
		makeVariableTagObjects: function makeVariableTagObjects(vars){
			let data = []
			vars.forEach(function(variable){
				data.push({
					variable: variable,
					position: {
						x: 0,
						y: 0,
						t0: undefined,
					},
					dom: {
					  container: undefined,
					  afterElement: undefined
					}
				})
			})
			return data
		}, // makeVariableTagObjects
		
		coordinateColumnStyles: function coordinateColumnStyles(parent){
			
			// Remove any gaps: default margin = 2px
			let menuBody = d3.select( parent )
			menuBody
			  .selectAll(".draggable")
				.style("margin-top", "2px")
			  
			// Consolidate column sizes.
			let divs = menuBody
			  .selectAll("div.variable-category")
			  .style("height", "100%")
			  
			let divHeight = 0
			divs.each(function(d){
				divHeight = this.offsetHeight > divHeight ? this.offsetHeight : divHeight
			})
			divs.style("height", divHeight + "px")
			
		}, // coordinateColumnStyles
		
		
		color: function color(accessor){
			
			let scheme = d3.scaleOrdinal(d3.schemePastel2)
			  .domain(variableHandling.availableTypes)
			  
			return function(d){
				return scheme(accessor(d))
				// return accessor(d) == "string" ? "aquamarine" : "gainsboro"
			}
		}, // color
		
		
		varData2CategoryData: function varData2CategoryData(variableClassification){
			
			// Convert to category info.
			let categoryObj = variableClassification.reduce(function(catObj, varObj){
				if(catObj.categories[varObj.category] == undefined){
					// This category has already been identified, therefore just add 
					catObj.categories[varObj.category] = {
						category: varObj.category,
						vars: [varObj]
					}
				} else {
					// Just add the variable to it.
					catObj.categories[varObj.category].vars.push(varObj)
				} // if
				return catObj
				
			},{categories: {}}) // reduce
			
			
			// Always provide an 'Unused' category too -> this is done here to enforce this is the last category.
			if(categoryObj.categories.Unused == undefined){
				categoryObj.categories.Unused = {category: "Unused", vars: []}
			} // if
			
			
			
			// The output should be an array of object, whereas now it's a single object.
			categoryObj.categories = Object.keys(categoryObj.categories).map(d=>categoryObj.categories[d])
			
			
			
			
			return categoryObj
			
		}, // varData2CategoryData
		
		// Move to input testing
		availableTypes: [
			  "string",
			  "number",
			  "file-line",
			  "file-contour"
		],
		
	} // variableHandling
	
	
    // Handles all tasks connected to importing/exporting data.
	var importExport = {
		// This object controls all the behaviour exhibited when loading in data or session layouts, as well as all behaviour when saving the layout.
		
		// The loading of sessions and data must be available separately, and loading the session should include an option to load in a predefined dataset too.
		
		// It is possible that the session configuration and data will have incompatible variable names. In these cases the user should resolve the incompatibility, but the incompatibility should be presented to them!
		
		// Saving the session is done by downloading a created object. Therefore a session object should be written everytime the view is refreshed.
		
		// The views depending on "Plot Selected Tasks" to be pressed should be loaded in merely as configs in their plotrows, and the corresponding filtering values need to be loaded into their corresponding plots.
		
		
		importing : {
			// WIP: This has to be able to load in data from anywhere on the client computer, not just the server root.
			
			
			
			// DONE: It must be able to load both csv and json fle formats.
			
			// DONE: Must prompt the user if the variables don't include those in existing plots. Solution: does not prompt the user, but for now just removed any incompatible plots.
			
			// WIP: The user must be prompted to identify variables that are different in loaded, and to be loaded data.
			
			// DONE: Handle the case where the user attempts to load data, but selects a session json.
			
			metadata : {
			
				go: function go(file, actionTag){
					
					// Create convenient handles.
					var ld = importExport.importing
					
					
					// This function will fire also when 'cancel' is pressed on the file input menu. In that case skip the following to avoid errors.
					if(file != undefined){
						
					
					
						// Determine if the input adds new data, or if it replaces the data.
						var actionOnInternalStorage = ld.metadata.load.action(actionTag)
						
						
						// Handle the case based on the file type.
						var extension = file.name.split(".").pop();
						switch(extension){
							
							case "csv":
								ld.metadata.load.csv(file, actionOnInternalStorage)
								break;
								
							case "json":
								ld.metadata.load.json(file, actionOnInternalStorage)
								break;
								
							default:
								window.alert("Selected file must be either .csv or .json")
								break;
						}; // switch
					
					} // if
					
				}, // go
				
				load: {
					
					csv: function csv(file, action){
						var ld = importExport.importing
						var url = window.URL.createObjectURL(file)
						
						d3.csv(url).then(function(metadata){
								
							// All the numbers are read in as strings - convert them to strings straight away.
							let data = ld.helpers.getConvertedValues(metadata)
							
					
									
							// Add the source file to tha data - this will also get tested if it's added here.
							data.forEach(function(d){
								d.__file__ = file.name
							})
							
							
							// Store the results of the classifying straight away, and then use the method that will be required to change the variables in hte session to make changes.
							
							
							inputTesting.classifyVariables(data, function(variableClassification){
								
								// This could be csv2json?
								let d = {
									 data : data,
									 header: ld.helpers.assignVariables(variableClassification),
								}
								
								// Store the variables
								action(d);
								
								// Redraw
								render();
								
								// Show the reports.
								if(dbsliceData.data != undefined){
									var canMerge = cfDataManagement.helpers.crossCheckProperties(dbsliceData.data, d)
									if(canMerge){
										variableHandling.show()
									} // if
								} // if
							})
							
						}) // d3.csv
						
						
					}, // csv
					
					json: function json(file, action){
						
						var ld = importExport.importing
						var url = window.URL.createObjectURL(file)
						
						d3.json(url).then(function(metadata){
							// ERROR HANDLING: The metadata must have a `data' attribute that is an iterable. Otherwise show a prompt to the user.
							if(helpers.isIterable(metadata.data)){
							
								// Add the source file to tha data
								metadata.data.forEach(function(d){d.__file__ = file.name})
								
								
								// Change any backslashes with forward slashes
								metadata.data.forEach(function(d){
									ld.helpers.replaceSlashes(d, "taskId");
								}) // forEach
								
								// Store the data appropriately
								action(metadata)
								
								render();
							
							} else {
								
								window.alert("Selected .json file must have iterable property `.data'.")
							} // if
							
						}) // d3.json
						
					}, // json
					
					action: function(actionTag){
						
						let action
						switch(actionTag){
							case "add":
								action = cfDataManagement.cfAdd
							  break
							  
							case "replace":
								action = function(d){
									// cfInit will totally override the internal data.
									cfDataManagement.cfInit(d)
									
									// Update the session.
									importExport.helpers.onDataAndSessionChangeResolve()
								} 
							  break
							  
							default:
								action = cfDataManagement.cfInit
							  break
							
						} // switch
						
						return action
						
					}, // action
					
				}, // load
			
			}, // metadata
			
			session : function session(file){
				// WIP: Must be able to load a session file from anywhere.
				
				// DONE: Must load in metadata plots

				// DONE: Must be able to load in data automatically. If the data is already loaded the loading of additional data must be ignored. Or the user should be asked if they want to add it on top.
				
				// WIP: Must be able to load without data.
				
				// DONE: Must only load json files.
				
				// WIP: Must prompt the user if the variables don't include those in loaded data.
				
				

				var h = importExport.importing.helpers
			
				// Split the name by the '.', then select the last part.
				var extension = file.name.split(".").pop();
				
				// Create a url link to allow files to be loaded fromanywhere on the local machine.
				var url = window.URL.createObjectURL(file)
				
				
				
				switch(extension){
					
					case "json":
						d3.json(url).then(function(sessionData){
							h.assembleSession(sessionData);
						}) // d3.json
						break;
						
					default:
						window.alert("Selected file must be .json")
						break;
				}; // switch
				
			}, // session
		
		    line: {
				
				createFilePromise: function(file){
					
					var i = importExport.importing.helpers
					
					// The extension must be either json or csv
					var extension = file.url.split(".").pop()
					
					switch(extension){
						case "json":
						
						   file.promise = d3.json(file.url).then(function(data){
								file.data = i.json2line( data )
							}).catch(function(d){
								console.log("Loading of a file failed.")
							}) // d3.csv 
						
						  break;
						  
						  
						case "csv":
						
							file.promise = d3.csv(file.url).then(function(data){
								file.data = i.csv2line( data )
							}).catch(function(d){
								console.log("Loading of a file failed.")
							}) // d3.csv 
						
						  break;
						
					} // switch
					
					return file
					
				}, // createFilePromise
				
			}, // line
		
			contour2d: {
				
				createFilePromise: function(file){
					
					var i = importExport.importing.helpers
					
					// The extension must be either json or csv
					var extension = file.url.split(".").pop()
					
					switch(extension){
						case "json":
						
						   file.promise = d3.json(file.url).then(function(data){
								file.data = i.json2contour2d( data )
								// file.data = i.json2contour2dBin( data )
							}).catch(function(d){
								console.log("Loading of a file failed.")
							}) // d3.csv 
						
						  break;
						
					} // switch
					
					return file
					
				}, // createFilePromise
				

			}, // contour2d
			
			
			helpers: {
				
				// METADATA
				renameVariables: function renameVariables(data, oldVar, newVar){
						// This function renames the variable of a dataset.
						for(var j=0; j<data.length; j++){
							// Have to change the names individually.
							data[j][newVar] = data[j][oldVar];
							delete data[j][oldVar];
						}; // for
				}, // renameVariable
				
				getConvertedValues: function getConvertedValues(metadata){
					let h = importExport.importing.helpers
					data = []
					metadata.forEach(function(d){
						data.push( h.convertNumbers(d) )
					})

							
					return data
					
				}, // getConvertedValues
				
				convertNumbers: function convertNumbers(row) {
						// Convert the values from strings to numbers.
						
						var r = {};
						for (var k in row) {
							r[k] = +row[k];
							if (isNaN(r[k])) {
								r[k] = row[k];
							} // if
						} // for
					  return r;
				}, // convertNumbers
								
				replaceSlashes: function replaceSlashes(d, variable){
						// Replace all the slashes in the variable for ease of handling in the rest of the code.
						var variable_ = d[variable];
						d[variable] = variable_.replace(/\\/g, "/");
						
				}, // replaceSlashes
				
				assignVariables: function assignVariables(variableClassification){
					
					// each variable has a category assigned. Assign the variables to the appropriate plots by creating a distribution object.
					
					let h = {
						dataProperties : [],
					    metaDataProperties : [],
						line2dProperties : [],
					    contour2dProperties : []
					}
					
					// Combine in an overall object.
					
					
					variableClassification.forEach(function(varObj){
						switch(varObj.category){
							case "Categorical":
								h.metaDataProperties.push(varObj.colName)
							  break;
							case "Ordinal":
								h.dataProperties.push(varObj.colName)
							  break;
							case "Line":
								h.line2dProperties.push(varObj.colName)
							  break;
							case "Contour":
								h.contour2dProperties.push(varObj.colName)
							  break;
							default:
							  // These are not considered.
							  break;
						} // switch
						
					})
					
					return h
					
				}, // assignVariables
				
				// SESSION
				
				getPlottingFunction: function getPlottingFunction(string){
					// This only creates a function when there are somne properties for that function to use.
					var isDataAvailable = dbsliceData.data.dataProperties.length > 0
					var isMetadataAvailable = dbsliceData.data.metaDataProperties.length > 0
					var isLine2dDataAvailable = dbsliceData.data.line2dProperties.length > 0
					var isContour2dDataAvailable = dbsliceData.data.contour2dProperties.length > 0
					
					var func;
					switch(string){
						case "cfD3BarChart":
							func = isMetadataAvailable? cfD3BarChart : undefined;
							break;
						case "cfD3Histogram":
							func = isDataAvailable? cfD3Histogram : undefined;
							break;
						case "cfD3Scatter":
							func = isDataAvailable? cfD3Scatter : undefined;
							break;
						case "cfD3Line":
							func = isLine2dDataAvailable? cfD3Line : undefined;
							break;
						case "cfD3Contour2d":
							func = isContour2dDataAvailable? cfD3Contour2d : undefined;
							break;
							
						default :
							func = undefined;
							break;
					}; // switch
					return func;
					
				}, // getPlottingFunction
				
				assemblePlots: function assemblePlots(plotsData, plotRow){
					
					var h = importExport.importing.helpers
					
					// Assemble the plots.
					var plots = [];
					plotsData.forEach(function(plotData){
						
						var f = h.getPlottingFunction(plotData.type)
						
						if(f != undefined){
						
							var plotToPush = f.helpers.createLoadedControl(plotData)
							
							// Position the new plot row in hte plot container.
							positioning.newPlot(plotRow, plotToPush)
						
							plotRow.plots.push(plotToPush);
							
						} else {
							// The plotData type is not valid
							window.alert(plotData.type + " is not a valid plot type.")
							
							
						} // if
						
						
					}); // forEach
					
					return plotRow;
					
				}, // assemblePlots
				
				assemblePlotRows: function assemblePlotRows(plotRowsData){
					
					var h = importExport.importing.helpers
					
					// Loop over all the plotRows.
					var plotRows = [];
					plotRowsData.forEach(function(plotRowData){
						var plotRowToPush = {title: plotRowData.title, 
											 plots: [], 
											  type: plotRowData.type,
											  grid: {nx: 12, ny: undefined},
									 addPlotButton: {label : "Add plot"}   }
									
						// Assemble hte plots 
						plotRowToPush = h.assemblePlots(plotRowData.plots, plotRowToPush)
									
						plotRows.push(plotRowToPush);
					})
					
					return plotRows;
					
				}, // assemblePlotRows
				
				assembleSession: function assembleSession(sessionData){
					
					var h = importExport.importing.helpers
				
					// Check if it is a session file!
					if (sessionData.isSessionObject === "true"){
						
						// To simplify handling updating the existing plot rows, they are simply deleted here as the new session is loaded in. Not the most elegant, but it gets the job done.
						// This is done here in case a file that is not a json is selected.
						d3.select("#" + dbsliceData.elementId).selectAll(".plotRow").remove();
						
						
						var plotRows = h.assemblePlotRows(sessionData.plotRows);
						
						// Finalise the session object.
						var session = {
							title : sessionData.title,
							plotRows: plotRows
						};
						
						// Store into internal object
						dbsliceData.session = session;
						
						// Render!
						render()
						
					} else {
						window.alert("Selected file is not a valid session object.")
					}; // if
					
				}, // assembleSession
				
				
				// ON-DEMAND VARIABLES
				handlePropertyNames: function handlePropertyNames(properties){
			
					// NOTES
					// First of all it is important to observe that the _ separates both property name parts, as well as the variable name parts (e.g. it separates the units from the flow property names). This also means that once separated by _ the names can have different amounts of substrings.
					
					// Also note that the bl param file and the distribution files MUST specify bot hthe x and y coordinates of all lines (see notes above). Therefore it is relatively safe to assume that they will have an 'x' and 'y' token in their names. It is also likely that these will be the last tokens.
					
					// If it is assumed that all the properties follow the same naming structure, and that the hierarchy follows along: height - side - property - coordinate, then the variables can be handled after the split from radial file names has been made. This can be made if it is found that no tokens are the same.
					
					// For every nested part the flow variables should reappear n-times, where n is the number of different nesting parts. What if a property is missing from just a single height?
					
					// QUESTIONS:
					// NOTE: parsing all the files in a folder from the browser is not possible. A 'dir' file could be written, but it defeats the purpose. If file selection rules are created to access the files (taskId + token + token, ...) then any tasks without those files will produce errors on loading. Furthermore, appropriate files will have to be provided to include them, which will possibly become misleading. Furthermore, this complicates attempts to visualise tasks with slightly different file naming systems/folder structure.
					
					// Q: What should the files containe (e.g. each file a different line, each file a different variable at different locations, each file all variables at a single position)?
					// A: 
					// 1.) If each file contains a different line then the user will have to select the data to be loaded from a large list of possibilities, in this case 168. Thius could be simplified by allowing the user to pick parts of the name from a list, but that would be awkward. In essence, something like that is being done now anyway, but having the options moved to different controls.
					// 2 & 3.) Different file data separations would then require appropriate interpreters. This would also require even more entries into the metadata such that these files could be located. In this case there are already 6*23 files, and this is after (!) many of the files have been combined. Originally there were 19*23 files to pick from. If each line had an individual file there would be tens of thousands of them.
					
					// Q: Where should the data transformation take place (on load, after loading but before drawing, or on draw)?
					// A: 
					// On draw: The d3 process will assign data to the DOM object on the screen. If the dat ais transformed before the plotting it means that the entire transformed file data will be assigned to an individual line on plotting. This could end up using a lot of memory. It is therefore preferred if the data is already transformed when passed to the plotting, such that only the relevant data may be stored with the object.
					// After loading but before drawing: keeping the file in the original state is ideal if the same file should be used as a data source for several plotting functions. Alternately the functions should use the same input data format, which they kind of have to anyway. Another option is to just transform the data before it is passed to the drawing, but this requires a lot of redundant transforming, which would slow down the app. The issue of differentiating between the parameters is present anyway.
					// On loading: It is best to just transform the data upon load. The it is accessible for all the plotting functions immediately. The transofrmation should be general.
					
					
					
					// Tags could be identified by checking if all variables have them. If they don't a particular item is not a tag. The rule would therefore be that everything between tags belongs to a particular tag. Only 'x', and 'y' at the end would be needed to complete the rule.
					
					
					// METHOD
					// 1.) Create an array of name property objects. These should include the original name, and its parts split by '_'. Token indexes are allowed to facilitate different lengths of values between individual tokens.
					var properties_ = createPropertyObjects(properties)
					
					// 2.) Now that all the parts are know search for any tokens. A TOKEN is a common property name part. 'tokens' is an array of strings. 
					var userTokens = findUserTokens( properties_ )
					

					// Also look for any expected common tokens that might not have been properly specified, like 'ps':'ss', or 'x','y'. These not need be parts of the variable name, if they are present in all of the properties. If they are not they will be left in the property names.
					// The common tokens need to be handled separately, as they allow more than one option for the position.
					// The common tokens cannot be added into the token array directly in this loop, as it is possible that one of the subsequent elements will have it missing. Also, what happens if the name for some reason includes more than one token of of the expected values? Just add all of them.
					var commonTokens = findCommonTokens( properties_ )
					
						
					// 3.) With the tokens known, find their positions in each of the properties, and make the appropriate token options.
					properties_.forEach(function(p){
					
						handleUserTokens(  p, userTokens  )
						handleCommonTokens(p, commonTokens)
						
						// The tokens have now been handled, now get the remainder of the variable name - this is expected to be the flow property.
						handleFlowPropertyName(p)
						
					}) // forEach
					
					// Change the common tokens into an array of string options.
					commonTokens = commonTokens.map(function(o){return o.name})
					
					// Return the properties as split into the tokens etc., but also which additional options are available to the user, and which are common and handled internally.
					
					// Unique user token values ARE stored here. They only indicate which nests are available in the file. For now only one nest is specified, therefore combinations of different ones are not strictly needed, but it would expand the functionality of the code (for e.g. boundary layer profile plotting, or velocity profiles in general)
					
					
					// IMPORTANT NOTE: If a particular subnest does not branch into exactly all of the possibilities of the other subnests, then the order of selecting the tags becomes very important, as it can hide some of the data from the user!!
					
					// Common tokens are only stored so that the internal functionality might realise how the properties should be assembled when the data is being accessed for plotting
					
					var type = getVariableDeclarationType( commonTokens )
					
					
					removeRedundantPropertyFromObjectArray(properties_, "_parts")
					return {properties: properties_,
						   userOptions: getTokenWithOptions(properties_, userTokens),
						 commonOptions: getTokenWithOptions(properties_, commonTokens),
							varOptions: getFlowVarOptions(properties_, type),
								  type: type
						 }
						 
						 
					// handlePropertyNames HELPER FUNCTIONS:
					
					function createPropertyObjects(properties){
						// 'properties' is an array of strings. The output is an array of objects that will be the backbone of the file's data structure.
					
						return properties.map(function(p){
							
							// trim the preceding or trailing blank spaces off.
							
							// Name handling is going to work poorly if all variables share a part, but it actually doesn't mean anything...
							return {val: p,
							_parts: p.split("_")}
						})
					
					} // createPropertyObjects
					
					function findUserTokens( properties_ ){
						// Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
						
						// The initial sample of possible tokens are the parts of the first name. Tokens MUST be in all the names, therefore loop through all of them, and retain only the ones that are in the following ones.
						
						var tokens = properties_[0]._parts
						if(tokens.length > 1){
							// If the first name has more than 1 part, there may be tokens available.
							properties_.forEach(function(p){
							tokens = tokens.filter(function(candidate){ 
								return p._parts.includes(candidate)
								}) // forEach
							}) // forEach
						} else {
							// No tokens available
							tokens = []
						} // if
						
						
						// There may be some tokens in there that are comment tokens. For now this is implemented to hande the decimal part of the height identifiers, which are '0%'.
						
						// Should this be more precise to look for percentage signs in the first and last places only?
						tokens = removeCommentTokens(tokens, ["%", "deg"])
						
						return tokens
					
					} // findUserTokens
					
					function removeCommentTokens(tokens, commentIdentifiers){
						// Removes any tokens that include any character in the commentIdentifiers array of characters.
						commentIdentifiers.forEach(function(commentIdentifier){
							// Perform the filter for this identifier.
							tokens = tokens.filter(function(token){
								return !token.split("").includes(commentIdentifier)
							}) // filter
						}) // forEach
						return tokens
					
					} // removeCommentTokens
					
					function findCommonTokens( properties_ ){
						// Input is the array produced by 'splitPropertyNames'. Output is a filter array of the same class.
						
						// Common tokens allow a single line to be specified by several variables. 
						
						// The "ps"/"ss" aplit does not offer any particular advantage so far. 
						// The "x"/"y" split allows for hte lines to be specified explicitly, as opposed to relying on an implicit position variabhle. This is useful when the flow properties ofr a particular height or circumferential position are not calculated at the same positions (e.g. properties calculated on separate grids).
					
						// The common tokens are hardcoded here.
						var commonTokens = [{name: "side", value: ["ps", "PS", "ss", "SS"]},
											{name: "axis", value: ["x" , "X" , "y" , "Y" ]}]
						
						// Search for the common tokens
						properties_.forEach(function(p){
							commonTokens = commonTokens.filter(function(token){
								var containsPossibleValue = false
								token.value.forEach(function(v){
									containsPossibleValue = containsPossibleValue | p._parts.includes(v)
								}) // forEach
								return containsPossibleValue
							}) // forEach
						}) // forEach
						
						// Here the token is returned with the specified array of expected values. This allows the code to handle cases in which the specified common tokens are a mix of lower and upper case options.
						
						return commonTokens
					
					} // findCommonTokens
					
					function getTokenWithOptions(properties_, tokens){
					
						return tokens.map(function(token){
							// Loop over the properties, and assemble all the possible values for this particular token. The options of the properties have to be read through their tokens array at the moment.
							var allVals = properties_.map(function(p){
								// First find the appropriate token.
								return p[token]
							}) // map
							
							return {name: token,
								 options: helpers.unique( allVals ) }
							
						})
					
					} // getUserTokens
					
					function handleUserTokens(p, tokens){
						// For a given property object 'p', find where in the name the user specified tokens are, and which user specified values belong to them. Push the found name value pairs into p.tokens as an object.
					
						// Find the indices of the individual tokens.
						var ind = []
						tokens.forEach(function(token){
							ind.push( p._parts.indexOf(token) )
						})
						
						// Sort the indices - default 'sort' operates on characters. https://stackoverflow.com/questions/1063007/how-to-sort-an-array-of-integers-correctly
						ind.sort(function(a,b){return a-b;});
						
						// Indices are sorted smallest to largest, so now just go through the parts to assemble the tokens and the options.
						ind.forEach(function(ind_){
							// 'i' is the index of a particular token in the parts of the variable, 'j' is the position of 'i' in the index array.
							
							// As we are splicing from the array for easier identification of the variable name later on, the index will have to be found again every time.
							var t = p.val.split("_")[ind_]
							var start = 0
							var n = p._parts.indexOf( t )
							
							// Add teh appropriate properties to the property object.
							p[ t ] = p._parts.splice( start, n ).join("_")
							
							// Splice out the token name
							p._parts.splice( p._parts.indexOf(t), 1 )
						})
					
					
					} // handleUserTokens
					
					function handleCommonTokens(p, tokens){
						// Here the tokens that are found are converted to lower case for consistency.
					
						// Handle the commonly expected tokens.
						tokens.forEach(function(token){
							
							var values = []
							p._parts.forEach(function(v){
								if ( token.value.includes( v ) ){
									values.push( v.toLowerCase() )
								} // if
							}) // forEach
							
							// Splice all the values out of the parts.
							values.forEach(function(v){
								p._parts.splice( p._parts.indexOf(v),1)
							}) // forEach
							
							
							// Here it is allowed that more than one common token value is present in a variable. This shouldn't happen, but it is present anyway.
							p[token.name] =  values.join("_")
						}) // forEach
					
					} // handleCommonTokens
					
					function handleFlowPropertyName(p){
						// Whatever is left of the parts is the variable name. What about when it is empty? Just leave it empty?
						
						// What to do with possible blank spaces in the name?
						
						
						
						p.varName = p._parts.join("_") == "" ? p.axis : p._parts.join("_")
					
					} // getFlowPropertyName
					
					function removeRedundantPropertyFromObjectArray(A, property){
						
						A.forEach(function(O){
							delete O[property]
						})
					
					} // removeRedundantPropertyFromObjectArray
					
					function getVariableDeclarationType( commonTokens ){
						
						return commonTokens.includes("axis")? "explicit" : "implicit"
					
					} // getVariableDeclarationType
									
					function getFlowVarOptions(properties_, type){
						// 'getFlowVarOptions' sets up which properties this plot can offer to the x and y axes. This can also be used to assign the accessors to the data!
						
						var option = {}
						var varOptions = getTokenWithOptions(properties_, ["varName"])
						varOptions = varOptions[0]
						
						
						
						switch(type){
							case "implicit":
								// Implicit variables can be available on both axes.
								option = {x: varOptions, y: varOptions}
								break;
						
							case "explicit":
								// Explicit variables can be available on only one axes.
								var dummyOption = {
									name: "x",
									options: ["x"]
								}
								option = {x: dummyOption, y: varOptions}
								break;
						
						} // switch
						
						return option
					
					} // getFlowVarOptions
					
				}, // handlePropertyNames
				
				
				// CFD3LINE
				json2line: function json2line(data){
					// json are assumed to have only one series, with several properties possible per series.
					
					let h = importExport.importing.helpers
					// The first element in the 'data' array is the first row of the csv file. Data also has a property 'colums', which lists all the column headers.
					
					// Collect the json variable names differently? 
					// The json file can also contain both implicit and explicit type of data.
					
					// 1 - fully curated json file - load straight in as is
					// 2 - 'csv' json file - parse as csv file. For this there must be a variables property in the file.
					let isJsonCsvFormatted = data.variableNames != undefined
					if( isJsonCsvFormatted ){
						// In this case parse the variable names, and then handle the data.
						var info = h.handlePropertyNames( data.variableNames )
						info.properties = h.formatLineData(info, data.data)
					} else {
						
						// Filter out anything that does not have an array attached!!!
						let propertyNames = Object.getOwnPropertyNames(data)
						propertyNames = propertyNames.filter(function(name){
							return Array.isArray(data[name])
						})
						
						// Must be an appropriately formatted json file.
						var info = h.handlePropertyNames( propertyNames )
						// Clear the common options:
						info.commonOptions = []
						info.type = "explicit"
						info.properties.forEach(function(p){
							p.vals = data[p.varName]
						})
						
						var dummyOption = {
							name: "x",
							options: ["x"]
						}
						info.varOptions.x = dummyOption
						
						// Now data is supposed to be an array of properties!!
					} // if
					
					
					
					// ALREADY HERE CREATE THE ROW DATA THAT CAN BE PASSED INTO PLOTTING.
					// The data should be in rows. But what happens in cases where there cannot be rows? In the case of explicit variables create the series here already.
					
					// If there are no common options
				
					// Keep the data in rows - this is a more natural storage considering that d3.line requests points as separate objects.
					
					
					
					return info
					
				}, // json2line
				
				csv2line: function csv2line(data){
					
					let h = importExport.importing.helpers
					// The first element in the 'data' array is the first row of the csv file. Data also has a property 'colums', which lists all the column headers.
					var info = h.handlePropertyNames( data.columns )
					
					
				
					// Keep the data in rows - this is a more natural storage considering that d3.line requests points as separate objects.
					info.properties = h.formatLineData(info, data)
					
					
					

					// Implement the accessors, and handle the difference between split properties, and single properties! Note that if the file has any common options (ps/ss. x/y) then this is a split variable file. This should be used as the test!
					
					
					return info
					
				
				}, // csv2line
				
				formatLineData: function formatLineData(info, data){
					// This is still a bit of a mess. Write a library that is capable of handling all sorts of mixes of variables.
					
					
					// Create the series.
					var series
					switch( info.type ){
						case "explicit":
							// Explicit means that there is a separation between x and y properties in the variable names.
							
							
							
							var f = helpers.findObjectByAttribute

							// Available properties after applying all the options.
							// Retrieve the properties
							var properties = info.properties
							
							

							// Get all combinations of user options and flow variable options
							var combinations = getAllOptionCombinations([].concat(info.userOptions, info.varOptions.y))
							
							// Loop over all the combinations
							combinations.forEach(function(c){
						
								// Merge the properties for this combination to eliminate the axis or side options.
								mergeProperties(data, info, c)

							}) // forEach
							
							
							// Remove any properties that do not exist.
							series = combinations.filter(function(d){
								return d.vals != undefined
							})

							
						
							
							

						
						  break;
						  
						case "implicit":
							// Data cannot be expressed in x-y pairs, as that would require creating all possible combinations of the parameters. Instead all the variables are stored, and the accessor to the data can be changed.
							series = data
						
					} // if
					
					
					return series
					
					
					function getAllOptionCombinations(options){
						
						var n = 1
						options.forEach(function(option){
							n *= option.options.length
						})
						
						// Repetition frequencies.
						var nn = []
						options.forEach(function(option, j){
							nn[j] = j==0 ? n / option.options.length : nn[j-1] / option.options.length
						})
						
						
						// Create all possible combinations of these options.
						var combinations = []
						// var ind = options.map(d=>0)
						for(let i=0; i<n; i++){
							var c = {}
							
							var i_ = i
							
							// Move from the other direction.
							options.forEach(function(option, j){
								let m = Math.floor( i_ / nn[j] )
								i_ -= m*nn[j]
								// ind[j] =  m
								
								c[option.name] = option.options[m]
							})
							
							combinations.push(c)
						
							
						} // for
						
						return combinations
						
						
					} // getAllOptionCombinations
					
					function mergeProperties(data, info, c){
						// Handle cases where there is x and y separation, but no ps and ss separation, and vice versa.
						
						// if there's no x and y separation the data is implicitly defined.
						
						var properties = info.properties
						Object.getOwnPropertyNames(c).forEach(function(cOptName){
							properties = f( properties, cOptName, c[cOptName], false)
						}) // forEach
						
						// Assign the data to the properties first, and then merge them as needed.
						properties.map(function(property){
							property.vals = data.map(function(d){ return Number( d[property.val] ) })
						})
						
						// At this point the only differences can be x/y and ps/ss.
						switch(properties.length){
							case 4:
							
								var xProperties = f(properties,"axis","x",false)
								var yProperties = f(properties,"axis","y",false)
							
								var xSS = f(xProperties,"side", ["ss"], true)
								var xPS = f(xProperties,"side", ["ps"], true)
								var ySS = f(yProperties,"side", ["ss"], true)
								var yPS = f(yProperties,"side", ["ps"], true)
								
								var ss = data.map(function(d){
									return {x: Number( d[xSS.val] ), 
											y: Number( d[ySS.val] )} })
								var ps = data.map(function(d){
									return {x: Number( d[xPS.val] ), 
											y: Number( d[yPS.val] )}  })
								
								c.vals = ss.concat(ps.reverse())
							
							  break;
							  
							case 2:
								// Type = 'explicit' means that the separation is done by axis.
								
									// Combine x and y properties
									var x = f(properties,"axis","x",true)
									var y = f(properties,"axis","y",true)
									
									c.vals = data.map(function(d){
										return {x: Number( d[x.val] ), 
												y: Number( d[y.val] )} })
								
							  break;
							  
							default: 
							  // This combination does not exist, or is mis-defined.
							  c.vals = undefined
						} // switch
						
					} // mergeVariables
					

					
				}, // formatLineData
	
				// CFD3CONTOUR2D
				json2contour2d: function json2contour2d(data){
					
					// For 2d contours the surfaces attribute has a single object. For 3d contours it has an array of surfaces. In `json2contour3d' the property names will have to be differentiated into options.
					
					// Don't check the property names. The data of the entire domain is too large to be loaded at once.
					data.surfaces = data.surfaces[0]
					
					return {
						properties: Object.getOwnPropertyNames(data.surfaces),
						vals: data
					}
					
				}, // json2contour2d
					
				json2contour2dBin: function json2contour2dBin(json){
					
					let x = json.surfaces.x
					let y = json.surfaces.y
					let size = json.surfaces.size
					let values = json.surfaces.v
					

					// Create values, indices, vertices.
					
					
					let vertices = []
					for(let i=0; i<x.length; i++){
						vertices.push( x[i] )
						vertices.push( y[i] )
					} // for
					
					// It's a structured mesh in this case, but in principle it could be unstructured. The vertices are declared in rows.
					let nx = size[0]
					let ny = size[1]
					
					function grid2vec(row, col){ return row*nx + col }
		
					let indices = []
					let ne, nw, sw, se
					// Create indices into the `vertices' array
					for(let row=0; row<ny-1; row++){
						for(let col=0; col<nx-1; col++){
							// For every row and column combination there are 4 vertices, which make two triangles - the `upper' and `lower' triangles. 
							
							// Corners on a grid. Just the sequential number of the vertex.
							nw = grid2vec( row    , col     )
							ne = grid2vec( row    , col + 1 )
							sw = grid2vec( row + 1, col     )
							se = grid2vec( row + 1, col + 1 )
							
							// `upper'
							indices.push(sw, nw, ne)

							// `lower'
							indices.push(sw, se, ne)
						
						} // for
					} // for
					
					
					
					return {
						vertices: new Float32Array(vertices),
						  values: new Float32Array(values),
						 indices: new Uint32Array(indices),
						 domain: {x: d3.extent(x),
								  y: d3.extent(y),
								  v: d3.extent(values)}
					}
					
					
					
				}, // json2contour2dBin
				
			} // helpers
			
		}, // loadData
		
		exporting : {
			
			session : {
			
				// USE JSON.stringify()? - in that case properties need to be selected, but the writing can be removed. This is more elegant.
				json: function json() {
					// This function should write a session file.
					// It should write which data is used, plotRows, and plots.
					// Should it also write the filter selections made?

					var sessionJson = '';
					write('{"isSessionObject": "true", ');
					write(' "title": "' + dbsliceData.session.title + '", ');
					write(' "plotRows": [');

					var plotRows = dbsliceData.session.plotRows
					plotRows.forEach(function (plotRow, i) {
						
						var plotRowString = writePlotRow(plotRow);
						write(plotRowString);

						if (i < plotRows.length - 1) {
							write(', ');
						} // if

					}); // forEach

					write("]");
					write('}');

					function write(s) {
						sessionJson = sessionJson + s;
					} // write


					function writePlotRow(plotRow) {
						
						var s = "{";
						s = s + '"title": "' + plotRow.title + '", ';
						s = s + '"type": "' + plotRow.type + '", ';
						s = s + '"plots": [';
						
						plotRow.plots.forEach(function (plot, i) {
							
						  // Let the plot write it's own entry.
						  s = s + plot.plotFunc.helpers.writeControl(plot)

						  if (i < plotRow.plots.length - 1) {
							s = s + ', ';
						  } // if

						}); // forEach

						s = s + ']';
						s = s + '}';
						return s;
						
						
						
					} // writePlotRow


				  return sessionJson;
				  
				  
				  // HELPERS
				  function writeOptionalVal(s, name, val){
							
					if (val !== undefined) {
					  s = s + ', ';
					  s = s + '"' + name + '": "' + val + '"';
					} // if
					
				  } // writeOptionalVal
				  
				  function accessProperty(o,p){
					  // When accessing a property of the child of an object it is possible that the child itself is undefined. In this case an error will be thrown as a property of undefined cannot be accessed.
					  // This was warranted as the line plot has it's x and y options left undefined until data is laoded in.
					  return o==undefined? undefined : o[p]
				  } // accessProperty
				  
				}, // json
				
				makeTextFile: function makeTextFile(text) {
					var data = new Blob([text], {
						type: 'text/plain'
					}); 
					
					var textFile = null;
					// If we are replacing a previously generated file we need to
					// manually revoke the object URL to avoid memory leaks.
					if (textFile !== null) {
						window.URL.revokeObjectURL(textFile);
					} // if

					textFile = window.URL.createObjectURL(data);
					
				  return textFile;
				}, // makeTextFile
				
				
			}, // session
			
		}, // exporting

		
		
		
		helpers : {
			
			
			collectPlotProperties: function collectPlotProperties(plot){
				
				var plotProperties = []
				
										
				if( plot.view.xVarOption !== undefined ){
					plotProperties.push( plot.view.xVarOption.val )
				} // if
				
				if( plot.view.yVarOption !== undefined ){
					plotProperties.push( plot.view.yVarOption.val )
				} // if
				
				if( plot.view.sliceId !== undefined ){
					plotProperties.push( plot.view.sliceId )
				} // if
				
				return plotProperties
				
			}, // collectPlotProperties
			
			isPlotCompatible : function isPlotCompatible(plot){
				// Collect all the variables in the current plots (by type!), the variables in the current data, and return them.
				// If there is a variable in th eplot, but not in hthe new data it must either be given, or the plot needs to be removed.
		
				var plotProperties = importExport.helpers.collectPlotProperties(plot)
				
				var arePropertiesAvailable = plotProperties.map(function(p){
					return cfDataManagement.helpers.isPropertyInDbsliceData(p)
				}) // map
				
				// All properties need to be available
			  return arePropertiesAvailable.every(d=>d)				
			}, // isPlotCompatible
			

			onDataAndSessionChangeResolve : function onDataAndSessionChangeResolve(){
				// The data dominates what can be plotted. Perform a check between the session and data to see which properties are available, and if the plots want properties that are not in the data they are removed.

				
				// Loop through all incompatible properties, and remove the plots that are not needed.
				dbsliceData.session.plotRows.forEach(function(plotRow){
					plotRow.plots = plotRow.plots.filter(function(plot){
						
						
						var isPlotCompatible = importExport.helpers.isPlotCompatible(plot)
			
						// Render doesn't remove the plots anymore, so they need to be removed here!
						if( !isPlotCompatible ){
							plot.format.wrapper.remove()
						} else {
							
							console.log("Update the select menus.")
							
						} // if
						
			
					  return isPlotCompatible
						
					}) // map
				}) // forEach
				

			} // onDataChangeResolve

			
			
			
		} // helpers
		
	} // importExport


    exports.initialise = initialise;


    return exports;

}({}));
