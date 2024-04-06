import * as d3 from 'd3v7';
import crossfilter from 'crossfilter2';

class Dataset {
	constructor( options ) {
		if (!options) { options={} }
		this.name = options.name || "dataset";
		this.url = options.url;
		this.csv = options.csv || false;
		this.data = options.data || null;
		this.categoricalProperties = options.categoricalProperties || [];
		this.continuousProperties = options.continuousProperties || [];
		this.generateItemIds = options.generateItemIds || false;
		this.setLabelstoItemIds = options.setLabelstoItemIds || false;
		this.autoDetectProperties = options.autoDetectProperties || true;
		this.generateLabelsFromMetaData = options.generateLabelsFromMetaData || false;
		this.discardRowsWithUndefinedValues = options.discardRowsWithUndefinedValues || false;
		this.itemIdRoot = options.itemIdRoot || "item";
		this.itemIdFormat = options.itemIdFormat || "04";
	}

	applyOptions() {
		if (this.data) {
			if (this.autoDetectProperties) {
				this.autoDetect();
			}
			if (this.generateItemIds) {
				this.generateIds();
			}
			if (this.setLabelstoItemIds) {
				this.setLabelstoIds();
			}
			if (this.generateLabelsFromMetaData) {
				this.generateLabelsFromData();
			}
			this.getUniqueValuesAndExtents();
		}
	}

	async fetchData() {
		const discardRowsWithUndefinedValues = this.discardRowsWithUndefinedValues;
		if (!this.csv) {
			let response = await fetch(this.url);
			let loadedMetaData = await response.json();
			this.data = loadedMetaData;
		} else {
			let loadedMetaData = await d3.csv( this.url, csvRowFunction );
			this.data = loadedMetaData;
		}
		this.applyOptions();

		function csvRowFunction(row) {
			if (discardRowsWithUndefinedValues) {
				if (Object.values(row).includes(undefined)) return;
			}
			return d3.autoType(row);
		}
	}

	autoDetect() {
		Object.entries(this.data[0]).forEach(entry => {
			if (typeof(entry[1]) == "string") {
				this.categoricalProperties.push(entry[0]);
			}
			if (typeof(entry[1]) == "number") {
				this.continuousProperties.push(entry[0]);
			}
		});
	}

	generateIds() {
		const f = d3.format(this.itemIdFormat);
		this.data.forEach( (d, index ) => {
			let itemId = this.itemIdRoot + f(index);
			this.data[index] = {...d, itemId:itemId};
		});
	}

	setLabelstoIds() {
		this.data.forEach( (d, index) => {
			this.data[index] = {...d, label:d.itemId};
		});
	}

	generateLabelsFromData() {
		this.data.forEach( (d, index) => {
			let label="";
			this.generateLabelsFromMetaData.forEach( k => {
				label += d[k] + "; "
			});
			label = label.slice(0,-2);
			this.data[index] = {...d, label:label};
		});
	}

	getUniqueValuesAndExtents() {
		const categoricalUniqueValues = {};
		const continuousExtents = {};

		this.categoricalProperties.forEach( ( property, i ) => {
			categoricalUniqueValues[property] = Array.from( new Set(this.data.map( d => d[property]) ) );
		});

		this.continuousProperties.forEach( ( property, i ) => {
			continuousExtents[property] = d3.extent( this.data.map(d => d[property]));
		});
		this.categoricalUniqueValues = categoricalUniqueValues;
		this.continuousExtents = continuousExtents;
	}

	createFilter(options) {
		options = options || {};
		options.type = options.type || "crossfilter";
		options.name = options.name || "filter";

		if (options.type == "crossfilter") {
			return this.createCrossfilter(options);
		}
	}

	createCrossfilter(options) {
		const name = options.name;
		const cf = crossfilter( this.data );
		const categoricalProperties = this.categoricalProperties;
		const continuousProperties = this.continuousProperties;
		const categoricalUniqueValues = this.categoricalUniqueValues;
		const continuousExtents = this.continuousExtents;
		const categoricalDims = [];
		const continuousDims = [];
		categoricalProperties.forEach( ( property, i ) => {
			categoricalDims.push( cf.dimension( d => d[ property ] ) );
		});
		categoricalDims.forEach( dim => dim.filterAll() );
		continuousProperties.forEach( ( property, i ) => {
			continuousDims.push ( cf.dimension( d => d[ property ] ) );
		});
		continuousDims.forEach( dim => dim.filterAll() );
		const categoricalFilterSelected = [];
		const continuousFilterSelectedRanges = [];
		const itemIds = this.data.map( d => d.itemId );
		const filter = {name, cf, categoricalProperties, continuousProperties, categoricalDims, continuousDims, categoricalFilterSelected, continuousFilterSelectedRanges, itemIds, categoricalUniqueValues, continuousExtents};
		return filter;
	}	

}

export { Dataset };





