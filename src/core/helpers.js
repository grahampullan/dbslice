
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
	

export { helpers };