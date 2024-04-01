import { getDataFilterFunc } from '../filters/getDataFilterFunc.js';
//import { dbsliceData } from './dbsliceData.js';
import * as d3 from 'd3';

function fetchPlotData( fetchData ) {

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

}

export {fetchPlotData};