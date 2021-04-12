export var helpers = {
		
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
			
			arrayEqual: function arrayEqual(A, B){
				
				return helpers.arrayIncludesAll(A, B)
					&& helpers.arrayIncludesAll(B, A)
				
			}, // arrayEqual
			
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
			
			setDifference: function (A, B){
				
				let a = new Set(A);
				let b = new Set(B);
				
				return { 
				  aMinusB: new Set([...a].filter(x => !b.has(x))),
				  bMinusA: new Set([...b].filter(x => !a.has(x)))
				}
			}, // setDifference
			
			// Comparing file contents
			
			
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
			
			
			// FILES
			createFileInputElement: function createFileInputElement(loadFunction){
				
				// This button is already created. Just add the functionaity.
				var dataInput = document.createElement('input');
				dataInput.type = 'file';

				dataInput.onchange = function(e){
					loadFunction(e.target.files)
				}; // onchange
				
			  return dataInput
				
			}, // createFileInputElement
		   
			
	} // helpers
	