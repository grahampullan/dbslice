import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js'
import * as d3 from 'd3v7';
import * as nd from 'nd4js';

const cfD3ResSurfScatter = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.xProperty );

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr( "class", "plot-area" )
                .attr( "id", `plot-area-${this._prid}-${this._id}`);
            
        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.update();

    }, 

    update : function () {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 50};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const svgWidth = container.node().offsetWidth,
            svgHeight = this.layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const clipId = `clip-${this._prid}-${this._id}`;

        const plotArea = svg.select(".plot-area");
        const dimId = this.dimId;

        const xProperty = this.data.xProperty;
        const inputProperties = this.data.inputProperties;
        const cProperty = this.data.cProperty;
        const highlightTasks = this.layout.highlightTasks;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        const dataModel = this.data.model;
        const Amat = [];
        pointData.forEach( d => {
            Amat.push( row(inputProperties.map( t => d[t]), dataModel ));
        });

        const ymat = pointData.map( d => ([d[xProperty]]));

        const [u, singVals, vT] = nd.la.svd_decomp(Amat);
        const svd = {u,singVals,vT};
        const v = vT.T;
        const singValsRecip = svd.singVals.mapElems( (a_ij, i,j) => i==j ? a_ij : 1./a_ij );
        const sigmaInv = nd.la.diag_mat(singValsRecip);
        const pinv = nd.la.matmul(v, sigmaInv, u.T); // psuedo-inverse
        const beta = nd.la.matmul(pinv,ymat);


        const resSurfResult = [];
        pointData.forEach(d => {
            let x = row( inputProperties.map( t => d[t] ) , dataModel );
            resSurfResult.push( nd.la.matmul( nd.array([x]), beta)(0,0) );
        });
        
        const scatterPlotData = pointData.map( (d,indx) => ( { x : d[xProperty], y : resSurfResult[indx], c : d[cProperty], taskId : d.taskId, label:d.label } ) );

        let sumErrorSq = d3.sum( scatterPlotData.map(d => ((d.y - d.x)**2) ));
        let m = d3.mean( scatterPlotData.map(d => d.x));
        let sumSq = d3.sum( scatterPlotData.map(d => ((d.x-m)**2) ));
        let r2 = 1 - sumErrorSq/sumSq;

        let xRange;
        if ( this.layout.xRange === undefined) {
            let xMin = d3.min( scatterPlotData, d => d.x  );
            let xMax = d3.max( scatterPlotData, d => d.x  );
            let xDiff = xMax - xMin;
            xMin -= 0.1 * xDiff;
            xMax += 0.1 * xDiff;
            xRange = [xMin, xMax];
        } else {
            xRange = this.layout.xRange;
        }

        const xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( xRange );

        const yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( xRange );

        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( this.layout.colourMap );
        colour.domain( cfData.categoricalUniqueValues[ cProperty ] );

        const opacity = ( this.layout.opacity === undefined ) ? 1.0 : this.layout.opacity;

        const clip = svg.append("clipPath")
            .attr("id", clipId)
            .append("rect")
                .attr("width", width)
                .attr("height", height);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }

        const points = plotArea.selectAll( ".point" )
            .data( scatterPlotData );

        points.enter()
            .append( "circle" )
            .attr( "class", "point")
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d.x ) )
            .attr( "cy", d => yscale( d.y ) )
            .style( "fill", d => colour( d.c ) )
            .style( "opacity", opacity )
            .attr( "clip-path", `url(#${clipId})`)
            .attr( "task-id", d => d.taskId )
            .on( "mouseover", tipOn )
            .on( "mouseout", tipOff );
 
        points
            .attr( "r", 5 )
            .attr( "cx", d => xscale( d.x ) )
            .attr( "cy", d => yscale( d.y ) )
            .style( "fill", d => colour( d.c ) )
            .attr( "task-id", d => d.taskId );

        points.exit().remove();

        const xAxis = d3.axisBottom( xscale );
        const yAxis = d3.axisLeft( yscale );

        let gX = plotArea.select(".axis-x");
        if ( gX.empty() ) {
            gX = plotArea.append("g")
                .attr( "transform", `translate(0, ${height})` )
                .attr( "class", "axis-x")
                .call( xAxis );
            gX.append("text")
                .attr("class","x-axis-text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", margin.bottom-2)
                .attr("text-anchor", "end")
                .text(xProperty);
        } else {
            gX.transition().call( xAxis );
            gX.select(".x-axis-text").attr("x", width);
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
                .text("Response surface output");
        } else {
            gY.transition().call( yAxis );
        }

        let exactLine = plotArea.select(".exact-line");
        if ( exactLine.empty() ) {
            plotArea.append("line")
                .attr("class","exact-line")
                .attr("x1", xscale(xRange[0]) )
                .attr("y1", yscale(xRange[0]) )
                .attr("x2", xscale(xRange[1]) )
                .attr("y2", yscale(xRange[1]) )
                .style("stroke", "steelblue")
                .style("stroke-width", 4)
                .style("opacity", 0.5);
        } else {
            exactLine.attr("x1", xscale(xRange[0]) )
            .attr("y1", yscale(xRange[0]) )
            .attr("x2", xscale(xRange[1]) )
            .attr("y2", yscale(xRange[1]) );
        }

        let r2text = plotArea.select(".r2-text");
        if ( r2text.empty() ) {
            plotArea.append("text")
                .attr("class", "r2-text")
                .attr("fill", "#000")
                .attr("x", 10)
                .attr("y", 10)
                .text("R2 = " + r2.toFixed(2) );
        } else {
            r2text.text("R2 = " + r2.toFixed(2) );
        }

        function row(x, model) {
            const row = [1.];
            if ( model == "linear" ) {
                x.forEach( d => {
                    row.push(d);
                });
            }
            if ( model == "quadDiag" ) {
                x.forEach( d => {
                    row.push(d);
                    row.push(d**2);
                });
            }
            return row;
        }



        function tipOn( event, d ) {
            points.style( "opacity" , 0.2);
            let target = d3.select(event.target);
            target
                .style( "opacity" , 1.0)
                .attr( "r", 7 );
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html("<span>"+d.label+"</span>")
                .style("left", target.attr("cx")+ "px")
                .style("top", target.attr("cy") + "px");
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [ d.taskId ];
                highlightTasksAllPlots();
            }
        }

        function tipOff(event,d) {
            points.style( "opacity" , opacity );
            d3.select(event.target)
                .attr( "r", 5 );
            container.select(".tool-tip").style("opacity", 0.0)
            if ( highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
        }
    },

    highlightTasks : function() {

        if (!this.layout.highlightTasks) return;

        const cfData = dbsliceData.session.cfData;
        const plotArea = d3.select(`#plot-area-${this._prid}-${this._id}`);
        const opacity = ( this.layout.opacity === undefined ) ? 1.0 : this.layout.opacity;
        const cProperty = this.data.cProperty;
        const colour = ( this.layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( this.layout.colourMap );
        colour.domain( cfData.categoricalUniqueValues[ cProperty ] );
        const points = plotArea.selectAll( ".point" );

        if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
            points
                .style( "opacity" , opacity )
                .style( "stroke-width", "0px")
                .style( "fill", d => colour( d.c ) );
        } else {
            //points.style( "opacity" , 0.2);
            points.style( "fill" , "#d3d3d3");
            dbsliceData.highlightTasks.forEach( function (taskId) {
                points.filter( (d,i) => d.taskId == taskId)
                    .style( "fill", d => colour( d.c ) )
                    .style( "opacity" , opacity)
                    .style( "stroke", "red")
                    .style( "stroke-width", "2px")
                    .raise();
            });
        }
        


    }
};

export { cfD3ResSurfScatter };