import { dbsliceData } from '../core/dbsliceData.js';

const triMesh2dRender = {

	make : function ( element, data, layout ) {

		console.log("make");

		const container = d3.select(element);

        const width = container.node().offsetWidth;
        const height = width; // force square plots for now

        console.log(width);

        const canvas = container.append("canvas")
            .attr("width", width)
            .attr("height", height)
            .style("width", width+"px")
            .style("height", height+"px");

        const overlay = container.append("svg")
    		.attr("class","svg-overlay")
    		.style("position","absolute")
    		.style("z-index",2)
    		.style("top","0px")
    		.style("left","0px")
    		.attr("width", width)
    		.attr("height", height);
  
		triMesh2dRender.update ( element, data, layout );

	},

	update : function (element, data, layout ) {

		const container = d3.select(element);
		const width = container.node().offsetWidth;
        const height = width; // force square plots for now

		const canvas = container.select("canvas");

		const gl = canvas.node().getContext("webgl", {antialias: true, depth: false});
		twgl.addExtensionsToContext(gl);
		const programInfo = twgl.createProgramInfo(gl, [triMesh2dRender.vertShader, triMesh2dRender.fragShader]);

		const tm = data.triMesh;

		const nTris = tm.indices.length/3;
		console.log(nTris);

		//console.log(tm);

		let values, vertices;

		// tmp
		const nVerts = ( data.nVerts === undefined ) ? tm.values.length : data.nVerts;

		if ( layout.highlightTasks == true ) {
   
            if (!Array.isArray(dbsliceData.highlightTasks)) {

            	values = new Float32Array(tm.values.buffer,0,nVerts);
            	vertices = new Float32Array(tm.vertices.buffer,0,2*nVerts);
            
            } else if (dbsliceData.highlightTasks.length != 0) {
     
     			let taskId = dbsliceData.highlightTasks[0];
     			let nOffset;

     			if ( data.taskIdMap === undefined) {

     				nOffset = taskId;

     			} else {

     				nOffset = data.taskIdMap[taskId];

     			}

            	values = new Float32Array(tm.values.buffer,4*nOffset*nVerts,nVerts);

            	if ( layout.updateVertices ) {

            		vertices = new Float32Array(tm.vertices.buffer,4*2*nOffset*nVerts,2*nVerts);

            	} else {

            		vertices = tm.vertices;

            	}

            	
            } else {

            	return;
            }

        }

        //console.log(vertices);
        //console.log(values);

		const arrays = {
     		a_position: {numComponents: 2, data: vertices},
     		a_val: {numComponents: 1, data: values},
     		indices: {numComponents: 3, data: tm.indices}
  		};
  		const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  		const viewDefault = {xMin: -1., xMax: 1., yMin: -1., yMax: 1};
  		const view = ( layout.view === undefined ) ? viewDefault : layout.view;
  
  		const vScaleDefault = [0.,1.];
  		const vScale = ( layout.vScale === undefined ) ? vScaleDefault : layout.vScale;

  		const projectionMatrix = glMatrix.mat4.create();
  		glMatrix.mat4.ortho(projectionMatrix, view.xMin, view.xMax, view.yMin, view.yMax, 0, 1.);
  		console.log(projectionMatrix);
  		const cmap = new Uint8Array([158, 1, 66, 255, 185, 31, 72, 255, 209, 60, 75, 255, 228, 86, 73, 255, 240, 112, 74, 255, 248, 142, 83, 255, 252, 172, 99, 255, 253, 198, 118, 255, 254, 221, 141, 255, 254, 238, 163, 255, 251, 248, 176, 255, 241, 249, 171, 255, 224, 243, 160, 255, 200, 233, 159, 255, 169, 220, 162, 255, 137, 207, 165, 255, 105, 189, 169, 255, 78, 164, 176, 255, 66, 136, 181, 255, 74, 108, 174, 255, 94, 79, 162, 255]); //spectral
  		const cmapTex = twgl.createTexture(gl, {mag: gl.LINEAR, min:gl.LINEAR, src: cmap, width:21, height:1} );
  		const uniforms = {u_matrix: projectionMatrix, u_cmap: cmapTex, u_cmin: vScale[0], u_cmax:vScale[1]};
  
  		gl.useProgram(programInfo.program);
  		twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  		twgl.setUniforms(programInfo, uniforms);
  		gl.drawElements(gl.TRIANGLES, nTris*3, gl.UNSIGNED_INT, 0);

  		const overlay = container.select(".svg-overlay");
  		const scaleMargin = { "left" : width - 50, "top" : height/2 - 50};
  		overlay.select(".scaleArea").remove();
  		const scaleArea = overlay.append("g")
    		.attr("class","scaleArea")
    		.attr("transform", "translate(" + scaleMargin.left + "," + scaleMargin.top + ")");

    	let scaleHeight = 100;
    	let colourScale = d3.scaleSequential( d3.interpolateSpectral );
        colourScale.domain( [0, scaleHeight]);
        const scaleBars = scaleArea.selectAll(".scaleBar")
            .data(d3.range(scaleHeight), function(d) { return d; })
            .enter().append("rect")
                .attr("class", "scaleBar")
                .attr("x", 0 )
                .attr("y", function(d, i) { return scaleHeight - i; })
                .attr("height", 1)
                .attr("width", 20)
                .style("fill", function(d, i ) { return colourScale(d); })

        const cscale = d3.scaleLinear()
            .domain( vScale )
            .range( [scaleHeight, 0]);

        const cAxis = d3.axisRight( cscale ).ticks(5);

        scaleArea.append("g")
            .attr("transform", "translate(20,0)")
            .call(cAxis);
	}, 

	vertShader : `attribute vec2 a_position;
attribute float a_val;
uniform mat4 u_matrix;
varying float v_val;
void main() {
  gl_Position = u_matrix*vec4(a_position,0,1);
  v_val = a_val;
}
` ,

	fragShader : `precision highp float;
uniform sampler2D u_cmap;
uniform float u_cmin, u_cmax;
varying float v_val;
void main() {
  gl_FragColor = texture2D(u_cmap, vec2( (v_val-u_cmin)/(u_cmax-u_cmin) ,0.5));
}
` ,

	


}

export { triMesh2dRender };
