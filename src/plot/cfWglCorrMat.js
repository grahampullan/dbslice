import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import * as twgl from 'twgl.js/dist/4.x/twgl-full.module.js';
import * as glMatrix from 'gl-matrix';

const cfWglCorrMat = {

    make : function() {

        const marginDefault = {top: 20, right: 20, bottom: 30, left: 53};
        const margin = ( this.layout.margin === undefined ) ? marginDefault  : this.layout.margin;

        const container = d3.select(`#${this.elementId}`);

        const containerWidth = container.node().offsetWidth;
        const containerHeight = this.layout.height;
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        this.dimId = dbsliceData.session.cfData.continuousProperties.indexOf( this.data.properties[0] );

        const background = container.append("svg")
            .attr("class", "background-svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .style("opacity", 0.);

        const scale = window.devicePixelRatio;
           
        const overlay = container.append("svg")
            .attr("class", "overlay-outer")
    		.style("position","absolute")
    		//.style("z-index",2)
    		.style("top","0px")
    		.style("left","0px")
    		.attr("width", containerWidth)
    		.attr("height", containerHeight)
                .append("g")
                .attr( "transform", `translate(${margin.left} , ${margin.top})`)
                .attr( "class", "overlay" )
                .attr( "id", `overlay-${this._prid}-${this._id}`);

        const boundMouseMove = this.mouseMove.bind(this);
        const boundMakeQuadTree = this.makeQuadTree.bind(this);
        const canvas = container.append("canvas")
            .style("width", `${width}px`)
            .style("height", `${height}px`)
            .attr("width", Math.floor(width*scale))
            .attr("height", Math.floor(height*scale))
            .style("position", "absolute")
            .style("top", `${margin.top}px`)
            .style("left", `${margin.left}px`)
            .on("mousemove", boundMouseMove)
            .on("mouseenter", boundMakeQuadTree)
            .attr( "id", `canvas-${this._prid}-${this._id}`);
                
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
        this.width = width;
        this.height = height;

        const svg = container.select(".background-svg");
        svg.attr("width", svgWidth).attr("height", svgHeight);

        container.select(".overlay-outer")
            .attr("width", svgWidth).attr("height", svgHeight);

        const svgOverlay = container.select(".overlay");
        svgOverlay.attr("width", width).attr("height", height);

        const scale = window.devicePixelRatio;
        const canvas = container.select("canvas")
        canvas.style("width", `${width}px`)
            .style("height", `${height}px`)
            .attr("width", Math.floor(width*scale))
            .attr("height", Math.floor(height*scale));
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        const properties = this.data.properties;
        const nProps = properties.length;
        const cProperty = this.data.cProperty;

        const colour = ( layout.colourMap === undefined ) ? d3.scaleOrdinal( d3.schemeTableau10 ) : d3.scaleOrdinal( layout.colourMap );
        colour.domain( cfData.categoricalUniqueValues[ cProperty ] );
        this.colour = colour;

        const xScaleMatrix = d3.scaleBand()
            .paddingInner(0.05)
            .paddingOuter(0.)
            .domain(properties)
            .range([0,width]);

        const yScaleMatrix = d3.scaleBand()
            .paddingInner(0.05)
            .paddingOuter(0.)
            .domain(properties)
            .range([0,height]);

        const nPts = pointData.length;

        const vertices = new Float32Array(2*nPts*nProps*nProps);
        const colours = new Float32Array(3*nPts*nProps*nProps);

        let kAll = 0;
        const scatterPlots = [];
        for (let i=0; i < nProps; i++) { // row
                const plotsInRow = [];
            for (let j=0; j < nProps; j++) { // column
                const plot = {}
                plot.xProperty = properties[j];
                plot.xDimId = cfData.continuousProperties.indexOf(plot.xProperty);
                plot.yProperty = properties[i];
                plot.yDimId = cfData.continuousProperties.indexOf(plot.yProperty);
                plot.top = yScaleMatrix(plot.yProperty);
                plot.bottom = plot.top + yScaleMatrix.bandwidth();
                plot.left = xScaleMatrix(plot.xProperty);
                plot.right = plot.left + xScaleMatrix.bandwidth();
                let xExtent = cfData.continuousDimsExtents[plot.xDimId];
                let xDiff = xExtent[1]-xExtent[0];
                let yExtent = cfData.continuousDimsExtents[plot.yDimId];
                let yDiff = yExtent[1]-yExtent[0];
                plot.xScale = d3.scaleLinear()
                    .domain([xExtent[0] - 0.1*xDiff, xExtent[1] + 0.1*xDiff])
                    .range([plot.left,plot.right]);
                plot.yScale = d3.scaleLinear()
                    .domain([yExtent[0] - 0.1*yDiff, yExtent[1] + 0.1*yDiff])
                    .range([plot.bottom,plot.top]);
                plot.yScaleWgl = d3.scaleLinear()
                    .domain([yExtent[0] - 0.1*yDiff, yExtent[1] + 0.1*yDiff])
                    .range([height-plot.bottom, height-plot.top]);
                plotsInRow.push(plot);
                for (let k=0; k<nPts; k++) {
                    let xNow = plot.xScale(pointData[k][plot.xProperty]);
                    let yNowWgl = plot.yScaleWgl(pointData[k][plot.yProperty]);
                    let col = d3.color(colour(pointData[k][cProperty]));
                    vertices[2*kAll] = xNow;
                    vertices[2*kAll+1] = yNowWgl;
                    colours[3*kAll] = col.r/255.;
                    colours[3*kAll+1] = col.g/255.;
                    colours[3*kAll+2] = col.b/255.;
                    kAll++;
                }           
            }
            scatterPlots.push(plotsInRow);
        }
        this.scatterPlots = scatterPlots;

        this.drawPoints(gl, vertices, colours);

        const boxes = svgOverlay.selectAll(".plot-box")
            .data(scatterPlots.flat());

        boxes.join("rect")
            .attr("class","plot-box")
            .attr("x", d=>d.left)
            .attr("y", d=>d.top)
            .attr("width", d=>d.right - d.left)
            .attr("height", d=>d.bottom - d.top)
            .style("fill", "none")
            .style("stroke", "grey")
            .style("stroke-width","1px");

        const bottomPlots = scatterPlots[nProps-1];
        const leftPlots = scatterPlots.map(d => d[0]);

        const xAxis = d3.axisBottom()
            .ticks(3)
            .tickSize(height);
        const xAxes = svgOverlay.selectAll(".axis-x")
            .data(bottomPlots);
        xAxes.join("g")
            .attr("class","axis-x")
            .each(function(d) { return d3.select(this).call(xAxis.scale(d.xScale)); })
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"))
                .call(g => g.select(".x-axis-text").remove())
                .append("text")
                    .attr("class","x-axis-text")
                    .attr("fill", "#000")
                    .attr("x", d => 0.5*( d.left + d.right ))
                    .attr("y", height + margin.bottom - 8)
                    .attr("text-anchor", "middle")
                    .text(d=>d.xProperty);

        const yAxis = d3.axisLeft()
            .ticks(3)
            .tickSize(width);
        const yAxes = svgOverlay.selectAll(".axis-y")
            .data(leftPlots);
        yAxes.join("g")
            .attr("class","axis-y")
            .attr( "transform", `translate(${width},0)` )
            .each(function(d) { return d3.select(this).call(yAxis.scale(d.yScale)); })
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"))
                .call(g => g.select(".y-axis-text").remove())
                .append("text")
                    .attr("class","y-axis-text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -width-margin.left+16)
                    .attr("x", d => -0.5*( d.top + d.bottom ))
                    .attr("text-anchor", "middle")
                    .text(d=>d.yProperty);

        /*
        var zoom = d3.zoom()
            .scaleExtent([0.01, Infinity])
            .on("zoom", zoomed);

        svg.transition().call(zoom.transform, d3.zoomIdentity);
        svg.call(zoom);
        */

    },

    highlightTasks : function( taskIds="---" ) {

        if (taskIds=="---") {
            if (!this.layout.highlightTasks) return;
            taskIds = dbsliceData.highlightTasks;
        }

        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        const nPts = pointData.length;
        const nProps = this.data.properties.length;
        const cProperty = this.data.cProperty;

        if (taskIds === undefined || taskIds.length == 0) {

            const vertices = new Float32Array(2*nPts*nProps*nProps);
            const colours = new Float32Array(3*nPts*nProps*nProps);
            let kAll = 0;
            this.scatterPlots.flat().forEach( plot => {
                for (let i=0; i<nPts; i++) {
                    let thisPoint = pointData[i];
                    vertices[2*kAll] = plot.xScale(thisPoint[plot.xProperty]);
                    vertices[2*kAll+1] = plot.yScaleWgl(thisPoint[plot.yProperty]);
                    let col = d3.color(this.colour(thisPoint[cProperty]));
                    colours[3*kAll] = col.r/255.;
                    colours[3*kAll+1] = col.g/255.;
                    colours[3*kAll+2] = col.b/255.;
                    kAll++;
                }
            });
            this.drawPoints(this.gl, vertices, colours);

        } else {

            const vertices = new Float32Array(2*nPts*nProps*nProps);
            const colours = new Float32Array(3*nPts*nProps*nProps);
            let kAll = 0;
            this.scatterPlots.flat().forEach( plot => {
                for (let i=0; i<nPts; i++) {
                    let thisPoint = pointData[i];
                    vertices[2*kAll] = plot.xScale(thisPoint[plot.xProperty]);
                    vertices[2*kAll+1] = plot.yScaleWgl(thisPoint[plot.yProperty]);
                    let col = {r:211., g:211., b:211.};
                    colours[3*kAll] = col.r/255.;
                    colours[3*kAll+1] = col.g/255.;
                    colours[3*kAll+2] = col.b/255.;
                    kAll++;
                }
            });
            this.drawPoints(this.gl, vertices, colours);
            
            let point = pointData.find( (d) => d.taskId == taskIds[0] );
            this.scatterPlots.flat().forEach( plot => {
                const vertex = Float32Array.from([plot.xScale(point[plot.xProperty]),plot.yScaleWgl(point[plot.yProperty])]);
                let col = d3.color(this.colour(point[cProperty]));
                const colour = Float32Array.from([col.r/255., col.g/255., col.b/255.]);
                this.drawPoints(this.gl, vertex, colour);
            });
        }

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
      color = vec4(v_color,1.0); 
      gl_FragColor = alpha * color;
    }
    ` ,

    mouseMove : function(event) {

        const container = d3.select(`#${this.elementId}`);
        const layout = this.layout;
        const scale = window.devicePixelRatio;
        const cfData = dbsliceData.session.cfData;
        const dimId = this.dimId;
        const dim = cfData.continuousDims[ dimId ];
        const pointData = dim.top( Infinity );

        if (!this.quadtree) return;

        const [xPix,yPix] = d3.pointer(event);
        const pointFound = this.quadtree.find(xPix,yPix,20/scale);

        if (pointFound) {
            let taskId = pointFound.taskId;
            let xProperty = pointFound.xProperty;
            let yProperty = pointFound.yProperty;
            let point = pointData.find( (d) => d.taskId == taskId );

            let toolTipText, xVal, yVal;    
            if ( layout.toolTipXFormat === undefined ) {
                xVal = point[ xProperty ];
            } else {
                xVal = d3.format(layout.toolTipXFormat)( point[ xProperty ] )
            }
            if ( layout.toolTipYFormat === undefined ) {
                yVal = point[ yProperty ];
            } else {
                yVal = d3.format(layout.toolTipYFormat)( point[ yProperty ] )
            }
            let valsText = `${xProperty}=${xVal}, ${yProperty}=${yVal}`;

            if ( layout.toolTipProperties === undefined ) {
                toolTipText = `${point.label}: ${valsText}`; 
            } else {
                let props = layout.toolTipProperties.map(prop => point[prop]);
                toolTipText = props.join("; ");
                toolTipText += `: ${valsText}`;
            }
           
            container.select(".tool-tip")
                .style("opacity", 1.0)
                .html(`<span>${toolTipText}</span>`)
                .style("left", `${xPix}px`)
                .style("top", `${yPix-30}px`);

            this.highlightTasks( [taskId] );

            if ( layout.highlightTasks ) {
                dbsliceData.highlightTasks = [ taskId ];
                highlightTasksAllPlots();
            }

        } else {

            container.select(".tool-tip").style("opacity", 0.0);

            this.highlightTasks( [] );

            if ( layout.highlightTasks ) {
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }

        }
    },

    makeQuadTree: function(event) {

        if (this.scatterPlots) {

            const cfData = dbsliceData.session.cfData;
            const dimId = this.dimId;
            const dim = cfData.continuousDims[ dimId ];
            const pointData = dim.top( Infinity );

            const quadTreeData = [];

            this.scatterPlots.flat().forEach(plot => {
                pointData.forEach(point => {
                    let qPoint = {};
                    qPoint.x = plot.xScale(point[plot.xProperty]);
                    qPoint.y = plot.yScale(point[plot.yProperty]);
                    qPoint.taskId = point.taskId;
                    qPoint.xProperty = plot.xProperty;
                    qPoint.yProperty = plot.yProperty;
                    quadTreeData.push(qPoint);
                })
            });

            const quadtree = d3.quadtree()
                .x(d => d.x)
                .y(d => d.y)
                .addAll(quadTreeData);

            this.quadtree = quadtree;

        }
    },

    drawPoints : function(gl, vertices, colours) {

        const nPts = vertices.length/2;

        const programInfo = twgl.createProgramInfo(gl, [this.vertShader, this.fragShader]);
        gl.useProgram(programInfo.program);

        const a_arrays = {
            a_position: {numComponents:2, data:vertices},
            a_color: {numComponents:3, data:colours}
        };

        const bufferInfo = twgl.createBufferInfoFromArrays(gl, a_arrays);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(projectionMatrix, 0, this.width, 0, this.height, 0, 1.);
        const uniforms = {u_matrix: projectionMatrix};
        twgl.setUniforms(programInfo, uniforms);

        gl.drawArrays(gl.POINTS,0,nPts);

    }

};

export { cfWglCorrMat };