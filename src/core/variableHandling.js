import { inputTesting } from './inputTesting.js'
import { importExport } from './importExport.js'


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
		
export { variableHandling };
  