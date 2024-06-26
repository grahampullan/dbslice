import { getPlotFunc } from '../plot/getPlotFunc.js';
import { dbsliceData } from './dbsliceData.js';
import * as d3 from 'd3';
import { icon } from '@fortawesome/fontawesome-svg-core'
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { update } from './update.js';
import { fetchPlotData } from './fetchPlotData.js';

const makePlotWrapperDefault = function() {

    const plotWrapperDiv = d3.select(`#${this.parentId}`).append("div")
        .datum({_id:this._id, _prid:this._prid})
        .attr( "class", `col-md-${this.layout.colWidth} plot-wrapper` )
        .attr( "id", `plot-wrapper-${this._prid}-${this._id}`)

    const cardDiv = plotWrapperDiv.append("div")
        .attr( "class", "card" );

    const plotHeaderDiv = cardDiv.append("div")
        .attr( "class", "card-header plot-title")
        .attr( "id", `plot-title-${this._prid}-${this._id}`)
        .style( "vertical-align", "middle" )
        .style( "display", "inline-block" )
        .style("padding","2px")
        .style("padding-left","5px")
		
	const plotTitle = plotHeaderDiv.append("div")
		.attr("class", "plot-title-text")
        .attr( "id", `plot-title-text-${this._prid}-${this._id}`)
        .style( "vertical-align", "middle" )
        .style( "display", "inline-block" )
	    .style("float", "left");

    if (this.layout.title) plotTitle.html(this.layout.title);
		
	// Remove plot button option can be explicitly stated by the user as true/false, if not specified thedecision falls back on whether the plot row is metadata or on-demand.
	//if( plotData.layout.removePlotButton == undefined ? !plotRow.ctrl : plotData.layout.removePlotButton ){
	if ( this.layout.removePlotButton ) {
        const boundRemovePlot = this.removePlot.bind(this);
	    plotHeaderDiv.append("button")
	        .attr("class", "remove-plot icon-small")
            .attr("id", `remove-plot-${this._prid}-${this._id}`)
            .attr("plotrowid", this._prid)
            .attr("plotid", this._id)
		    .style("float", "right")
            .style("border", "none")
            .style("background","transparent")
            .style("padding","0px 0px 0px 0px")
            .html(icon(faTrashCan).html)
		    .on("click", boundRemovePlot);          
	} 

    const plotDiv = cardDiv.append( "div" )
    	.attr( "class", "plot")
        .attr( "id", `plot-${this._prid}-${this._id}`)
        .style( "position", "relative");

    this.elementId = `plot-${this._prid}-${this._id}`;
  
}

const makePlotWrapperClean = function() {

}

const removePlot = function() {

    d3.select(`#plot-wrapper-${this._prid}-${this._id}`).remove();

    let plotRows = dbsliceData.session.plotRows;
    let plotRowIndex = plotRows.findIndex( e => e._id == this._prid );
    if ( plotRowIndex >= 0 ) {
        let plotIndex = plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
        if ( plotIndex >=0 ) {
            plotRows[plotRowIndex].plots.splice( plotIndex, 1 );
        }
    }

}

const fetchDataIfNeeded = function( isUpdate = false ) {

    if ( !isUpdate ) {

    } else {

    }

}

const makePlotObject = function(plot) {

    let makePlotWrapper = makePlotWrapperDefault;
    if ( plot.wrapperStyle !== undefined ) {
        if (plot.wrapperStyle == "clean") makePlotWrapper = makePlotWrapperClean;
    }

    let plotFunc = plot.plotFunc;
	if ( plot.plotType !== undefined ) {
		plotFunc = getPlotFunc(plot.plotType); 
	}

    const toAdd = Object.assign({
         makePlotWrapper, 
         removePlot, 
         makeCompleted : false,
         makeStarted : false}, 
         plotFunc );
    const newPlotObject = Object.assign(plot, toAdd);
    return newPlotObject;

}

const plotMakeForD3Each = function( d, i ) {

    if ( d.makeStarted ) return;

    d.makeStarted = true;
    d.makePlotWrapper();

    if ( d.fetchData !== undefined ) {
		fetchPlotData(d.fetchData).then( (data) => {
			d.data = data;
			d.make();
            d.makeCompleted = true;
		})
	} else {
        d.make();
        d.makeCompleted = true;
    }

}

const plotUpdateForD3Each = function( d, i ) {

    let plotRowBody = d3.select(`#plot-row-body-${d._prid}`);
    if ( !d.makeCompleted ) return;

    if ( (d.fetchData !== undefined && d.fetchData._fetchNow )  ||
         (d.fetchData !== undefined && d.fetchData.autoFetchOnFilterChange && dbsliceData.allowAutoFetch) ){
        fetchPlotData(d.fetchData).then( (data) => {
            d.data = data;
            d.layout.newData = true;
            d.fetchData._fetchNow = false;
            if ( plotRowBody.style("display") == "none" ) return;
            d.update();
        })
    } else {
        if ( plotRowBody.style("display") == "none" ) return;
        d.update();
    }

}

const updateAllPlots = function() {

    dbsliceData.session.plotRows.forEach( function(plotRow) {
        let plotRowBody = d3.select(`#plot-row-body-${plotRow._id}`);
        if ( plotRowBody.style("display") == "none") return;
        plotRow.plots.forEach( function (plot) {
            if ( !plot.makeCompleted ) return;
            if ( (plot.fetchData !== undefined && plot.fetchData._fetchNow )  ||
                (plot.fetchData !== undefined && plot.fetchData.autoFetchOnFilterChange && dbsliceData.allowAutoFetch) ){
                fetchPlotData(plot.fetchData).then( (data) => {
                    plot.data = data;
                    plot.layout.newData = true;
                    plot.fetchData._fetchNow = false;
                    plot.update();
                });
            } else {
                plot.update();
            }
        })
    }); 

}

const highlightTasksAllPlots = function() {

    dbsliceData.session.plotRows.forEach( function(plotRow) {
        plotRow.plots.forEach( function (plot) {
            plot.highlightTasks();
        })
    }); 

}



const plotRemoveForD3Each = function( d, i ) {

    const boundRemovePlot = removePlot.bind({_id:d._id, _prid:d._prid});
    boundRemovePlot();

}


export { makePlotObject, plotMakeForD3Each, updateAllPlots, highlightTasksAllPlots, plotUpdateForD3Each, plotRemoveForD3Each };
