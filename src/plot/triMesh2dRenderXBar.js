import { dbsliceData } from '../core/dbsliceData.js';
import { render } from '../core/render.js';


const triMesh2dRenderXBar = {

	make : function ( element, data, layout ) {

		const container = d3.select(element);

    container.style("position","relative")

        const width = container.node().offsetWidth;
        const height = width; // force square plots for now

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
  
		triMesh2dRenderXBar.update ( element, data, layout );

	},

	update : function (element, data, layout ) {


		const container = d3.select(element);
		const width = container.node().offsetWidth;
        const height = width; // force square plots for now

		const canvas = container.select("canvas");

		const gl = canvas.node().getContext("webgl", {antialias: true, depth: false});
		twgl.addExtensionsToContext(gl);
		const programInfo = twgl.createProgramInfo(gl, [triMesh2dRenderXBar.vertShader, triMesh2dRenderXBar.fragShader]);

		const tm = data.triMesh;

		const nTris = tm.indices.length/3;

		let values, vertices;

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

        let zpCut = layout.zpCut;

        let xScale = d3.scaleLinear()
          .domain([view.xMin, view.xMax])
          .range([0,width]);

        let yScale = d3.scaleLinear()
          .domain([view.yMin, view.yMax])
          .range([height,0]); 

        let barCoords = [[xScale(zpCut),0],[xScale(zpCut),height]];
        let barPath = overlay.select(".bar");
        if (barPath.empty()) {
          overlay.append("path")
            .attr("class","bar")
            .attr("fill", "none")
            .attr("stroke", "Gray")
            .attr("stroke-width", 5)
            .style("opacity",0.8)
            .style("cursor","ew-resize")
            .attr("d",d3.line()(barCoords))
            .call(d3.drag().on("drag", dragged));     
        } else {
            barPath.attr("d",d3.line()(barCoords));
        }

       function dragged(d) {
          zpCut = xScale.invert(d3.event.x);
          layout.zpCut = zpCut;
          barCoords = [[xScale(zpCut),0],[xScale(zpCut),height]];
          d3.select(this).attr("d",d3.line()(barCoords));
          const thisLine = getCut ({indices:tm.indices, vertices, values}, zp, zpCut);
          dbsliceData.xCut=thisLine.map(d=>d.map(e=>([e[1],e[2]])));
          render( dbsliceData.elementId, dbsliceData.session, dbsliceData.config );

       }

        
        const zp=new Float32Array(nVerts);
        for (let i=0; i<nVerts; i++) {
          zp[i]=vertices[2*i];  // x values
        } 


        const thisLine = getCut ({indices:tm.indices, vertices, values}, zp, zpCut);
        dbsliceData.xCut=thisLine.map(d=>d.map(e=>([e[1],e[2]])));

        function getCut( tm, zp, zpCut) {
          let cutTris = findCutTrisLine(data.qTree,zpCut);
          let line = getLineFromCutTris(tm, zp, zpCut, cutTris);
          return line;
        }



        function findCutTrisLine(tree, zpCut) {
          const cutTris=[];
          tree.visit(function(node,x1,x2,y1,y2) {
            if (!node.length) {
              do {
                let d = node.data;
                let triIndx = d.i;
                let triCut = (d.zpMin <= zpCut) && (d.zpMax >= zpCut);
                if ( triCut ) { cutTris.push(triIndx); }
              } while (node = node.next);
            }
            return (x1 > zpCut || y2 < zpCut) ;
          });
          return cutTris;
        }


        function getLineFromCutTris(tm, zp, zpCut, cutTris) {
  
          let lineSegments = [];

          const cutEdgeCases = [
            [ [0,1] , [0,2] ],
            [ [0,1] , [0,2] ],
            [ [0,1] , [1,2] ],
            [ [0,2] , [1,2] ],
            [ [0,2] , [1,2] ],
            [ [0,1] , [1,2] ],
            [ [0,1] , [0,2] ],
            [ [0,1] , [0,2] ]  
          ];
  
          cutTris.forEach( itri => {
            let verts = getVerts(itri, tm, zp);
            let t0 = verts[0][0] <= zpCut;
            let t1 = verts[1][0] <= zpCut;
            let t2 = verts[2][0] <= zpCut;  
            let caseIndx= t0<<0 | t1<<1 | t2<<2;
            let cutEdges = cutEdgeCases[caseIndx];
            let vertA = cutEdge(verts, cutEdges[0], zpCut);
            let vertB = cutEdge(verts, cutEdges[1], zpCut);
            let lineSegment = [];
            vertA.shift();
            vertB.shift();
            lineSegment.push(vertA);
            lineSegment.push(vertB);
            lineSegments.push(lineSegment);
          });

          return lineSegments;
        }

        function getVerts(itri,tm,zp) {
          let verts = [];
          for (let i=0; i<3; i++) {
            let ivert = tm.indices[itri*3 + i];
            let vert = [];
            vert.push(zp[ivert]);
            vert.push(tm.vertices[ivert*2]);
            vert.push(tm.vertices[ivert*2+1]);
            vert.push(tm.values[ivert]);
            verts.push(vert);
          }
        return verts;
        }

        function cutEdge(verts, edge, zpcut) {
          let i0 = edge[0];
          let i1 = edge[1];
          let zp0 = verts[i0][0];
          let zp1 = verts[i1][0];
          let frac = (zpcut-zp0)/(zp1-zp0);
          let frac1 = 1.-frac;
          let vert = [];
          let nvals = verts[0].length;
          for (let n=0; n<nvals; n++) {
            let cutVal = frac1*verts[i0][n] + frac*verts[i1][n];
            vert.push(cutVal);
          }
          return vert;
        }
        

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

export { triMesh2dRenderXBar };
