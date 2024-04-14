import { Observable } from "board-box";
import crossfilter from 'crossfilter2';

class Filter {
    constructor(options) {
        if (!options) { options={} };
        this.type = options.type || "crossfilter";
		this.name = options.name || "filter";
        this.categoricalProperties = options.categoricalProperties || [];
		this.continuousProperties = options.continuousProperties || [];
		this.categoricalUniqueValues = options.categoricalUniqueValues || {};
		this.continuousExtents = options.continuousExtents || {};
		this.categoricalFilterSelected = [];
		this.continuousFilterSelectedRanges = [];
		this.itemIdsInFilter = new Observable({flag: false, state: {itemIds:options.allItemIds, brushing:false} });
        this.requestSetContinuousFilterRange = new Observable({flag: false, state: {}});
        this.requestSetCategoricalFilter = new Observable({flag: false, state: {}});
        console.log(this);

        if (this.type == "crossfilter") {
            console.log("crossfilter");
            console.log(this);
            this.cf = crossfilter( options.data );
            console.log("ok here");
            console.log(this.cf);
            const cf = this.cf;
            this.categoricalDims = this.categoricalProperties.map( p => cf.dimension( d => d[ p ] ) );
            this.continuousDims = this.continuousProperties.map( p => cf.dimension( d => d[ p ] ) );
            this.categoricalDims.forEach( dim => dim.filterAll() );
            this.continuousDims.forEach( dim => dim.filterAll() );
            this.requestSetContinuousFilterRange.subscribe( crossfilterSetContinuousFilterRange.bind(this) );
            this.requestSetCategoricalFilter.subscribe( crossfilterSetCategoricalFilter.bind(this) );
        }

        function crossfilterSetContinuousFilterRange( data ) {
            const dimId = data.dimId;
            const range = data.range;
            const brushing = data.brushing;
            const continuousFilterSelectedRanges = this.continuousFilterSelectedRanges;
            const continuousDims = this.continuousDims;
            continuousFilterSelectedRanges[ dimId ] = range;
            continuousFilterSelectedRanges.forEach( ( selectedRange, i ) => {
                continuousDims[ i ].filterAll();
                if ( selectedRange.length !== 0 ) {
                  continuousDims[ i ].filter( d => d >= selectedRange[ 0 ] && d <= selectedRange[ 1 ] ? true : false );
                }
            } );
            const currentMetaData = this.categoricalDims[0].top(Infinity);
            this.itemIdsInFilter.state = {itemIds: currentMetaData.map( d => d.itemId), brushing };
            this.labelsInFilter = currentMetaData.map( d => d.label );
        }

        function crossfilterSetCategoricalFilter( data ) {
            const dimId = data.dimId;
            const value = data.value;
            const brushing = data.brushing;
            const categoricalFilterSelected = this.categoricalFilterSelected;
            const categoricalDims = this.categoricalDims;

            if ( categoricalFilterSelected[ dimId ] === undefined ) {
                categoricalFilterSelected[ dimId ] = [];
            }
            if ( categoricalFilterSelected[ dimId ].indexOf( value ) !== -1 ) {
                let index = categoricalFilterSelected[ dimId ].indexOf( value );
                categoricalFilterSelected[ dimId ].splice( index, 1 );
            } else {
                categoricalFilterSelected[ dimId ].push( value );
            }

            categoricalFilterSelected.forEach( ( filters, i ) => {
                if ( filters.length === 0 ) {
                  //reset filter
                  categoricalDims[ i ].filterAll();
                } else {
                  categoricalDims[ i ].filter( ( d ) => filters.indexOf( d ) > -1 );
                }
              } );
            const currentMetaData = this.categoricalDims[0].top(Infinity);
            this.itemIdsInFilter.state = {itemIds: currentMetaData.map( d => d.itemId), brushing };
            this.labelsInFilter = currentMetaData.map( d => d.label );
        }
    }
}

export { Filter };