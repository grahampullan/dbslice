import { builder } from '../core/builder.js';

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
			
			
			plotCtrl.data.plotted.forEach(function(d){
				let pn = d.format.position
			
				
				// Position this card, but only if it is unpositioned.
				if( ( (pn.ix == undefined) || isNaN(pn.ix) ) && 
				    ( (pn.iy == undefined) || isNaN(pn.iy) ) ){
					
					// Position the plot.
					positioning.onGrid(plotCtrl.grid.nx, occupiedNodes, pn)
				
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
				
			} // repositionSiblingPlots
			
		} // helpers
		
    } // positioning

    	

export { positioning };