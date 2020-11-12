

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
	
    	

export { lasso };