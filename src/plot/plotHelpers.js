const plotHelpers = {
        
        getDomain: function getDomain(series, accessor){
            // This function expects an array of objects 'series', that contains all the information about the data, as well as the data itself. 'series' is expected to have the data itself stored in a lover level [dataWrapper]. It expects that the 'variable' data can be accessed using series[n][plotWrapper][variable]  
            
            // Finding the axis limits.
            
            var minVal = d3.min( accessor( series[0] ) );
            var maxVal = d3.max( accessor( series[0] ) );
            
            for (var n = 1; n < series.length; ++n) {
                
                var minVal_ = d3.min( accessor( series[n] ) );
                var maxVal_ = d3.max( accessor( series[n] ) );
                
                minVal = ( minVal_ < minVal ) ? minVal_ : minVal;
                maxVal = ( maxVal_ > maxVal ) ? maxVal_ : maxVal;
            }; // for
            
            return [minVal, maxVal]
            
        }, // getDomain
             
        collectAllPropertyNames: function collectAllPropertyNames(series, accessor){
            // This function collects all the property names in an array of objects.
            var allPropertyNames = [];        
            
            for(var i = 0; i<series.length; i++){
                
                allPropertyNames.push( Object.getOwnPropertyNames( accessor( series[i] ) ) );
                
            }; // for
            
            return allPropertyNames;
            
        }, // collectAllPropertyNames
        
        findCommonElements: function findCommonElements(arrs) {
            // This function goes through all the arrays and finds only the common elements. // Adapted from "https://codereview.stackexchange.com/questions/96096/find-common-elements-in-a-list-of-arrays".
            // It expects an array of arrays as an input.
            
            var resArr = [];
            
            // Loop over elements in the first array.
            for (var i = 0; i<arrs[0].length; i++) {

                // Check if all subsequent arrays have this. If they don't, break the loop and try again. 
                for (var j = arrs.length - 1; j > 0; j--) {
                    if (arrs[j].indexOf(arrs[0][i]) == -1) {
                        break;
                    } // if
                } // for

                // If the loop executed to the end store this property.
                if (j === 0) {
                    resArr.push(arrs[0][i]);
                }; // if
            }
            return resArr;
        }, // findCommonElements
        	
		removePlotTitleControls: function removePlotTitleControls(element){
			
			var controlGroup = d3.select(element.parentElement).select(".plotTitle").select(".ctrlGrp")
			
			// Remove everything.
			controlGroup.selectAll("*").remove()
			
		} // removePlotTitleControls
	} // plotHelpers


export { plotHelpers };