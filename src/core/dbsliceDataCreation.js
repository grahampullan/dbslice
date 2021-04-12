import {dbsliceData} from "./dbsliceData.js";
import {fileManager} from "./fileManager.js";
import * as FILE from "./fileClasses.js";
import {categoryInfo} from "./categoryInfo.js";
import {cfDataManager} from "./cfDataManager.js";
import {helpers} from "./helpers.js";

export var dbsliceDataCreation = {
		
		// Functionality
		make: function(){
			
			// Collect the metadata and all the merger info
			let allMetadataFiles = fileManager.library.retrieve(FILE.metadataFile)
			
			// Construct the appropriate internal data
			let fileobjs = dbsliceDataCreation.makeInternalData(allMetadataFiles)
			fileobjs = dbsliceDataCreation.sortByLoadedMergingInfo(fileobjs, dbsliceData.merging)
			
			
			// Construct the menu itself.
			dbsliceDataCreation.builder.make(fileobjs)
			
		}, // make
		
		show: function show(){
			
			dbsliceDataCreation.make()
			
			let fullscreenContainer = d3.select("#merging-container")
		
			fullscreenContainer.style("display", "")
			
			dbsliceDataCreation.drag.helpers.styling.adjust()
		
		}, // show
		
		hide: function hide(){
			
			d3.select("#merging-container").style("display", "none")
			
		}, // hide
		
		submit: function submit(){
		
			
			// Collect the classification from the ui.
			let mergerInfo = dbsliceDataCreation.collectMergerInfo()
			
			// Store this in the session data.
			dbsliceData.merging = mergerInfo
			
			// Get the merged data.
			let mergedData = dbsliceDataCreation.merge(mergerInfo)
			
			// Store it internally.
			cfDataManager.cfChange(mergedData)
			
			dbsliceDataCreation.hide()
			
		}, // submit
			
		// Here just allow the movement between the categories too
		drag: {
		
		
			make: function make(){
				let h = dbsliceDataCreation.drag.helpers
			
				var drag = d3.drag()
				  .on("start", function(d){
					  this.classList.add('dragging')
				  
					  
					  d.position.t0 = d3.mouse(this.parentElement)
					  
				  
					  d3.select(this)
						.style("position", "relative")
						.style("left", 0 + "px")
						.style("top", 0 + "px")
					  
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
					  
					  
					  
					  // Find the new position to allow for a preview.
					  d.position.dom.container = h.findNewContainer(this)
					  
					  // Make the preview - a border around the cell. Maybe even allow positioning within the cell if the button is positioned over a ghost element.
					  h.preview(d)
					  
				  })
				  .on("end", function(d){
					  
					  // Reposition.
					  d.position.dom.replaceElement = h.findNewPositionInContainer(d.position.dom.container, this)
					  h.reposition(this, d)
					  
					  // Update the internal data element
					  d.variable.category = d3.select(this.parentElement).datum().category
					  
					  // Clear dragging utility
					  this.classList.remove('dragging')
				  
					  d3.select(this)
						.style("position", "")
						
					  d.position.x = 0
					  d.position.y = 0
					  
					  // Remove highlights, and adjust column heights.
					  h.styling.adjust()
					  
					  
				  })
				  
				return drag
			
			}, // make
		
			helpers: {
				
				
				// Functionality
				findNewContainer: function(draggedDOM){
					// Find the container.
					

					
					let container
					let draggedBox = draggedDOM.getBoundingClientRect()
					
					// button -> cell -> category -> file
					d3.select(draggedDOM.parentElement.parentElement.parentElement)
					  .selectAll("div.category")
					  .each(function(d){
						  
						  // Is the draggedDOM over this category.
						  let categoryBox = this.getBoundingClientRect()
						  
						  // Bottom is the bottom of the div as is perceived, but the coordinate system begins top left!
						  if( (categoryBox.bottom > draggedBox.bottom) && 
							  (categoryBox.top < draggedBox.top)          ){
							  
							  // The dragged button is over this container. Check if the variable is allowed to be added to it. Otherwise keep it where it is.
							  if(dbsliceDataCreation.drag.helpers.isContainerCompatible(this, draggedDOM)){
								  container = this
							  } // if
							  
							  
						  } // if
						  
					  })
					  
					if(!container){
						container = draggedDOM.parentElement
					} // if
					
					return container
					
				}, // findNewPosition
				
				isContainerCompatible: function(container, draggedDom){
					// There are restrictions on which items can be dragged to which category.
					
					let category = d3.select(container).datum().category
					let varType = d3.select(draggedDom).datum().variable.type
					
					return categoryInfo.catCompatibleTypes[category].includes(varType)
					
					
				}, // isContainerCompatible
				
				findNewPositionInContainer: function(container, draggedElement){
					// Find the closest element. Calculate the distance between the top of the moved element and the static elements.
					
					// MAYBE CHANGE THIS DYNAMIC TO FIND THE NEAREST GAP, WITH ORIGINAL POSITION, GHOST NODES, AND THE END ARE CONSIDERED?? THAT WOULD LIKELY BE MOST ELEGANT.
					// Still stick with replaceElement, as for all but the final position it works. Forfinal position undefined can be used, and repositioning can figure that out. And also check if sibling element is replaceElement.
					
					// Only allow the elements to move into an open position
					let staticElements = [...container.querySelectorAll('button.shape-pill')]
					let ghostElements = [...container.querySelectorAll('button.ghost')]
				  
				  
					let draggedBox = draggedElement.getBoundingClientRect()

					// Calculate all overlaps and offsets to determine the positioning.
					let candidates = ghostElements.map(child => {
					  let staticBox = child.getBoundingClientRect()
					  return {
						dist: staticBox.bottom - draggedBox.bottom,
						element: child,
					  }
					})
					
					// Push original position. What if original position is last position?
					// Original position
					candidates.push({
						dist: (draggedBox.y - parseInt( draggedElement.style.top )) - draggedBox.top,
						element: draggedElement,
					})
					
					// ALLOW PUSHING PAST THE END!!
					// Last element. Only push if it is different to the original position - only push if you really want to move past the end
					let lastElement = container.lastElementChild
					let lastElementBottom
					if(lastElement == draggedElement){
						// Last element is the dragged one, but try to see what would be best if there was another node after this one.
						lastElementBottom = draggedBox.y - parseInt( draggedElement.style.top ) + 2*draggedBox.height
					} else {
						lastElementBottom = lastElement.getBoundingClientRect().bottom
					} // if
					candidates.push({
						dist: lastElementBottom - draggedBox.bottom,
						element: undefined
					})
				
						
					

					// Find if any overlaps are valid. The minimum overlap is set at 12 so that the margin between the elements does not cancel a repositioning.
					let closest = candidates.reduce(function(best, current){
					  return Math.abs(current.dist) < Math.abs(best.dist) ? current : best 
					}, {dist: Number.POSITIVE_INFINITY})
					
					// Note that this outputs the exact position!
				  
				  return closest.element

				 
				}, // findNewPositionInContainer
				
				
				// Changing the DOM
				preview: function(d){
					
					// A border around the cell. Maybe even allow positioning within the cell if the button is positioned over a ghost element.
					
					// Select all siblings
					d3.select(d.position.dom.container.parentElement.parentElement)
					  .selectAll("div.category")
					  .style("border-style", "none")
					
					d3.select(d.position.dom.container)
					  .style("border-style", "solid")
					
					
				}, // preview
				
				reposition: function(el, d){
					
					// The button is being repositioned. In the original container a ghost button should replace the dragged button.
					
					
					
					if( el != d.position.dom.replaceElement ){
						// If the element should replace itself do nothing.
					
						// Ghost element
						let ghost = dbsliceDataCreation.builder.build.ghostButton()
						el.parentElement.insertBefore(ghost.node(), el)
						el.remove()
					
					
						
						if(d.position.dom.replaceElement){
							// If 'd.dom.replaceElement' is defined then the element should be repositioned. When it is repositioned the 'replaceElement' should be removed. 
						  
							d.position.dom.container.insertBefore(el, d.position.dom.replaceElement)
							d.position.dom.replaceElement.remove()
							
						} else {
							// Append it at the very end.
						  
							d.position.dom.container.appendChild(el)
						  
						} // if
					  
					  
					} // if 
					
					
				}, // reposition
			
				
				styling: {
					
					removeGhostElements: function(categories){
						
						categories.each(function(){
						  
							if(this.childElementCount > 0){
								while(this.lastElementChild.classList.contains("ghost")){
									this.lastElementChild.remove()
								} // while						
							} // if  
							
						  }) // each
						
					}, // removeGhostNodes
					
					
					adjust: function(){
						
						// Helper reference
						let h = dbsliceDataCreation.drag.helpers.styling
						
						// The column sizes need to be controled in rows. But the files are arranged
						let categories = d3.select("#merging-container")
						  .select("div.card-body")
						  .selectAll("div.file")
						  .selectAll("div.categoryWrapper")
						  .selectAll("div.category")
						

						
						// Remove unnecessary ghost nodes.
						h.removeGhostElements(categories)
						
						// Remove all border previews.
						categories.style("border-style", "none")
						
						
						dbsliceDataCreation.operateOverCategories(categories, function(categoryCells){
							h.columnHeights(categoryCells)
							h.colorMergers(categoryCells)
							
						})

						
					}, // adjust
					
					
					// MERGE THE FOLLOWING TWO
					columnHeights: function(relevantCells){
						
						// Find the maximum height
						let h = relevantCells.reduce(function(max, current){
							let h_ = current.wrapper.getBoundingClientRect().height
							return h_ > max ? h_ : max
						}, 0) // reduce
						
						
						relevantCells.forEach(function(d){
							d3.select(d.wrapper).style("height", h + "px")
						}) // forEach
						
						
					}, // columnHeights
						
					colorMergers: function(categoryCells){
						// Color the merges for the relevant cells.
						
						// Create a color scheme here so it's only created once.
						var colorscheme = dbsliceDataCreation.builder.color(el=>d3.select(el).datum().category)
						
						// Operate over individual rows of the category.
						dbsliceDataCreation.operateOverCategoryRows(categoryCells, function(rowElements, anyInvalid){
							
							// Do the coloring
							rowElements.forEach(function(el){
								if(el){
									let clr
									if(anyInvalid){
										clr = el.classList.contains("ghost") ? "white" : "gainsboro"
									} else {
										clr = colorscheme(el.parentElement)
									} // if
									
									d3.select(el).style("background-color", clr)
									
								} // if
							}) // forEach
							
						}) // operateOverCategoryRows
						
					}, // colorMergers
					
					
				}, // styling
				
			
			} // helpers
		
		}, // drag
		

		// Builder
		builder: {
			
			make: function make(fileobjs){
			
				let build = dbsliceDataCreation.builder.build
				
				// Have the fullscreen container in index.html
				let fullscreenContainer = d3.select("#merging-container")
				
				fullscreenContainer.selectAll("*").remove()
				  
				let menuContainer = fullscreenContainer
				  .append("div")
					.attr("class", "card card-menu")
					
				// Header - add a legend?
				menuContainer
				  .append("div")
					.attr("class", "card-header")
					.each( build.header )

				// Body
				// The body will have to contain several groups, each of which is a table-row. Create teh required internal data structure.
				
				menuContainer
				  .append("div")
					.attr("class", "card-body")
					.style("overflow-y", "scroll")
					.style("overflow-x", "auto")
					.datum( fileobjs )
				  .each( build.body )
				  
				  
					
				// Footer
				menuContainer
				  .append("div")
					.attr("class", "card-footer")
					.each( build.footer )
				  


				// Apply the dragging
				var drag = dbsliceDataCreation.drag.make()

				menuContainer
				  .select("div.card-body")
				  .selectAll(".draggable")
				  .call(drag)
						
			}, // make
			
			
			// Building repertoire
			build: {
		
				header: function header(){
					
					let color = dbsliceDataCreation.builder.color(d=>d)
					let types = categoryInfo.supportedCategories
					
					let header = d3.select(this)
					
					let title = header
						.append("div")
						
					title
					 .append("h4")
						.html("Metadata merging:")
					title
					 .append("button")
					 .attr("class", "btn report")
					 .style("float", "right")
					 .on("click", function(){
						 FILE.errors.report.builder.make()
						 FILE.errors.report.show()
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
						
					
					
				}, // header
				
				
				body: function( fileobjs ){
					
					
					// This is the actual body
					d3.select(this)
					  .append("div")
					  .style("display", "table-row")
					  .selectAll("div.files")
					  .data( fileobjs )
					  .enter()
					  .append("div")
						.attr("class", "file")
						.style("display", "table-cell")
						.style("vertical-align", "top")
						.each(dbsliceDataCreation.builder.build.columns)
						
					
						
				}, // body
				
				columns: function (fileobj){
					// Each column is an individual file.
					
					// The filename
					d3.select(this)
					  .append("p")
						.style("text-align", "center")
					  .append("strong")
					  .html(fileobj.filename)
					
					d3.select(this)
					  .selectAll("div.categoryWrapper")
					  .data( fileobj.categories )
					  .enter()
					  .append("div")
						.attr("class", "categoryWrapper")
						.style("display", "table-row")
						.style("vertical-align", "top")
						.each(dbsliceDataCreation.builder.build.category)
					  
					
				}, // columns
				
				category: function(catobj){
					
					let color = dbsliceDataCreation.builder.color(d=>d.variable.category)
					
					// Save the reference to the category wrapper too. The wrapper will be used to adjust the height of the elements as needed.
					catobj.wrapper = this
					
					d3.select(this)
					  .append("div")
					  .attr("class", "category")
					  .style("display", "table-cell")
					  .style("vertical-align", "top")
					  .style("border-style", "none")
					  .style("border-radius", "15px")
					  .selectAll("button.draggable")
					  .data( catobj )
					  .enter()
					  .append("button")
						.attr("class", "shape-pill draggable")
						.style("background-color", color)
						.style("display", "block")
					  .append("strong")
						.html(d=>d.variable.name)
					
				}, // category
					
				ghostButton: function (){
						  
						  return d3.create("button")
							.attr("class", "shape-pill ghost")
							.style("background-color", "red")
							.style("display", "block")
						  
				}, // ghostButton
				
				
				footer: function(){
					
					let foot = d3.select(this)
					
					
					foot
					  .append("button")
						.attr("class", "btn btn-success")
						.html("Submit")
						.on("click", dbsliceDataCreation.submit)
						
						
					// The user can drag in session files or metadata files. Therefore the 'userFile' is used to identify which one it is.
					/*
					var mergeInfoInput = helpers.createFileInputElement( function(files){ fileManager.importing.batch(userFile, files) } )
						
					foot
					  .append("button")
						.attr("class", "btn btn-info")
						.html("Load")
						.on("click", function(){mergeInfoInput.click()})	
					*/
					
				}, // footer
				
			}, // build
			
			
			color: function color(accessor){
				
				let scheme = d3.scaleOrdinal(d3.schemePastel2)
				  .domain(categoryInfo.supportedCategories)
				  
				return function(d){
					
					let category = accessor(d)
					
					return category == "Unused" ? "gainsboro" : scheme(category)
					// return accessor(d) == "string" ? "aquamarine" : "gainsboro"
				}
			}, // color
			
			
		}, // builder
		
		
		// OPERATE OVER DATA
		
		operateOverCategories: function(categories, action){
			
			// Get the data to operate on.
			let categoriesData = []
			categories.each(function(d){
				// Remove all the height properties so that the heights readjust to the content.
				d.wrapper.style.height = ""
				categoriesData.push(d)
			}) // each
			
			// Create optional output.
			var output = {}
			
			// Operate over all the available types.
			categoryInfo.supportedCategories.forEach(function(categoryType){
				
				// Each cell row represents a single category.
				let categoryCells = categoriesData.filter(function(d){ return d.category == categoryType }) // filter
				
				// Allow the action to create an output if necessary.
				action(categoryCells, output)
				
				
			}) // forEach
			
			return output
			
			
		}, // operateOverCategories
		
		operateOverCategoryRows: function(categoryCells, action){
			// For a particular category go over all the cells (one per file), and establish the aliases that can be used when performing the actual data merge later.
			
			// Use .wrapper.querySelector("div.category") to access the actual category.
			let categoryCellsDOM = categoryCells.map(d=>d.wrapper.querySelector("div.category"))
			
			let nMax = Math.max(...categoryCellsDOM.map(d=>d.childElementCount))
			if(Number.isFinite(nMax)){
				
				for(let i=0; i<nMax; i++){
				
					// Get the corresponding elements.
					let rowElements = categoryCellsDOM.map(d=>d.children[i])
					
					
					let anyInvalid = rowElements.some(function(el){
						return  el ? el.classList.contains("ghost") : true
					}) // some
					
					action(rowElements, anyInvalid)
					
				} // for
				
			} // if
			
			
		}, // operateOverCategoryRows
		
		
		// INTERNAL DATA
		makeInternalData: function (allMetadataFiles){
				
			// Yes, I should have other internal data - I don't want to have the internal data bloat the file objects.
			
			
			
			// Find the appropriate index.
			let cat2ind = categoryInfo.cat2ind
			let ind2cat = categoryInfo.ind2cat
			
			let fileobjs = allMetadataFiles.map(function(file){
				// Organise the different categories here.
				
				let catobj = file.content.variables.reduce(function(acc, variable){
				
					let i = cat2ind[variable.category]
				
					acc[i].push({
						filename: file.filename,
						variable: variable,
						position: {
							x: 0,
							y: 0,
							t0: undefined,
							dom: {
								container: undefined,
								replaceElement: undefined
							}
						}
					})
					
					return acc
				}, [[],[],[],[],[]]) // reduce
				
				// Add the category names to the arrays.
				catobj.forEach(function(a, i){
					a.file = file.filename
					a.category = ind2cat[i]
					a.wrapper = undefined
				})
				
				
				// Convert the categories into an array
				let fileobj = {
					filename: file.filename,
					categories: catobj
				} // fileobj
				
								
				return fileobj
			}) // map

			return fileobjs
			
		}, // makeInternalData
		
		
		// Stuff for merger
		
		merge: function(mergerInfo){
			
			
			// Merged data is a completely new item! Therefore it does not need to have alias in its name unnecessarily.
			let allMetadataFiles = fileManager.library.retrieve(FILE.metadataFile)
			
			// The 'mergedData' can be tailored to fit better with 'cfDataManager' later on.
			var tasks = []
			
			
			// Determine what filename_id would work for all files. It is simply defined here, and filenameId and taskId are reserved names.
			let filename_id_name = "filenameId"
			/*
			let filename_id_name = "filename_id"
			let columns = allMetadataFiles.reduce(function(acc, file){
				return acc.concat(file.content.variables.map(d=>d.name))
			},[]) // reduce
			while(columns.includes(filename_id_name)){
				filename_id_name += "_"
			} // while
			*/
			
			allMetadataFiles.forEach(function(metadataFile){
				
				// Loop over all the content and rename the variables.
				metadataFile.content.data.forEach(function(task_){
					// Rename all the necessary variables.
					
					
					// Create a new object to hold the merged data.
					let d_ = {}
					d_[filename_id_name] = metadataFile.filename
					
					
					// mergerInfo is organised by categories. Iterate over all of them here.
					Object.getOwnPropertyNames(mergerInfo).forEach(function(category){
						
						// In the category there are the variable aliases.
						
						Object.getOwnPropertyNames(mergerInfo[category]).forEach(function(variable){
							// Each variable holds the aliases that merge the data.
							d_[variable] = task_[mergerInfo[category][variable][metadataFile.filename]]
							
						}) // forEach
						
					}) // forEach
					
					// Push into the data
					tasks.push(d_)
					
				}) // forEach task
			}) // forEach file
			
			
			// A task id property MUST be present to allow tracking of individual tasks. It MUST have all unique values. If such a property is not present, then create it. If the taskId is not unique it will overwrite it.
			let taskIds = tasks.map(d=>d.taskId)
			if(helpers.unique(taskIds).length != taskIds.length){
				tasks = tasks.map(function(d, i){
					d.taskId = i
					return d
				})
			} // if
			
			
			
			// Create the header expected by dbslice.
			let header = {}
			Object.getOwnPropertyNames(mergerInfo).forEach(function(category){
				header[categoryInfo.cat2prop[category]] = Object.getOwnPropertyNames(mergerInfo[category])
			})
			
			
			return {
				header: header,
				data  : tasks
			}
			
		}, // merge
		
		collectCategoryMergeInfo: function(categoryCells, dict){
			// For a particular category go over all the cells (one per file), and establish the aliases that can be used when performing the actual data merge later.
			
			// 'dict' is an empty object into which the results can be stored.
			
			// For a particular category operate over the individual rows and determine what to do with the variables.
			
			dbsliceDataCreation.operateOverCategoryRows(categoryCells, function(rowElements, anyInvalid){
				
				if(!anyInvalid){
					// Variables can be merged. Create a dictionary with an entry for each variable group. The variable group entry then contains the maps to the corresponding variable for each file. The first element is used to name the group.
					let category = d3.select(rowElements[0].parentElement).datum().category
					let varname = d3.select(rowElements[0]).datum().variable.name
					
					// If needed create the category entry.
					if(!dict[category]){
						dict[category] = {}
					} // if
					
					dict[category][varname] = rowElements.reduce(function(entry, el){
						// Get the data bound to the element.
						let d = d3.select(el).datum()
						entry[d.filename] = d.variable.name
						
						return entry
					}, {}) // reduce
					
				} else {
					
					// This variable is not being used. do nothing.
					
				} // if
			})
			
			return dict
			
			
		}, // collectCategoryMergerInfo
		
		collectMergerInfo: function(){
			// Do everything over categories.
			
			
			let categories = d3.select("#merging-container")
			  .select("div.card-body")
			  .selectAll("div.file")
			  .selectAll("div.categoryWrapper")
			  .selectAll("div.category")
			
			
			let dict = dbsliceDataCreation.operateOverCategories(categories, dbsliceDataCreation.collectCategoryMergeInfo)
			
			return dict
			  
			
		}, // collectMergerInfo
		
		sortByLoadedMergingInfo: function(fileobjs, loadedInfo){
			
			// HOW TO MAKE THEM MISMATCH ANY NON-MATCHED VARIABLES? PUSH GHOST OBJS BETWEEN??
			// FIRST FOCUS ON MAKING EVERYTHING ELSE WORK
			
			// How to make sure that only items that are fully declared are being used?? Filter out the things that are not needed??
			
			// Reorder the variables in the categories.
			fileobjs.forEach(function(fileobj){
				fileobj.categories.forEach(function(catobj){
					
					
					let mergedItems = loadedInfo[catobj.category]
					if(mergedItems){
						
					
						// Create the reordering dict.
						let ind = {}
						Object.getOwnPropertyNames( mergedItems ).forEach(function(varname, pos){
							let nameInTheFile = mergedItems[varname][fileobj.filename]
							ind[nameInTheFile] = pos
						})
						
						// How to manage this sorting so that all the sosrts are respected? How to make sure that the values are placed exactly in the spots required. Maybe simply creating a new array would be better??
						catobj.sort(function(a,b){
			
							let aval = typeof( ind[a.variable.name] ) == "number" ? ind[a.variable.name] : Number.POSITIVE_INFINITY
							let bval = typeof( ind[b.variable.name] ) == "number" ? ind[b.variable.name] : Number.POSITIVE_INFINITY
									
							let val = isNaN( aval - bval ) ? 0 : aval - bval
									
							return val
						})
					
					
					} // if
					
				}) // forEach
			}) // forEach
			
			
			return fileobjs
			
		}, // sortByLoadedMergingInfo
		
			
	} // dbsliceDataCreation
	