import * as d3 from 'd3v7';

async function getMetaData( config ) {

	const metaData = {};

	if ( !config.metaDataCsv ) {
		let response = await fetch(config.metaDataUrl);
		metaData = await response.json();
	}

	if ( config.metaDataCsv ) {
		let metaDataData = await d3.csv( config.metaDataUrl, d3.autoType );
		metaData.data = metaDataData;
	}

	if ( config.generateTaskIds ) {
		const f = d3.format(config.taskIdFormat);
		metaData.data.forEach( (d, index ) => {
			let taskId = config.taskIdRoot + f(index);
			metaData.data[index] = {...d, taskId:taskId};
		});
	}

	if ( config.setLabelsToTaskIds ) {
		metaData.data.forEach( (d, index) => {
			metaData.data[index] = {...d, label:d.taskId};
		});
	}

	if ( config.generateLabelsFromMetaData !== undefined ) {
		metaData.data.forEach( (d, index) => {
			let label="";
			config.generateLabelsFromMetaData.forEach( k => {
				label += d[k] + "; "
			});
			label = label.slice(0,-2);
			metaData.data[index] = {...d, label:label};
		});
	}

    if ( config.metaDataFilter ) {
        metaData.data = metaData.data.filter( d => d[config.metaDataFilterKey] == config.metaDataFilterValue);
    }

    if ( config.metaDataCsv ) {
        const categoricalProperties = [];
        const continuousProperties = [];
        Object.entries(metaData.data[0]).forEach(entry => {
            if (typeof(entry[1]) == "string") {
                categoricalProperties.push(entry[0]);
            }
            if (typeof(entry[1]) == "number") {
                continuousProperties.push(entry[0]);
            }
        });
        metaData.header = {categoricalProperties, continuousProperties};
    }

	return metaData;

}

export { getMetaData };
