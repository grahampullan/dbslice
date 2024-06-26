import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import d3tip from 'd3-tip';

const d3LineSeries = {

    make : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);

        if ( this.data == null || this.data == undefined ) {
            console.log ("in line plot - no data");
            return
        }

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.update();

    },

    update : function () {

        const layout = this.layout;

        if (layout.newData == false && dbsliceData.windowResize == false) {
            return
        }

        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");
        const highlightTasks = layout.highlightTasks;
        const timeSync = layout.timeSync;
        const xAxisMean = layout.xAxisMean;
        const yAxisMean = layout.yAxisMean;
        const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
        const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );

        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );

        if ( layout.cSet !== undefined) {
            if ( Array.isArray( layout.cSet ) ) {
                colour.domain( layout.cSet )
            } else {
                colour.domain( dbsliceData.session.cfData.categoricalUniqueValues[ layout.cSet ] )
            }
        }

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const clipId = `clip-${this._prid}-${this._id}`;

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const nSeries = this.data.series.length;

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

        let xmin = d3.min( this.data.series[0].data, d => d.x );
        let xmax = d3.max( this.data.series[0].data, d => d.x );
        let ymin = d3.min( this.data.series[0].data, d => d.y );
        let ymax = d3.max( this.data.series[0].data, d => d.y );

        for (let n = 1; n < nSeries; ++n) {
            var xminNow =  d3.min( this.data.series[n].data, d => d.x );
            ( xminNow < xmin ) ? xmin = xminNow : xmin = xmin;
            var xmaxNow =  d3.max( this.data.series[n].data, d => d.x );
            ( xmaxNow > xmax ) ? xmax = xmaxNow : xmax = xmax;
            var yminNow =  d3.min( this.data.series[n].data, d => d.y );
            ( yminNow < ymin ) ? ymin = yminNow : ymin = ymin;
            var ymaxNow =  d3.max( this.data.series[n].data, d => d.y );
            ( ymaxNow > ymax ) ? ymax = ymaxNow : ymax = ymax;
        }

        let xDiff = xmax - xmin;
        xmin -= 0.05 * xDiff;
        xmax += 0.05 * xDiff;

        let yDiff = ymax - ymin;
        ymin -= 0.05 * yDiff;
        ymax += 0.05 * yDiff;

        let xRange, yRange;
        if ( layout.xRange === undefined ) {
            xRange = [xmin, xmax];
        } else {
            xRange = layout.xRange;
        }

        if ( layout.yRange === undefined ) {
            yRange = [ymin, ymax];
        } else {
            yRange = layout.yRange;
        }

        let xscale, xscale0;
        if ( layout.xscale == "time" ) {
            xscale = d3.scaleTime(); 
            xscale0 = d3.scaleTime();        
        } else {
            xscale = d3.scaleLinear();
            xscale0 = d3.scaleLinear();
        }

        xscale.range( [0, width] )
            .domain( xRange );

        xscale0.range( [0, width] )
            .domain( xRange );

        let yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        let yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const line = d3.line()
            .x( d => xscale( d.x ) )
            .y( d => yscale( d.y ) );

        const clipRect = svg.select(".clip-rect");

        if ( clipRect.empty() ) {
            svg.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("class","clip-rect")
                    .attr("width", width)
                    .attr("height", height);
        } else {
            clipRect.attr("width", width)
        }

        const zoom = d3.zoom()
            .scaleExtent([0.5, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        const tip = d3tip()
            .attr('class', 'd3-tip')
            .offset([-20, 0])
            .html( d => `<span>${d.label}</span>`);

        svg.call(tip);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }


        if (!xAxisMean && !yAxisMean) {

            const allSeries = plotArea.selectAll( ".plot-series" ).data( this.data.series, k => k.taskId );

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
                    .attr( "d", d => line( d.data ) )
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } )  ;
            } );

            allSeries.exit().remove();

        }
    
        let area;
        let areaData = [];
        if ( xAxisMean ) {
            area = d3.area()
                .y( d => yscale(d.y) )
                .x0( d => xscale(d.x0 ))
                .x1( d => xscale(d.x1 ));
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
        
        if ( yAxisMean ) {
            area = d3.area()
                .x( d => xscale(d.x) )
                .y0( d => yscale(d.y0 ))
                .y1( d => yscale(d.y1 ));
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
    
        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
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
            gX.transition().call( xAxis );
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
            gY.transition().call( yAxis );
        }

        if ( timeSync ) {
            highlightTimeStep(this.watchedTime.iStep);
        }

        function highlightTimeStep(iStep) {
            let lines = plotArea.selectAll(".line");
            lines
                .style( "stroke" , "#d3d3d3")
                .style( "stroke-width", "2.5px" );
            let currentLine = lines.filter( d => d.taskId == iStep);
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

        function zoomed(event) {
            const t = event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr( "d", d => line( d.data ) );
            plotArea.selectAll(".area").attr( "d", d => area( d.data ) );
            plotArea.selectAll(".mean-line").attr( "d", d => line( d.data ) );
        }

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
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                highlightTasksAllPlots();
            }



            if ( timeSync ) {
                container.select(".time-slider").node().value = d.taskId;
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex && plot.watchedTime !== undefined) {
						plot.watchedTime.iStep = d.taskId;
					}
				});
            }
        }

        function tipOff(event,d) {
            if ( !timeSync ) {
                let lines = plotArea.selectAll(".line");
                lines
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                    .style( "stroke-width", "2.5px" );
            }
            container.select(".tool-tip").style("opacity", 0.0)
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }

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
    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");
        const lines = plotArea.selectAll(".line");
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( this.layout.colourMap );

        if ( this.layout.cSet !== undefined) {
            if ( Array.isArray( this.layout.cSet ) ) {
                colour.domain( this.layout.cSet )
            } else {
                colour.domain( dbsliceData.session.cfData.categoricalUniqueValues[ this.layout.cSet ] )
            }
        }

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            lines
                .style( "stroke-width", "2.5px" )
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } );   
        } else {
            lines
                .style( "stroke-width", "2.5px" )
                .style( "stroke", "#d3d3d3" ); 
            dbsliceData.highlightTasks.forEach( function (taskId) {
                lines.filter( (d,i) => d.taskId == taskId)
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } ) 
                    .style( "stroke-width", "4px" )
                    .each(function() {
                            this.parentNode.parentNode.appendChild(this.parentNode);
                    });
                });
        }
    }

};

export { d3LineSeries };