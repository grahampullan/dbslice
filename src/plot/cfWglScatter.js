import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import * as twgl from 'twgl.js/dist/4.x/twgl-full.module.js';
import * as glMatrix from 'gl-matrix';

const cfWglScatter = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const containerWidth = container.node().offsetWidth;
        const containerHeight = this.layout.height;
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.xProperty );

        const background = container.append("svg")
            .attr("class", "background-svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("opacity", 0.);

        const scale = window.devicePixelRatio;

        const canvas = container.append("canvas")
            .style("width", `${width}px`)
            .style("height", `${height}px`)
            .attr("width", Math.floor(width*scale))
            .attr("height", Math.floor(height*scale))
            .style("position", "absolute")
            .style("top", `${margin.top}px`)
    		.style("left", `${margin.left}px`)
            .attr( "id", `canvas-${this._prid}-${this._id}`); 

        const overlay = container.append("svg")
            .attr("class", "overlay-outer")
    		.style("position","absolute")
    		.style("z-index",2)
    		.style("top","0px")
    		.style("left","0px")
    		.attr("width", containerWidth)
    		.attr("height", containerHeight)
                .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "overlay" )
                .attr( "id", `overlay-${this._prid}-${this._id}`);

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        const gl = canvas.node().getContext("webgl", {antialias: true, depth: false}); 
        //gl.scale(scale,scale);
        twgl.addExtensionsToContext(gl);
        this.gl = gl; 

        this.update();

    }, 

    update : function () {

        const layout = this.layout;

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( layout.margin === undefined ) ? marginDefault  : layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const gl = this.gl;

        const svgWidth = container.node().offsetWidth,
            svgHeight = layout.height;

        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.select("svg-background");

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const clipId = `clip-${this._prid}-${this._id}`;

        const svgOverlay = container.select(".overlay");
        svgOverlay.attr("width", width).attr("height", height);

        //const canvas = container.select("canvas")
        //canvas.attr("width", width).attr("height", height);

        const dimId = this.dimId;

        const xProperty = this.data.xProperty;
        const yProperty = this.data.yProperty;
        const cProperty = this.data.cProperty;

        const highlightTasks =layout.highlightTasks;

        const cfData = dbsliceData.session.cfData;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        let xRange, yRange;
        if ( layout.xRange === undefined) {
            if ( !layout.noAxesAutoScale ) {
                let xMin = d3.min( pointData, d => d[ xProperty ] );
                let xMax = d3.max( pointData, d => d[ xProperty ] );
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            } else {
                let extent = cfData.continuousDimsExtents[dimId];
                let xMin = extent[0];
                let xMax = extent[1];
                let xDiff = xMax - xMin;
                xMin -= 0.1 * xDiff;
                xMax += 0.1 * xDiff;
                xRange = [xMin, xMax];
            }
        } else {
            xRange = layout.xRange;
        }

        if ( layout.yRange === undefined) {
            if ( !layout.noAxesAutoScale ) {
                let yMin = d3.min( pointData, d => d[ yProperty ] );
                let yMax = d3.max( pointData, d => d[ yProperty ] );
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            } else {
                let yDimId = dbsliceData.session.cfData.continuousProperties.indexOf( yProperty );
                let extent = cfData.continuousDimsExtents[yDimId];
                let yMin = extent[0];
                let yMax = extent[1];
                let yDiff = yMax - yMin;
                yMin -= 0.1 * yDiff;
                yMax += 0.1 * yDiff;
                yRange = [yMin, yMax];
            }
        } else {
            yRange = layout.yRange;
        }

        const xscale = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const xscale0 = d3.scaleLinear()
            .range( [0, width] )
            .domain( xRange );

        const yscale = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const yscale0 = d3.scaleLinear()
            .range( [height, 0] )
            .domain( yRange );

        const yscaleWgl = d3.scaleLinear()
            .range( [0, height] )
            .domain( yRange );


        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( cfData.categoricalUniqueValues[ cProperty ] );

        const opacity = ( layout.opacity === undefined ) ? 1.0 : layout.opacity;

        const clipRect = svg.select(".clip-rect");

        /*
        if ( clipRect.empty() ) {
            svg.append("defs").append("clipPath")
                .attr("id", clipId)
                .append("rect")
                    .attr("class","clip-rect")
                    .attr("width", width)
                    .attr("height", height);
        } else {
            clipRect.attr("width", width)
        } */

        const nPts = pointData.length;
        const vertices = new Float32Array(2*nPts);
        const colours = new Float32Array(3*nPts);
        for (let i=0; i<nPts; i++) {
            vertices[2*i] = xscale(pointData[i][xProperty]);
            vertices[2*i+1] = yscaleWgl(pointData[i][yProperty]);
            let col = d3.color(colour(pointData[i][cProperty]));
            colours[3*i] = col.r/255.;
            colours[3*i+1] = col.g/255.;
            colours[3*i+2] = col.b/255.;
        }

        const programInfo = twgl.createProgramInfo(gl, [this.vertShader, this.fragShader]);
        gl.useProgram(programInfo.program);

        const a_arrays = {
            a_position: {numComponents:2, data:vertices},
            a_color: {numComponents:3, data:colours}
        };

        const bufferInfo = twgl.createBufferInfoFromArrays(gl, a_arrays);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0, width, 0, height, 0, 1.);
        const uniforms = {u_matrix: projectionMatrix};
        twgl.setUniforms(programInfo, uniforms);

        gl.drawArrays(gl.POINTS,0,nPts);

       



        /*
        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);

        let focus = plotArea.select(".focus");
        if ( focus.empty() ) {
            plotArea.append("circle")
                .attr("class","focus")
                .attr("fill","none")
                .attr("r",1);
        }
        */

        
        const xAxis = d3.axisBottom( xscale );
        if ( layout.xTickNumber !== undefined ) { xAxis.ticks(layout.xTickNumber); }
        if ( layout.xTickFormat !== undefined ) { xAxis.tickFormat(d3.format(layout.xTickFormat)); }

        const yAxis = d3.axisLeft( yscale );
        if ( layout.yTickNumber !== undefined ) { yAxis.ticks(layout.yTickNumber); }
        if ( layout.yTickFormat !== undefined ) { yAxis.tickFormat(d3.format(layout.yTickFormat)); }

        let gX = svgOverlay.select(".axis-x");
        if ( gX.empty() ) {
            gX = svgOverlay.append("g")
                .attr( "transform", `translate(0,${height})` )
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
            gX.select(".x-axis-text").attr("x",width);
        }

        let gY = svgOverlay.select(".axis-y");
        if ( gY.empty() ) {
            gY = svgOverlay.append("g")
                .attr( "class", "axis-y")
                .call( yAxis );
            gY.append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -margin.left + 15)
                .attr("text-anchor", "end")
                .text(yProperty);
        } else {
            gY.transition().call( yAxis );
        }

      
        
    },

    highlightTasks : function(){

        return;

    },

    vertShader : `
    attribute vec2 a_position;
    attribute vec3 a_color;
    
    uniform mat4 u_matrix;
    
    varying vec3 v_color;
    
    void main() {
      gl_Position = u_matrix*vec4(a_position,0,1);
      gl_PointSize = 20.;
      v_color = a_color;
    }`,
    
    
    fragShader : `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    
    varying vec3 v_color;

    float delta;
    vec4 color;
    
    void main() {
      float dist = distance( gl_PointCoord, vec2(0.5) );
      if ( dist > 0.5)
        discard;
      delta = fwidth(dist);
      float alpha = 1.0 - smoothstep(0.5-2.0*delta,0.5+2.0*delta,dist);
      // gl_FragColor = texture2D(u_cmap, vec2( (v_val-u_cmin)/(u_cmax-u_cmin) ,0.5));
      // gl_FragColor.a = alpha;
      color = vec4(v_color,1.0); 
      gl_FragColor = alpha * color;
    }
    `

};

export { cfWglScatter };