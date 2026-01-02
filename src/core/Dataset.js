import * as d3 from 'd3v7';
import { Filter } from './Filter.js';

class Dataset {
	constructor( options ) {
		if (!options) { options={} }
		this.name = options.name || "dataset";
		this.url = options.url;
		this.csv = options.csv ?? false;
		this.data = options.data ?? null;
		this.metaDataFilter = options.metaDataFilter ?? false;
		this.metaDataFilterKey = options.metaDataFilterKey ?? null;
		this.metaDataFilterValue = options.metaDataFilterValue ?? null;
		this.categoricalProperties = options.categoricalProperties ?? [];
		this.continuousProperties = options.continuousProperties ?? [];
		this.generateItemIds = options.generateItemIds ?? false;
		this.setLabelstoItemIds = options.setLabelstoItemIds ?? false;
		this.autoDetectProperties = options.autoDetectProperties ?? true;
		this.labelFields = Array.isArray(options.generateLabelsFromMetaData)
			? options.generateLabelsFromMetaData
			: Array.isArray(options.labelFields) ? options.labelFields : null;
		this.generateLabelsFromMetaData = !!options.generateLabelsFromMetaData || !!this.labelFields;
		this.discardRowsWithUndefinedValues = options.discardRowsWithUndefinedValues ?? false;
		this.itemIdRoot = options.itemIdRoot ?? "item";
		this.itemIdFormat = options.itemIdFormat ?? "04";
		this.availablePlots = options.availablePlots ?? [];
		this.header = null;
	}

	applyOptions() {
		if (this.data) {
			if (this.metaDataFilter) {
				this.filterRaw();
			}
			if (this.autoDetectProperties && this.categoricalProperties.length === 0 && this.continuousProperties.length === 0) {
				this.autoDetect();
			}
			if (this.generateItemIds) {
				this.generateIds();
			}
			if (this.setLabelstoItemIds) {
				this.setLabelstoIds();
			}
			if (this.generateLabelsFromMetaData && this.labelFields) {
				this.generateLabelsFromData();
			}
			this.getUniqueValuesAndExtents();
		}
	}

	async fetchData() {
		const discardRowsWithUndefinedValues = this.discardRowsWithUndefinedValues;
		if (!this.csv) {
			let response = await fetch(this.url);
			if (!response.ok) {
				throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
			}
			let loadedMetaData = await response.json();
			this.header = loadedMetaData.header || null;
			if (this.header) {
				const cats = this.header.categoricalProperties || this.header.metaDataProperties;
				const conts = this.header.continuousProperties || this.header.dataProperties;
				if (cats?.length) this.categoricalProperties = [...cats];
				if (conts?.length) this.continuousProperties = [...conts];
			}
			this.data = loadedMetaData.data || loadedMetaData;
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

	filterRaw() {
		this.data = this.data.filter( d => d[this.metaDataFilterKey] == this.metaDataFilterValue);
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
		const fields = this.labelFields || [];
		if (!fields.length) return;
		this.data.forEach( (d, index) => {
			let label="";
			fields.forEach( k => {
				label += `${d[k]}; `
			});
			label = label.slice(0,-2);
			this.data[index] = {...d, label};
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
		options.data = this.data;
		options.categoricalProperties = this.categoricalProperties;
		options.continuousProperties = this.continuousProperties;
		options.categoricalUniqueValues = this.categoricalUniqueValues;
		options.continuousExtents = this.continuousExtents;
		options.allItemIds = this.data.map( d => d.itemId );
		const filter = new Filter(options);

		return filter;
	}

}

export { Dataset };


