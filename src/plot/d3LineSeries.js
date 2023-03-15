import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3';
import d3tip from 'd3-tip';

const d3LineSeries = {

    make : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
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

        this.update();

    },

    update : function () {

        if (this.layout.newData == false && dbsliceData.windowResize == false) {
            return
        }

        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");
        const highlightTasks = this.layout.highlightTasks;
        const timeSync = this.layout.timeSync;

        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( this.layout.colourMap );

        if ( this.layout.cSet !== undefined) {
            if ( Array.isArray( this.layout.cSet ) ) {
                colour.domain( this.layout.cSet )
            } else {
                colour.domain( dbsliceData.session.cfData.categoricalUniqueValues[ this.layout.cSet ] )
            }
        }

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const clipId = `clip-${this._prid}-${this._id}`;

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

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

        let xRange, yRange;
        if ( this.layout.xRange === undefined ) {
            xRange = [xmin, xmax];
        } else {
            xRange = this.layout.xRange;
        }

        if ( this.layout.yRange === undefined ) {
            yRange = [ymin, ymax];
        } else {
            yRange = this.layout.yRange;
        }

        let xscale, xscale0;
        if ( this.layout.xscale == "time" ) {
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
            seriesLine.transition()
                .attr( "d", d => line( d.data ) )
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; } )  ;
        } );

        allSeries.exit().remove();

        const xAxis = d3.axisBottom( xscale ).ticks(5);
        const yAxis = d3.axisLeft( yscale );

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
                .text(this.layout.xAxisLabel);
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
                    .text(this.layout.yAxisLabel);
        } else {
            gY.transition().call( yAxis );
        }

        if ( timeSync ) {
            highlightTimeStep(0);
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
                let plotRowIndex = plotRows.findIndex( e => e._id == this._prid );
				let plotIndex = plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex) {
						plot.watchedTime.iStep = iStep;
					}
				});
			}
			highlightTimeStep(iStep);
		}

        function zoomed() {
            const t = d3.event.transform;
            xscale.domain(t.rescaleX(xscale0).domain());
            yscale.domain(t.rescaleY(yscale0).domain());
            gX.call(xAxis);
            gY.call(yAxis);
            plotArea.selectAll(".line").attr( "d", d => line( d.data ) );
        }

        function tipOn( d ) {
            let lines = plotArea.selectAll(".line");
            lines.style( "stroke" , "#d3d3d3");
            d3.select(this)
                .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                .style( "stroke-width", "4px" )
                .each(function() {
                    this.parentNode.parentNode.appendChild(this.parentNode);
                });
            let focus = plotArea.select(".focus");
            focus
                .attr( "cx" , d3.mouse(this)[0] )
                .attr( "cy" , d3.mouse(this)[1] );
            tip.show( d , focus.node() );
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                highlightTasksAllPlots();
            }
            if ( timeSync ) {
                container.select(".time-slider").node().value = d.taskId;
                let plotRowIndex = plotRows.findIndex( e => e._id == this._prid );
				let plotIndex = plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex) {
						plot.watchedTime.iStep = d.taskId;
					}
				});
            }
        }

        function tipOff() {
            if ( !timeSync ) {
                let lines = plotArea.selectAll(".line");
                lines
                    .style( "stroke", function( d ) { return (d.cKey !== undefined) ? colour(d.cKey) : 'cornflowerblue'; })
                    .style( "stroke-width", "2.5px" );
            }
            tip.hide();
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }

        this.layout.newData = false;
    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const container = d3.select(`#${this.elementId}`);
        const svg = container.select("svg");
        const plotArea = svg.select(".plot-area");
        const lines = plotArea.selectAll(".line");
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeCategory10 ) : d3.scaleOrdinal( this.layout.colourMap );

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