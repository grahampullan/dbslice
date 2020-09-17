
var helpers = {
		
					// General helpers
			unique: function unique(d){		
				// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
				function onlyUnique(value, index, self) { 
					return self.indexOf(value) === index;
				} // unique
				
				return d.filter( onlyUnique )
			
			}, // unique
			
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
			
			} // collectObjectArrayProperty
			

		
	} // helpers
	

export { helpers };