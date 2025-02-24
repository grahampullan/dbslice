import { getDataFilterFunc } from '../filters/getDataFilterFunc.js';
//import { dbsliceData } from './dbsliceData.js';
import * as d3 from 'd3';

function fetchPlotData( fetchData, derivedData, dimensions ) {

    if ( fetchData.url !== undefined ) {

        let itemPromise = fetch(fetchData.url)

        .then(function( response ) {

            if ( fetchData.csv === undefined && fetchData.text === undefined && fetchData.buffer === undefined ) {
    
                return response.json();
    
            }
    
            if ( fetchData.csv == true || fetchData.text == true ) {
    
                return response.text() ;
    
            }
    
            if ( fetchData.buffer == true ) {
    
                return response.arrayBuffer() ;
    
            }
    
        });

        return itemPromise.then(function( responseJson ) {

            if ( fetchData.csv == true ) {
    
                responseJson = d3.csvParse( responseJson );
    
            }
            
            let dataFilterFunc;
    
            if (fetchData.dataFilterFunc !== undefined) {
    
                dataFilterFunc = fetchData.dataFilterFunc;
    
            }
    
            if (fetchData.formatDataFunc !== undefined) {
    
                dataFilterFunc = fetchData.formatDataFunc;
                
            }
    
            if (fetchData.dataFilterType !== undefined) {
    
                dataFilterFunc = getDataFilterFunc(fetchData.dataFilterType);
    
            }

            let data;
    
            if (dataFilterFunc !== undefined ) {
    
                data = dataFilterFunc( responseJson, fetchData.dataFilterConfig ); 
    
            } else {
    
                data = responseJson;
    
            }
    
            return data;
    
        } );

    }

    if ( fetchData.urlTemplate !== undefined ) {

        const allItemPromises = [];
        const itemsOnPlot = [];

        //if ( fetchData.tasksByFilter ) {
        //
        //    fetchData.taskIds = dbsliceData.filteredTaskIds;
        //    fetchData.taskLabels = dbsliceData.filteredTaskLabels;
        //    
        //}

        if ( fetchData.itemIds == undefined ) {
            console.log("no itemIds yet");
            return null;
        }

	    let nItems = fetchData.itemIds.length;

	    if ( fetchData.maxItems !== undefined ) nItems = Math.min( nItems, fetchData.maxItems );

	    for ( let index = 0; index < nItems; ++index ) {

            itemsOnPlot.push( fetchData.itemIds[index] );

    		let url = fetchData.urlTemplate.replace( "${itemId}", fetchData.itemIds[ index ] );

			let itemPromise = fetch(url).then( function( response ) {

				if ( fetchData.csv === undefined && fetchData.text === undefined && fetchData.buffer === undefined ) {

                    return response.json();

                }

                if ( fetchData.csv == true || fetchData.text == true ) {

                    return response.text() ;

                }

                if ( fetchData.buffer == true ) {
    
                    return response.arrayBuffer() ;
        
                }

			});

		    allItemPromises.push( itemPromise );

	    }

        return Promise.all( allItemPromises ).then( function ( responseJson ) {

        if ( fetchData.csv == true ) {

            const responseCsv = [];

            responseJson.forEach( function(d) {

                responseCsv.push( d3.csvParse(d) );

            });

            responseJson = responseCsv;

        }

        let dataFilterFunc;

        if (fetchData.dataFilterFunc !== undefined) {

            dataFilterFunc = fetchData.dataFilterFunc;

        }

        if (fetchData.formatDataFunc !== undefined) {

            dataFilterFunc = fetchData.formatDataFunc;
            
        }

        if (fetchData.dataFilterType !== undefined) {

            dataFilterFunc = getDataFilterFunc(fetchData.dataFilterType);

        }

        let data;

    	if (dataFilterFunc !== undefined ) {

            let dataFilterConfig = fetchData.dataFilterConfig;

    		data = dataFilterFunc( responseJson, itemsOnPlot, dataFilterConfig );

    	} else {

    		data = responseJson;

    	}

    	return data;

    });

    }

    if ( fetchData.derivedDataName !== undefined ) {

        let derivedDataStore = derivedData.find( d => d.name == fetchData.derivedDataName );

        if ( derivedDataStore === undefined ) {

            console.log("Derived data store not found");

            return null;

        }

        let dataFilterFunc;
    
        if (fetchData.dataFilterFunc !== undefined) {
    
            dataFilterFunc = fetchData.dataFilterFunc;
    
        }
    
        if (fetchData.formatDataFunc !== undefined) {
    
            dataFilterFunc = fetchData.formatDataFunc;
                
        }
    
        if (fetchData.dataFilterType !== undefined) {
    
            dataFilterFunc = getDataFilterFunc(fetchData.dataFilterType);
    
        }

        let data;
    
        if (dataFilterFunc !== undefined ) {
    
            data = dataFilterFunc( derivedDataStore.data, fetchData.dataFilterConfig ); 
    
        } else {
    
            data = derivedDataStore.data;
    
        }

        return Promise.resolve( data );

    }

    if ( fetchData.getUrlFromDimensions !== undefined ) {

        const getUrlFromDimensions = fetchData.getUrlFromDimensions;
        let dimsNotSet = false;
        const indx = getUrlFromDimensions.dimensionNames.map( (dimName, i) => {
            const offset = getUrlFromDimensions.offsets[i];
            const multiplier = getUrlFromDimensions.multipliers[i];
            const dim = dimensions.find( d => d.name == dimName );
            const value = dim.state.value;
            if ( value == null || value == undefined ) {
                dimsNotSet = true;
            }
            const index = parseInt( (value + offset) * multiplier);
            return index;
        });
        if (dimsNotSet) {
            console.log("One or more dimensions not set");
            return Promise.resolve( undefined ); // return empty data
        }
        let url = getUrlFromDimensions.urlTemplate;
        indx.forEach( (i, j) => {
            url = url.replace(`\${indx${j}}`, i);
        });

        let itemPromise = fetch(url).then(function( response ) {

            if ( fetchData.csv === undefined && fetchData.text === undefined && fetchData.buffer === undefined ) {
    
                return response.json();
    
            }
    
            if ( fetchData.csv == true || fetchData.text == true ) {
    
                return response.text() ;
    
            }
    
            if ( fetchData.buffer == true ) {
    
                return response.arrayBuffer() ;
    
            }
    
        });

        return itemPromise.then(function( responseJson ) {

            if ( fetchData.csv == true ) {
    
                responseJson = d3.csvParse( responseJson );
    
            }
            
            let dataFilterFunc;
    
            if (fetchData.dataFilterFunc !== undefined) {
    
                dataFilterFunc = fetchData.dataFilterFunc;
    
            }
    
            if (fetchData.formatDataFunc !== undefined) {
    
                dataFilterFunc = fetchData.formatDataFunc;
                
            }
    
            if (fetchData.dataFilterType !== undefined) {
    
                dataFilterFunc = getDataFilterFunc(fetchData.dataFilterType);
    
            }

            let data;
    
            if (dataFilterFunc !== undefined ) {
    
                data = dataFilterFunc( responseJson, fetchData.dataFilterConfig ); 
    
            } else {
    
                data = responseJson;
    
            }
    
            return data;
    
        } );

    }

}

export {fetchPlotData};