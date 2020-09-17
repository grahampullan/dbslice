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
			d3.select( this.parentElement.parentElement )
                .raise();  
			
            // The delta to the corner should be saved to synchronise the movement with the cursor.
            d.format.position.delta = { x: d3.event.x, 
                                        y: d3.event.y}
										
			
          
        }, // dragStart
            
        dragMove: function dragMove(d,i){
            
            var f = d.format
            var container = d3.select(f.parent)
			let plotWrapper = d3.select( this.parentElement.parentElement )
            let nx = positioning.nx(container)
            let dx = positioning.dx(container)
            let dy = positioning.dy(container)
            
            
  
            // Calculate the proposed new position on the grid.
            // d3.event is relative to the top left card corner
            // d.format.position.ix*dx corrects for the position within the container
            // d.format.position.delta.x corrects for the clicked offset to the corner
            let ix = Math.round( (d3.event.x + f.position.ix*dx - f.position.delta.x) / dx);
            let iy = Math.round( (d3.event.y + f.position.iy*dy - f.position.delta.y) / dy);
          
            
            
          
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
				
                plotWrapper
                  .style("left", (f.parent.offsetLeft + f.position.ix*dx) + "px")
                  .style("top" , (f.parent.offsetTop + f.position.iy*dy) + "px")
                  .raise();  

				builder.refreshPlotRowHeight( container )
				  
            } // if
              
            
          
            
            
            
            
            
          
        }, // dragMove
            
        dragEnd: function dragEnd(d){
            // On drag end clear out the delta.
            d.format.position.delta = undefined
        }, // dragEnd
        
		
		// Resizing plots
		
		resizeStart: function resizeStart(d){
			// Bring hte plot to front.
			d3.select(this.parentElement.parentElement.parentElement.parentElement.parentElement).raise()
			
		}, // resizeStart
		
		resizeMove: function resizeMove(d){
  
  
			// Calculate the cursor position on the grid. When resizing the d3.event.x/y are returned as relative to the top left corner of the svg containing the resize circle. The cue to resize is when the cursor drags half way across a grid cell.
			
			// this < svg < bottom div < plot body < card < plotWrapper
			let plotWrapper = d3.select(this.parentElement.parentElement.parentElement.parentElement.parentElement)
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
				
				// Corrections to force some size. The minimum is an index width/height of 1, and in px. The px requirement is to make sure that the plot does not squash its internal menus etc. In practice 190/290px seems to be a good value.
				iw = iw*dx < 190 ? Math.ceil(190/dx) : iw
				ih = ih*dy < 290 ? Math.ceil(290/dy) : ih
				
				// Correction to ensure it doesn't exceed limits.
				iw = (ix + iw) > nx ? nx - ix : iw
				
				
				// Width must simultaneously not be 1, and not exceed the limit of the container.
					
				p.ih = ih
				p.iw = iw

				
				
				// this < svg < bottom div < plot body < card < plotWrapper
				plotWrapper
				  .style("max-width", iw*dx + "px")
				  .style("width"    , iw*dx + "px" )
				  .style("height"   , ih*dy + "px" )
				  
				plotWrapper.select("div.card")
				  .style("max-width", iw*dx + "px")
				  .style("width"    , iw*dx + "px" )
				  .style("height"   , ih*dy + "px" )
				
				
				// UPDATE THE PLOT
				d.plotFunc.rescale(d)
				
				// Resize the plotrow accordingly
				builder.refreshPlotRowHeight( container )
					
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
			
			
			
			// Somehow count through the domain and see if the plot fits. 
			// First collect all occupied grid nodes.
			
			
			let occupiedNodes = []
			plotRowCtrl.plots.forEach(function(d){
				// Collect the occupied points as x-y coordinates.
				let p = d.format.position
				
				pushNodes(occupiedNodes, p.ix, p.iy, p.iw, p.ih)
				
			}) // forEach plot
			
			
			// Moving through the nodes and construct all nodes taken up if the plot is positioned there.
			
			
			let nx = plotRowCtrl.grid.nx
			let pn = newPlotCtrl.format.position
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
					proposedNodes = pushNodes([], x0, y0, pn.iw, pn.ih)
			
					console.log(x0, y0)
				
				
					// Check if any of the queried points are occupied.
					areaFound = isAreaFree(occupiedNodes, proposedNodes)
				} // if
				
				
				
				// Increase the node index
				ind += 1
			} // while
			
			// If the are was found, the suggested nodes are free. Assign them to the new plot. The first node is the top left corner by the loop definition in pushNodes.
			pn.ix = x0
			pn.iy = y0
			
			
			
			function pushNodes(array, ix, iy, iw, ih){
				
				for(let i=0; i<iw; i++){
					for(let j=0; j<ih; j++){
						array.push({
							ix: ix + i, 
							iy: iy + j
						}) // push
					} // for row
				} // for column
				
				return array
			} // pushOccupiedNodes

			function isAreaFree(existing, proposed){
				
				
				
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
			}
			
			return newPlotCtrl
			
		} // newPlot
        
		
    } // positioning

    	

export { positioning };