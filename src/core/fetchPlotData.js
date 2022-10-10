import { getDataFilterFunc } from '../filters/getDataFilterFunc.js';
import { dbsliceData } from './dbsliceData.js';
import * as d3 from 'd3';

function fetchPlotData( fetchData ) {

    if ( fetchData.url !== undefined ) {

        fetch(fetchData.url)

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
    
        })

        .then(function( responseJson ) {

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

        const allTaskPromises = [];
        const tasksOnPlot = [];

        if ( fetchData.tasksByFilter ) {

            fetchData.taskIds = dbsliceData.filteredTaskIds;
            fetchData.taskLabels = dbsliceData.filteredTaskLabels;
            
        }

        if ( fetchData.taskIds == undefined ) {
            console.log("no tasks yet");
            return null;
        }

	    let nTasks = fetchData.taskIds.length;

	    if ( fetchData.maxTasks !== undefined ) nTasks = Math.min( nTasks, fetchData.maxTasks );

	    for ( let index = 0; index < nTasks; ++index ) {

            tasksOnPlot.push( fetchData.taskIds[index] );

    		let url = fetchData.urlTemplate.replace( "${taskId}", fetchData.taskIds[ index ] );

			let taskPromise = fetch(url).then( function( response ) {

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

		    allTaskPromises.push( taskPromise );

	    }

        return Promise.all( allTaskPromises ).then( function ( responseJson ) {

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

    		data = dataFilterFunc( responseJson, tasksOnPlot, dataFilterConfig );

    	} else {

    		data = responseJson;

    	}

    	return data;

    });

    }

}

export {fetchPlotData};