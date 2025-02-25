//import { dbsliceData } from '../core/dbsliceData.js';
//import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
//import d3tip from 'd3-tip';
import { Plot } from './Plot.js';
import { la } from 'nd4js';

class LineSeries extends Plot {

    constructor(options) {
		if (!options) { options={} }
        options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:5, right:20, bottom:30, left:53};
        super(options);
    }

    make() {
        const container = d3.select(`#${this.id}`);
        this.updateHeader();
        this.addPlotAreaSvg();
        this.setLasts();

        // subscribe to filter.highlightItemIds
        if ( this.layout.highlightItems ) {
            this.filterId = this.layout.filterId;
            const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
            const obsId = filter.highlightItemIds.subscribe( this.highlightItems.bind(this) );
            this.subscriptions.push({observable:filter.highlightItemIds, id:obsId});
        }

        // subscribe to filter.itemIdsInFilter
        if (this.fetchData) {
            if (this.fetchData.urlTemplate) {
                this.filterId = this.fetchData.filterId;
                const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
                const obsId = filter.itemIdsInFilter.subscribe( this.handleFilterChange.bind(this) );
                this.subscriptions.push({observable:filter.itemIdsInFilter, id:obsId});
                this.datasetId = this.fetchData.datasetId;
                const dataset = this.sharedStateByAncestorId["context"].datasets.find( d => d.id == this.datasetId );
                if (this.fetchData.getItemIdsFromFilter) {
                    this.fetchData.itemIds = filter.itemIdsInFilter.state.itemIds;
                }
                if (this.fetchData.dataFilterConfig) {
                    const config = this.fetchData.dataFilterConfig;
                    config.itemLabels = this.fetchData.itemIds.map( id => dataset.data.find( i => i.itemId == id ).label );
                    if (config.cProperty) {
                        config.cPropertyValues = this.fetchData.itemIds.map( id => dataset.data.find( i => i.itemId == id )[config.cProperty] );
                    }
                }
            }

            // subscribe to derivedDataStore.newData
            if (this.fetchData.derivedDataName) {
                const derivedData = this.sharedStateByAncestorId["context"].derivedData;
                let derivedDataStore = derivedData.find( d => d.name == this.fetchData.derivedDataName );
                if (!derivedDataStore) {
                    this.sharedStateByAncestorId["context"].requestCreateDerivedDataStore.state = {name:this.fetchData.derivedDataName};
                    derivedDataStore = derivedData.find( d => d.name == this.fetchData.derivedDataName );
                }
                const obsId = derivedDataStore.newData.subscribe( this.handleDerivedDataChange.bind(this) );
                this.subscriptions.push({observable:derivedDataStore.newData, id:obsId});
            }

            // subscribe to dimensions
            if (this.fetchData.getUrlFromDimensions) {
                const requestCreateDimension = this.sharedStateByAncestorId["context"].requestCreateDimension;
                const dimensions = this.sharedStateByAncestorId["context"].dimensions;
                const dimensionNames = this.fetchData.getUrlFromDimensions.dimensionNames;
    
                dimensionNames.forEach( dimName => {
                    requestCreateDimension.state = {name:dimName, value:null };
                    const dimension = dimensions.find( d => d.name == dimName ); 
                    const obsId = dimension.subscribe( this.handleDimensionChange.bind(this) );
                    this.subscriptions.push({observable:dimension, id:obsId});
                });
            }
            
        }

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.cuts = [];
        this.update();
    }

    async update() {
        if (this.fetchingData) return;
        await this.getData();

        if (!this.data || this.data.series.length == 0) return;
        if (!this.newData && !this.checkResize) return;

        const container = d3.select(`#${this.id}`);
        const layout = this.layout;
        const plotArea = container.select(".plot-area");
        const highlightItemsFlag = layout.highlightItems;
        let highlightItemIds;
        if (highlightItemsFlag) {
            const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
            highlightItemIds = filter.highlightItemIds;
        }
        const timeSync = layout.timeSync;
        const xAxisMean = layout.xAxisMean;
        const yAxisMean = layout.yAxisMean;
        const margin = layout.margin;

        
        
        // colour scale
        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        if ( layout.cSet !== undefined) {
            if ( Array.isArray( layout.cSet ) ) {
                colour.domain( layout.cSet );
            } else {
                const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
                colour.domain( filter.categoricalUniqueValues[ layout.cSet ] );
            }
        }

        //this.updateHeader();
        this.updatePlotAreaSize();

        const nSeries = this.data.series.length;
        const clipId = `${this.id}-clip`;
        const width = this.plotAreaWidth;
        const height = this.plotAreaHeight;

        // time varying data (note format of data)
        if ( timeSync ) {
            let timeSlider = container.select(".time-slider");
            if ( timeSlider.empty() ) {
			    container.insert("input",":first-child")
				    .attr("class", "form-range time-slider")
				    .attr("type","range")
				    .attr("min",0)
				    .attr("value",0)
				    .attr("max",nSeries-1)
				    .attr("step",1)
				    .on( "input", timeStepSliderChange );
                
                let handler = {
                    set: function(target, key, valueset) {
                        target[key] = valueset;
                        if (key = 'iStep') {
                            container.select(".time-slider").node().value=valueset;
                            highlightTimeStep(valueset);
                        }
                        return true;
                    }
                };
                let watchedTime = new Proxy({iStep:0}, handler);
                this.watchedTime = watchedTime;
            }
		}

        //
        // find the x and y ranges
        //
        this.setRanges();

        //
        // set the x and y scales
        //
        this.setScales();
        const xScale = this.xScale;
        const yScale = this.yScale;
        const xScale0 = this.xScale0;
        const yScale0 = this.yScale0;

        //
        // initialise cuts
        //
        this.initCuts();
        

        //
        // set line function
        //
        let line;
        if ( !layout.segmentedLine ) {
            line = d3.line()
                .x( d => xScale( d.x ) )
                .y( d => yScale( d.y ) );
        } else {
            function segLine(lineSegs) {
                let line = d3.line()
                    .x( d => xScale( d.x ) )
                    .y( d => yScale( d.y ) );
                let path="";
                lineSegs.forEach(d => {
                    let seg=[{x:d[0][0], y:d[0][1]},{x:d[1][0],y:d[1][1]}];
                    path += line(seg);
                });
                return path;
            }
            line = segLine;
        }
        this.line = line;

        //
        // clip area
        //
        const clipRect = plotArea.select(".clip-rect");
        if ( clipRect.empty() ) {
            plotArea.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("class","clip-rect")
                    .style("position", "absolute")
                    .attr("width", width)
                    .attr("height", height)
                    .style("left", `${this.plotAreaLeft}px`)
                    .style("top", `${this.plotAreaTop}px`);
        } else {
            clipRect.attr("width", width)
                .attr("height", height)
                .style("left", `${this.plotAreaLeft}px`)
                .style("top", `${this.plotAreaTop}px`);
        }

        // zoom
        if (!this.zoomSet) {
            const boundZoomed = zoomed.bind(this);
            const zoom = d3.zoom()
                .scaleExtent([0.5, Infinity])
                .on("zoom", boundZoomed);
            plotArea.transition().call(zoom.transform, d3.zoomIdentity);
            plotArea.call(zoom);
            this.zoomSet = true;
        }

        // focus circle
        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        //
        // draw one line for each series in series array
        //
        if (!xAxisMean && !yAxisMean) {

            const allSeries = plotArea.selectAll( ".plot-series" ).data( this.data.series, k => k.itemId );

            allSeries.enter()
                .each( function() {
                    let series = d3.select( this );
                    let seriesLine = series.append( "g" )
                        .attr( "class", "plot-series")
                        .attr( "series-name", d => d.label )
                        .attr( "clip-path", `url(#${clipId})` )
                        .append( "path" )
                            .attr( "class", "line" )
                            .attr( "d", d => line( d.data ) )
                            .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } )    
                            .style( "fill", "none" )
                            .style( "stroke-width", "2.5px" )
                            .attr( "clip-path", `url(#${clipId})` )
                            .on( "mouseover", tipOn )
                            .on( "mouseout", tipOff );
            } );

            allSeries.each( function() {
                let series = d3.select( this );
                let seriesLine = series.select( "path.line" );
                seriesLine
                    .attr( "d", d => line( d.data ) );
                    //.style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } )  ;
            } );

            allSeries.exit().remove();

        }

        // if xAxisMean - compute mean and std deviation (area) data 
        let area;
        let areaData = [];
        if ( xAxisMean ) {
            area = d3.area()
                .y( d => yScale(d.y) )
                .x0( d => xScale(d.x0 ))
                .x1( d => xScale(d.x1 ));
            let seriesGroupedByCKey = Array.from(d3.group(this.data.series, d => d.cKey));
            seriesGroupedByCKey.forEach( s => {
                let areaNow = {};
                areaNow.c = s[0];
                areaNow.data = [];
                let nPts = s[1][0].data.length;
                for (let i=0; i < nPts; i++) {
                    let areaPt={};
                    let xValues = s[1].map(d => d.data[i].x);
                    if (xValues.length == 1) {
                        xValues.push(xValues[0]);
                    }
                    let xMean = d3.mean(xValues);
                    let stdDev = d3.deviation(xValues);
                    areaPt.y = s[1][0].data[i].y;
                    areaPt.x = xMean;
                    areaPt.x0 = xMean - stdDev;
                    areaPt.x1 = xMean + stdDev;
                    areaNow.data.push(areaPt);
                }
                areaData.push(areaNow);
            });
        }
        
        // if yAxisMean - compute mean and std deviation (area) data
        if ( yAxisMean ) {
            area = d3.area()
                .x( d => xScale(d.x) )
                .y0( d => yScale(d.y0 ))
                .y1( d => yScale(d.y1 ));
            let seriesGroupedByCKey = Array.from(d3.group(this.data.series, d => d.cKey));
            seriesGroupedByCKey.forEach( s => {
                let areaNow = {};
                areaNow.c = s[0];
                areaNow.data = [];
                let nPts = s[1][0].data.length;
                for (let i=0; i < nPts; i++) {
                    let areaPt={};
                    let yValues = s[1].map(d => d.data[i].y);
                    if (yValues.length == 1) {
                        yValues.push(yValues[0]);
                    }
                    let yMean = d3.mean(yValues);
                    let stdDev = d3.deviation(yValues);
                    areaPt.x = s[1][0].data[i].x;
                    areaPt.y = yMean;
                    areaPt.y0 = yMean - stdDev;
                    areaPt.y1 = yMean + stdDev;
                    areaNow.data.push(areaPt);
                }
                areaData.push(areaNow);
            });
        }

        //
        // draw areas representing std deviations and mean lines
        //
        if ( xAxisMean || yAxisMean ) {

            const areas = plotArea.selectAll( ".area" ).data( areaData, k => k.c );

            areas.enter()
                .each( function() {
                    d3.select( this ).append("path")
                        .attr("class","area")
                        .attr("fill", d => colour(d.c))
                        .style("opacity", 0.5)
                        .attr( "clip-path", `url(#${clipId})`)
                        .attr("d", d => area(d.data));
            } );

            areas.each( function() {
                d3.select( this ).transition()
                    .attr( "d", d => area( d.data ) )
            } );

            areas.exit().remove(); 

            const meanLines = plotArea.selectAll( ".mean-line" ).data( areaData, k => k.c );

            meanLines.enter()
                .each( function() {
                    d3.select( this ).append("path")
                        .attr("class","mean-line")
                        .style("stroke", d => colour(d.c))
                        .style("stroke-width", "2.5px")
                        .style("fill","none")
                        .attr( "clip-path", `url(#${clipId})` )
                        .attr("d", d => line(d.data))
                        .on( "mouseover", tipOnMeanLine )
                        .on( "mouseout", tipOffMeanLine );
            } );

            meanLines.each( function() {
                d3.select( this ).transition()
                    .attr( "d", d => line( d.data ) );
                d3.select( this ).raise();
            } );

            meanLines.exit().remove();

        }

        //
        // add cut lines
        //
        this.addCutLines();


        //
        // axes
        //
        const xAxis = d3.axisBottom( xScale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yScale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0,${height})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(layout.xAxisLabel);
        } else {
            gX.attr( "transform", `translate(0,${height})` )
            gX.call( xAxis );
            gX.select(".x-axis-text").attr("x", width)
        }

        let gY = plotArea.select(".axis-y");
        if ( gY.empty() ) {
            gY = plotArea.append("g")
                .attr( "class", "axis-y")
                .call( yAxis );
            gY.append("text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 0)
                    .attr("y", -margin.left + 15)
                    .attr("text-anchor", "end")
                    .text(layout.yAxisLabel);
        } else {
            gY.call( yAxis );
        }

        // time varying
        if ( timeSync ) {
            highlightTimeStep(this.watchedTime.iStep);
        }

        function highlightTimeStep(iStep) {
            let lines = plotArea.selectAll(".line");
            lines
                .style( "stroke" , "#d3d3d3")
                .style( "stroke-width", "2.5px" );
            let currentLine = lines.filter( d => d.itemId == iStep);
            currentLine
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                .style( "stroke-width", "4px" )
                .each(function() {
                    this.parentNode.parentNode.appendChild(this.parentNode);
                });
        }

        function timeStepSliderChange() {
			let iStep = this.value;
			if ( timeSync ) {
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot) =>  {
                    if (plot.watchedTime !== undefined) {
					    plot.watchedTime.iStep = iStep;
                    }
				});
			}
			highlightTimeStep(iStep);
		}

        // zoom behaviour
        function zoomed(event) {
            const t = event.transform;
            xScale.domain(t.rescaleX(xScale0).domain());
            yScale.domain(t.rescaleY(yScale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr( "d", d => line( d.data ) );
            plotArea.selectAll(".area").attr( "d", d => area( d.data ) );
            plotArea.selectAll(".mean-line").attr( "d", d => line( d.data ) );
            this.cuts.forEach( cut => this.setCutLinePosition(cut.dimensionName) );
        }

        // mouse over behaviour
        function tipOn( event, d ) {
            let lines = plotArea.selectAll(".line");
            lines.style( "stroke" , "#d3d3d3");
            let target = d3.select(event.target);
            target
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                .style( "stroke-width", "4px" )
                .each(function() {
                    this.parentNode.parentNode.appendChild(this.parentNode);
                });
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html("<span>"+d.label+"</span>")
                .style("left", d3.pointer(event)[0]+ "px")
                .style("top", d3.pointer(event)[1] + "px");
            if ( highlightItemsFlag ) {
                highlightItemIds.state = { itemIds : [ d.itemId ] };
            }
                
            if ( timeSync ) {
                container.select(".time-slider").node().value = d.itemId;
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex && plot.watchedTime !== undefined) {
						plot.watchedTime.iStep = d.itemId;
					}
				});
            }
        }

        // mouse out behaviour
        function tipOff(event,d) {
            if ( !timeSync ) {
                let lines = plotArea.selectAll(".line");
                lines
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                    .style( "stroke-width", "2.5px" );
            }
            container.select(".tool-tip").style("opacity", 0.0)
            if ( highlightItemsFlag ) {
                highlightItemIds.state = { itemIds : []  };
            }
        }

        // mouse over behaviour for mean lines
        function tipOnMeanLine( event, d ) {
            let lines = plotArea.selectAll(".mean-line");
            lines.style( "stroke" , "#d3d3d3");
            let areas = plotArea.selectAll(".area")
            areas.style( "fill" , "#d3d3d3");
            let targetSet = d.c;
            let targetLine = d3.select(event.target);
            let targetArea = areas.filter( k => k.c == targetSet );
            targetArea
                .style( "fill", d => colour(d.c) )
                .style( "opacity", 0.7)
                .raise();
                //.each(function() {
                //    this.parentNode.parentNode.appendChild(this.parentNode);
                //});
            targetLine
                .style( "stroke", d => colour(d.c) )
                .style( "stroke-width", "4px" )
                .raise();
                //.each(function() {
                //    this.parentNode.parentNode.appendChild(this.parentNode);
                //});
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html("<span>"+d.c+"</span>")
                .style("left", d3.pointer(event)[0]+ "px")
                .style("top", d3.pointer(event)[1] + "px");
        }

        // mouse out behaviour for mean lines
        function tipOffMeanLine(event,d) {
            let areas = plotArea.selectAll(".area");
            areas 
                .style( "fill", d => colour(d.c) )
                .style( "opacity", 0.5);
            let lines = plotArea.selectAll(".mean-line");
            lines
                .style( "stroke", d => colour(d.c) )
                .style( "stroke-width", "2.5px" )
                .raise();

            container.select(".tool-tip").style("opacity", 0.0)
        }

        this.layout.newData = false;
    }

    highlightItems() {
  
        const container = d3.select(`#${this.id}`);
        const layout = this.layout;
        const plotArea = container.select(".plot-area");
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const highlightItemIds = filter.highlightItemIds.state.itemIds;
       
        const lines = plotArea.selectAll(".line");
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( this.layout.colourMap );

        if ( this.layout.cSet !== undefined) {
            if ( Array.isArray( this.layout.cSet ) ) {
                colour.domain( this.layout.cSet )
            } else {
                colour.domain( filter.categoricalUniqueValues[ this.layout.cSet ] )
            }
        }

        if ( highlightItemIds === undefined || highlightItemIds.length == 0) {
            lines
                .style( "stroke-width", "2.5px" )
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } );   
        } else {
            lines
                .style( "stroke-width", "2.5px" )
                .style( "stroke", "#d3d3d3" ); 
            highlightItemIds.forEach( function (itemId) {
                lines.filter( (d,i) => d.itemId == itemId)
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } ) 
                    .style( "stroke-width", "4px" )
                    .each(function() {
                            this.parentNode.parentNode.appendChild(this.parentNode);
                    });
                });
        }
    }


    handleFilterChange(data) {
        if (data.brushing) return;
        if (this.fetchData.getItemIdsFromFilter && !data.noFilter) {
            this.fetchData.itemIds = data.itemIds;
        }
        if (!this.fetchData.getItemIdsFromFilter && data.noFilter) {
            this.fetchData.itemIds = data.itemIds;
        }
        this.fetchDataNow = true;
        if (this.fetchData.dataFilterConfig) {
            const config = this.fetchData.dataFilterConfig;
            const dataset = this.sharedStateByAncestorId["context"].datasets.find( d => d.id == this.datasetId );
            config.itemLabels = this.fetchData.itemIds.map( id => dataset.data.find( i => i.itemId == id ).label );
            if (config.cProperty) {
                config.cPropertyValues = this.fetchData.itemIds.map( id => dataset.data.find( i => i.itemId == id )[config.cProperty] );
            }
        }
        this.update();
    }

    async handleDerivedDataChange() {
        this.fetchDataNow = true;        
        await this.update();
        this.fetchDataNow = true; // catch any derived data changes that arrived during the update
        this.update();
    }

    remove() {
        this.removeSubscriptions();
    }

    initCuts() {
        if (!this.layout.cuts?.length) return;
        const requestCreateDimension = this.sharedStateByAncestorId["context"].requestCreateDimension;
        this.layout.cuts.forEach( cut => {
            if (this.cuts.map( d => d.dimensionName ).includes(cut.dimensionName)) {
                return;
            }
            const cutToAdd = this.makeCutObject(cut);
            let avgValue;
			if ( cut.type == "x") {
                avgValue = d3.mean(this.xDataRange);
            } else if ( cut.type == "y") {
                avgValue = d3.mean(this.yDataRange);
            }	
            const initValue = cut.value || avgValue;
            const dimensionName = cut.dimensionName;
            requestCreateDimension.state = {name:dimensionName, value:initValue};
            const dimension = this.sharedStateByAncestorId["context"].dimensions.find( d => d.name == dimensionName );
            const dimValue = dimension.state.value;
            cutToAdd.value = dimValue;
            cutToAdd.dimensionObserverId = dimension.subscribe( (data) => {
                const cut = this.cuts.find( d => d.dimensionName == dimensionName );
                cut.value = data.value;
                this.setCutLinePosition(dimensionName);
            });
            this.subscriptions.push({observable:dimension, id:cutToAdd.dimensionObserverId});
            this.cuts.push(cutToAdd);
        });   
    }

    setRanges() {
        let xMin, xMax, yMin, yMax;
        if ( !this.layout.segmentedLine ) {
            xMin = d3.min( this.data.series, d => d3.min( d.data, d => d.x ) );
            xMax = d3.max( this.data.series, d => d3.max( d.data, d => d.x ) );
            yMin = d3.min( this.data.series, d => d3.min( d.data, d => d.y ) );
            yMax = d3.max( this.data.series, d => d3.max( d.data, d => d.y ) );
        } else {
            xMin = d3.min( this.data.series, d => d3.min( d.data, d => d[0][0] ) );
            xMax = d3.max( this.data.series, d => d3.max( d.data, d => d[0][0] ) );
            yMin = d3.min( this.data.series, d => d3.min( d.data, d => d[0][1] ) );
            yMax = d3.max( this.data.series, d => d3.max( d.data, d => d[0][1] ) );
        }

        this.xDataRange = [xMin, xMax];
        this.yDataRange = [yMin, yMax];

        let xDiff = xMax - xMin;
        xMin -= 0.05 * xDiff;
        xMax += 0.05 * xDiff;
        let yDiff = yMax - yMin;
        yMin -= 0.05 * yDiff;
        yMax += 0.05 * yDiff;

        this.xRange = this.layout.xRange || [xMin, xMax];
        this.yRange = this.layout.yRange || [yMin, yMax];
    }

    addCutLines() {
        if ( !this.cuts.length ) return;
        const plotArea = d3.select(`#${this.id}`).select(".plot-area");
        const boundCutLineDragStart = cutLineDragStart.bind(this);
        const boundCutLineDragged = cutLineDragged.bind(this);
        const boundCutLineDragEnd = cutLineDragEnd.bind(this);
        this.cuts.forEach( cut => {
            if ( cut.lineAdded ) return;
            const dimensionName = cut.dimensionName;
            let cutLine = plotArea.select(`#${dimensionName}-cut-line`);
            if ( cutLine.empty() ) {
                cutLine = plotArea.append("path")
                    .attr("class","cut-line")
                    .attr("id", `${dimensionName}-cut-line`)
                    .attr("fill", "none")
                    .attr("stroke", "#d0d5db")
                    .attr("stroke-width", 3)
                    .style("opacity",0.9)
                    .attr("d", "")
                    .attr("clip-path", `url(#${this.id}-clip)`)
                    .call(d3.drag()
                        .on("start", (event) => boundCutLineDragStart(event, dimensionName))
                        .on("drag", (event) => boundCutLineDragged(event, dimensionName))
                        .on("end", (event) => boundCutLineDragEnd(event, dimensionName)));   
                this.setCutLinePosition(dimensionName);
            }
            cut.lineAdded = true;
        });

        function cutLineDragStart(event,dimensionName) {
            const cut = this.cuts.find( d => d.dimensionName == dimensionName );
            cut.brushing = true;
            this.setCutLinePosition(dimensionName);
        }

        function cutLineDragged(event,dimensionName) {
            const cut = this.cuts.find( d => d.dimensionName == dimensionName );
            const margin = 3;
            const dx = Math.abs(this.xScale.invert(margin) - this.xScale.invert(0));
            const dy = Math.abs(this.yScale.invert(margin) - this.yScale.invert(0));
            if (cut.type == "x") {
                let value = this.xScale.invert(event.x);
                value = d3.min([d3.max([value, this.xRange[0]+dx]), this.xRange[1]-dx]);
                cut.value = value;
            } else if (cut.type == "y") {
                let value = this.yScale.invert(event.y);
                value = d3.min([d3.max([value, this.yRange[0]+dy]), this.yRange[1]-dy]);
                cut.value = value;
            }
            const requestSetDimension = this.sharedStateByAncestorId["context"].requestSetDimension;
		    requestSetDimension.state = { name:dimensionName, dimensionState:{value:cut.value, brushing:cut.brushing }};
            this.setCutLinePosition(dimensionName);
        }

        function cutLineDragEnd(event,dimensionName) {
            const cut = this.cuts.find( d => d.dimensionName == dimensionName );
            cut.brushing = false;
            const requestSetDimension = this.sharedStateByAncestorId["context"].requestSetDimension;
            requestSetDimension.state = { name:dimensionName, dimensionState:{value:cut.value, brushing:cut.brushing }};
            this.setCutLinePosition(dimensionName);
        }
    }

    setCutLinePosition(dimensionName) {
        const cut = this.cuts.find( d => d.dimensionName == dimensionName );
        const plotArea = d3.select(`#${this.id}`).select(".plot-area");
        const cutLine = plotArea.select(`#${dimensionName}-cut-line`);
        let pathData;
        if ( cut.type == "x") {
            pathData = `M ${this.xScale(cut.value)} 0 L ${this.xScale(cut.value)} ${this.plotAreaHeight}`;
        } else if ( cut.type == "y") {
            pathData = `M 0 ${this.yScale(cut.value)} L ${this.plotAreaWidth} ${this.yScale(cut.value)}`;
        }
        cutLine.attr("d", pathData);
        if (cut.brushing) {
            cutLine.style("stroke", "#42d4f5");
        } else {
            cutLine.style("stroke", "#d0d5db");
        }
    }   

    setScales() {
        if (!this.xScale || !this.layout.xRange) {
            if ( this.layout.xscale == "time" ) {
                this.xScale = d3.scaleTime(); 
                this.xScale0 = d3.scaleTime();        
            } else {
                this.xScale = d3.scaleLinear();
                this.xScale0 = d3.scaleLinear();
            }
            this.xScale.domain( this.xRange );
            this.xScale0.domain( this.xRange );
        }
        this.xScale.range( [0, this.plotAreaWidth] );
        this.xScale0.range( [0, this.plotAreaWidth] );

        if (!this.yScale || !this.layout.yRange) {
            this.yScale = d3.scaleLinear().domain( this.yRange );
            this.yScale0 = d3.scaleLinear().domain( this.yRange );
        }
        this.yScale.range( [this.plotAreaHeight, 0] );
        this.yScale0.range( [this.plotAreaHeight, 0] );

    }

    handleDimensionChange() {
		this.fetchDataNow = true;
		this.update();
	}

}

export { LineSeries };