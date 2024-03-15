//import { dbsliceData } from '../core/dbsliceData.js';
//import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3v7';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';
//import { update } from '../core/update.js';
import { Plot } from './Plot.js';

class triMesh3D extends Plot {

    constructor(options) {
		if (!options) { options={} }
		options.margin = {top:10, right:10, bottom:10, left:10};
        super(options);
    }

	make() {
		const container = d3.select(`#${this.parentId}`);
		const boundTipOn = this.tipOn.bind(this);
		const boundTipOff = this.tipOff.bind(this);

        const div = container.append("div")
            .attr("class", `${this.containerClassName}`)
            .style("position", "relative")
			.on( "mouseover", boundTipOn)
			.on( "mouseout", boundTipOff );
		this.lastWidth = this.width;
		this.lastHeight = this.height;
        this.setContainerSize();  

		const renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: true});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( this.containerWidth , this.containerHeight );
		div.node().appendChild( renderer.domElement );
		this.renderer = renderer;

		div.select("canvas")
			.style("position","absolute")
			.style("top","0px")
			.style("left","0px");

		const overlay = div.append("svg")
			.attr("class","svg-overlay")
			.style("position","absolute")
			.style("pointer-events", "none")
			.style("z-index",2)
			.style("top","0px")
			.style("left","0px")
			.attr("width", this.containerWidth)
			.attr("height", this.containerHeight);

		this.cutData = {};
		
		this.update();

	}

	update() {

		const container = d3.select(`#${this.parentId}`);
		const overlay = container.select(".svg-overlay");
		const plotArea = container.select(".plot-area");
		const width = this.containerWidth;
		const height = this.containerHeight;
		const layout = this.layout;
		const cameraSync = layout.cameraSync;
		const timeSync = layout.timeSync;
		const highlightTasks = layout.highlightTasks;
		//const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
		//const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
		const buffer = this.data;
		const renderer = this.renderer;
		const cutData = this.cutData;

		const boundUpdateSurfaces = updateSurfaces.bind(this);
		const boundRenderScene = renderScene.bind(this);
		const boundFindZpCut = findZpCut.bind(this);
		const boundGetCutLine = getCutLine.bind(this);

		if ( !this.newData && !this.checkResize ) {
            return
        }
		
		renderer.setSize( width , height );
		this.setContainerSize();
		overlay
			.attr("width", width)
			.attr("height", height);

		this.getOffsets();
		const offsets = this.offsets;
		const nSteps = this.nSteps;
		const nSurfsNow = this.nSurfsNow;

		if (layout.xCut) {
			makeQuadTree();
		}
		
		let vScale;
        if (layout.vScale === undefined) {
        	vScale = [0,1];
        } else {
        	vScale = layout.vScale;
        }

		const color = ( layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( layout.colourMap );
        color.domain( [0,1] );

		const textureWidth = 256;
		const textureHeight = 4;
		const texData = new Uint8Array(4*textureWidth*textureHeight);
  		let k=0;
  		for (let j=0; j<textureHeight; j++) {
    		for (let i=0; i<textureWidth; i++) {
      			let col = d3.rgb(color(i/textureWidth));
      			texData[k] = col.r;
      			texData[k+1] = col.g;
      			texData[k+2] = col.b;
      			texData[k+3] = 255;
      			k += 4;
    		}
  		}
  		const tex = new THREE.DataTexture( texData, textureWidth, textureHeight,  THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping);
  		tex.needsUpdate = true;

		if ( nSteps > 1 ){
			let timeSlider = plotArea.select(".time-slider");
            if ( timeSlider.empty() ) {
				plotArea.append("input")
					.attr("class", "form-range time-slider")
					.style("position","absolute")
					.style("top","0px")
					.style("left","0px")
					.attr("type","range")
					.attr("min",0)
					.attr("value",0)
					.attr("max",nSteps-1)
					.attr("step",1)
					.on( "input", timeStepSliderChange );

				let handler = {
					set: function(target, key, valueset) {
						target[key] = valueset;
						if (key = 'iStep') {
							plotArea.select(".time-slider").node().value = valueset;
							boundUpdateSurfaces(valueset);
						}
						return true;
					}
				};
				let watchedTime = new Proxy({iStep:0}, handler);
				this.watchedTime = watchedTime;
			} else {
				timeSlider.attr("max", nSteps-1);
			}
		}


		let iStep;
		if (this.watchedTime !== undefined) {
			iStep = this.watchedTime.iStep;
		} else {
			iStep = 0
		}

		if (layout.xCut) {
			let xBar = overlay.select(".x-bar");
            if ( xBar.empty() ) {
				cutData.zpClip = 0.;
				cutData.zpPix = width/2.;
				overlay.append("path")
					.attr("class","x-bar")
					.attr("fill", "none")
					.attr("stroke", "Gray")
					.attr("stroke-width", 5)
					.style("pointer-events","stroke")
					.style("opacity",0.5)
					.style("cursor","ew-resize")
					.attr("d",d3.line()([[cutData.zpPix,0],[cutData.zpPix,height]]))
					.call(d3.drag().on("drag", barDragged));
			}
		}

		if (layout.colorBar) {
			const colorBarMargin = { "left" : width - 60, "top" : 24};
			const colorBarHeight = parseInt(height/3);
			const cscale = d3.scaleLinear()
				.domain( vScale )
				.range( [colorBarHeight, 0]);
			let colorBarArea = overlay.select(".color-bar");
			if ( colorBarArea.empty() ) {
				colorBarArea = overlay.append("g")
					.attr("class", "color-bar")
					.attr("transform", `translate( ${colorBarMargin.left} , ${colorBarMargin.top} )`);
				const colorBarScale = ( layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( layout.colourMap );
				colorBarScale.domain( [0, colorBarHeight]);
				const scaleBars = colorBarArea.selectAll(".scale-bar")
					.data(d3.range(colorBarHeight), function(d) { return d; })
					.enter().append("rect")
						.attr("class", "scale-bar")
						.attr("x", 0 )
						.attr("y", (d, i) => colorBarHeight - i )
						.attr("height", 1)
						.attr("width", 16)
						.style("fill", d => colorBarScale(d) );
			}

			colorBarArea.attr("transform", `translate( ${colorBarMargin.left} , ${colorBarMargin.top} )`);

			const cAxis = d3.axisRight( cscale );
			if ( layout.cBarTickNumber !== undefined ) { cAxis.ticks(layout.cBarTickNumber); }
			if ( layout.cBarTickFormat !== undefined ) { cAxis.tickFormat(d3.format(layout.cBarTickFormat)); }
			let gC = colorBarArea.select(".axis-c");
			if ( gC.empty() ) {
				gC = colorBarArea.append("g")
					.attr( "class", "axis-c")
					.attr("transform", "translate(18,0)")
					.call( cAxis );
			} else {
				gC.call( cAxis );
			}

		}

		// Initialise threejs scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xefefef );

		//const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
		const materialCol = new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
		const materialGrey = new THREE.MeshLambertMaterial( { color: 0xaaaaaa, side: THREE.DoubleSide, wireframe:false } );

		// look at all surfaces for sizes to set camera and lights
		const xRanges = offsets[iStep].map(d => d.xRange);
		const yRanges = offsets[iStep].map(d => d.yRange);
		const zRanges = offsets[iStep].map(d => d.zRange);
		const xMin = Math.min(...xRanges.map(d => d[0]));
		const xMax = Math.max(...xRanges.map(d => d[1]));
		const yMin = Math.min(...yRanges.map(d => d[0]));
		const yMax = Math.max(...yRanges.map(d => d[1]));
		const zMin = Math.min(...zRanges.map(d => d[0]));
		const zMax = Math.max(...zRanges.map(d => d[1]));
		let xRange = [xMin, xMax];
		let yRange = [yMin, yMax];
		let zRange = [zMin, zMax];
		let xMid = 0.5*( xRange[0] + xRange[1] );
		let yMid = 0.5*( yRange[0] + yRange[1] );
		let zMid = 0.5*( zRange[0] + zRange[1] );
		let rMax = Math.sqrt((xMax-xMin)**2 + (yMax-yMin)**2 + (zMax-zMin)**2);

		if (xRange[1]-xRange[0]==0.) {
			this.twoD=true;
		}

		const light1 = new THREE.PointLight( 0xffffff, 0.8 );
		light1.position.set( xMid, yMid, zMid + 10*rMax );
		const light2 = new THREE.PointLight( 0xffffff, 0.8 );
		light2.position.set( xMid, yMid, zMid - 10*rMax );
		const light3 = new THREE.PointLight( 0xffffff, 0.8 );
		light3.position.set( xMid + 10*rMax, yMid, zMid  );
		const light4 = new THREE.PointLight( 0xffffff, 0.8 );
		light4.position.set( xMid - 10*rMax, yMid, zMid );
		const light5 = new THREE.PointLight( 0xffffff, 0.8 );
		light5.position.set( xMid, yMid + 10*rMax, zMid  );
		const light6 = new THREE.PointLight( 0xffffff, 0.8 );
		light6.position.set( xMid, yMid - 10*rMax, zMid );

		scene.add( light1 );
		scene.add( light2 );
		scene.add( light3 );
		scene.add( light4 );
		scene.add( light5 );
		scene.add( light6 );

		// add all surfaces to scene
		this.meshUuids = [];
		const meshUuids = this.meshUuids;
		const surfFlags = this.layout.surfFlags;
		for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
			let thisSurface = offsets[iStep][iSurf];
			const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
			const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
			const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
			const uvs = new Float32Array(Array.from(values).map( d => [ (d-vScale[0])/(vScale[1]-vScale[0]),0.5]).flat());

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
			geometry.setIndex(new THREE.BufferAttribute(indices, 1));
			geometry.computeVertexNormals();

			let material;
			if ( surfFlags !== undefined ) {
				if ( surfFlags[iSurf] == -1 ) {
					material = materialGrey;
				} else {
					material = materialCol;
					material.transparent = true;
					material.opacity = surfFlags[iSurf];
				} 
			} else {
				material = materialCol;
			}
			const mesh = new THREE.Mesh( geometry, material );
			meshUuids.push( mesh.uuid );
			scene.add( mesh );
		}
		this.scene = scene;
	
		// Define the camera
		if (!this.camera) {
			let camera;

			if (!this.twoD) {
				camera = new THREE.PerspectiveCamera( 45, width/height, 0.0001, 1000. );
				camera.position.x = xMid + rMax;
				camera.position.y = yMid;
				camera.position.z = zMid;
			} else {
				let yDiff = yRange[1] - yRange[0];
				let zDiff = zRange[1] - zRange[0];
				let maxDiff = Math.max(yDiff, zDiff);
				camera = new THREE.OrthographicCamera( -maxDiff, maxDiff, maxDiff, -maxDiff, 0.0001, 100000.);
				camera.position.x = xMid + 1000*rMax;
				camera.position.y = yMid;
				camera.position.z = zMid;
			}
			
			camera.up.set(0,0,1);
			this.camera = camera;
		}
	
		const camera = this.camera;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		if (this.watchedCamera !== undefined) {
			camera.position.copy(this.watchedCamera.position);
			camera.rotation.copy(this.watchedCamera.rotation);
		}

		if ( cameraSync && !this.watchedCamera) {
			let handler = {
				set: function(target, key, value) {
					camera[key].copy(value);
					boundRenderScene();
					return true;
				}
			};
			let watchedCamera = new Proxy({position: camera.position, rotation: camera.rotation}, handler);
			this.watchedCamera = watchedCamera;
		}

		// Add controls 
		if (!this.controls) {
			const controls = new OrbitControls( camera, renderer.domElement );
			controls.target.set( xMid, yMid, zMid );
			controls.enabled = true;
			controls.update();
			if (this.twoD) {
				controls.enableRotate = false;
			}

			controls.addEventListener( 'change', function(){
				boundRenderScene();
				if ( layout.xCut) {
					boundFindZpCut(cutData.zpClip, 0.);
				}
				//if ( cameraSync ) {
				//	let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				//	plots.forEach( (plot) =>  {
				//		if (plot.watchedCamera !== undefined) {
				//			plot.watchedCamera.position = camera.position;
				//			plot.watchedCamera.rotation = camera.rotation;
				//		}
				//	});
				//}
			} ); 
			controls.enableZoom = true; 
			this.controls = controls;
		}
	
		boundRenderScene();

		if ( layout.xCut && !this.checkResize ) {
			boundFindZpCut(cutData.zpClip, 0.);
		}

		function timeStepSliderChange() {
			iStep = this.value;
			if ( layout.xCut) {
				boundFindZpCut(cutData.zpClip, 0.);
			}
			//const plot = dbsliceData.session.plotRows[plotRowIndex].plots[plotIndex];
			//plot.watchedTime.iStep = iStep;
			//if ( timeSync ) {
			//	const plots = dbsliceData.session.plotRows[plotRowIndex].plots;
			//	plots.forEach( (plot, indx) =>  {
			//		if ( indx !== plotIndex && plot.watchedTime !== undefined) {
			//			plot.watchedTime.iStep = iStep;
			//		}
			//	});
			//}
		}

		function updateSurfaces(iStep) {
			const offsets = this.offsets;
			const buffer = this.data;
			const meshUuids = this.meshUuids;
			const surfFlags = this.layout.surfFlags;
			const scene = this.scene;
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				let thisSurface = offsets[iStep][iSurf];
				const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
				const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
				const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
				const uvs = new Float32Array(Array.from(values).map( d => [(d-vScale[0])/(vScale[1]-vScale[0]),0.5]).flat());
			
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
				geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
				geometry.setIndex(new THREE.BufferAttribute(indices, 1));
				geometry.computeVertexNormals();

				const oldMesh = scene.getObjectByProperty('uuid',meshUuids[iSurf]);
				oldMesh.geometry.dispose();
				oldMesh.material.dispose();
    			scene.remove(oldMesh);

				let material;
				if ( surfFlags !== undefined ) {
					if ( surfFlags[iSurf] == -1 ) {
						material = materialGrey;
					} else {
						material = materialCol;
					} 
				} else {
					material = materialCol;
				}
				const newMesh = new THREE.Mesh( geometry, material );
				meshUuids[iSurf] = newMesh.uuid;
				scene.add( newMesh );
			} 
			this.scene = scene;
			boundRenderScene();
		}

		function renderScene() {
			this.renderer.render(this.scene, camera);
		}

		function barDragged(event,d){
			let xCutPix = event.x;
			d3.select(this)
				.attr("d",d3.line()([[xCutPix,0],[xCutPix,height]]));
			let xClip = ( event.x / width ) * 2 - 1;
			let yClip = - ( event.y / height ) * 2 + 1;
			boundFindZpCut( xClip, yClip );
			cutData.zpClip = xClip;
			cutData.zpPix = xCutPix;    
		}

		function findZpCut(xPt, yPt) {
			let objects = this.meshUuids.map(d => this.scene.getObjectByProperty('uuid',d));
			let raycaster = new THREE.Raycaster();
			let pointer = new THREE.Vector2();
			pointer.x = xPt; // clip space
			let yPts = [ yPt ,0.,-0.5,0.5];
			const intersects = [];
			yPts.forEach( yPtNow => {
				pointer.y = yPtNow;
				raycaster.setFromCamera( pointer, camera );
				let newIntersects = raycaster.intersectObjects( objects );
				if (newIntersects.length > 0) {
					intersects.push(newIntersects[0]);
				}
			});
			if (intersects.length > 0 ){
				cutData.zpCutValue = d3.mean(intersects, d => d.point.y);
				const cutLine = boundGetCutLine();
				//dbsliceData.derived[layout.cutDataId] = cutLine;
				//update();
			}

		}

		function makeQuadTree() {
			cutData.quadtrees = [];
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				const tris = [];
				let thisSurface = offsets[0][iSurf]; // iStep = 0
				const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
				const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
				let nt = indices.length/3;
				for (let iTri=0; iTri < nt; iTri++) {
					let i0 = indices[iTri*3];
					let i1 = indices[iTri*3+1];
					let i2 = indices[iTri*3+2];
					let zpTri = [vertices[i0*3+1], vertices[i1*3+1], vertices[i2*3+1]]; // y coord 
					let zpMin = Math.min(...zpTri);
					let zpMax = Math.max(...zpTri);
					tris.push( {zpMin,zpMax,i:iTri} );
				}
				const quadtree = d3.quadtree()
					.x(d => d.zpMin)
					.y(d => d.zpMax)
					.addAll(tris);
				cutData.quadtrees.push(quadtree);
			}
			
		}

		function getCutLine() {
			const buffer = this.data;
			const offsets = this.offsets;
			let lineSegmentsAll = [];
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				let thisSurface = offsets[iStep][iSurf]; // iStep = 0
				const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
				const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
				const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
				const tm = {vertices, indices, values};
				const zp = new Float32Array(thisSurface.nVerts);
        		for (let i=0; i<thisSurface.nVerts; i++) {
          			zp[i] = vertices[3*i + 1];  // y values
        		} 
				const line = getCut(tm, zp, cutData.zpCutValue, iSurf );
				lineSegmentsAll = lineSegmentsAll.concat(line);
			}
			return lineSegmentsAll;
		}

		function getCut( tm, zp, zpCut, iSurf) {
			let cutTris = findCutTrisLine(cutData.quadtrees[iSurf], zpCut);
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
			  	let caseIndx = t0<<0 | t1<<1 | t2<<2;
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
			  	//vert.push(tm.vertices[ivert*2]);
			  	vert.push(tm.vertices[ivert*3+2]);
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

		
		this.newData = false;
		this.lastWidth = this.width;
		this.lastHeight = this.height;

	}

	highlightTasks(){

		/*if (!this.layout.highlightTasks) return;

		const container = d3.select(`#${this.elementId}`);
        const thisTaskId = this.taskId;

		if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {
			container.style("outline-width","0px")
 		} else {
			container.style("outline-width","0px")
			dbsliceData.highlightTasks.forEach( function (taskId) {
				if ( taskId == thisTaskId ) {
                    container
                        .style("outline-style","solid")
                        .style("outline-color","red")
                        .style("outline-width","4px")
                        .style("outline-offset","0px")
                        .raise();
				}
            });
        }*/
	}

	getOffsets() {

		const buffer = this.data;

		// parse arrayBuffer to make lookup offsets object
		let ii = 0 // byte index
		const nSteps = new Int32Array(buffer,ii,1)[0];
		this.nSteps = nSteps;
		ii += 4;
		let nSurfsNow = new Int32Array(buffer,ii,1)[0];
		this.nSurfsNow = nSurfsNow;
		ii += 4;
		const offsets = [];
		for (let iStep = 0; iStep < nSteps; iStep++) {
			let surfaces = [];
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				let surfNameBytes = new Int8Array(buffer,ii,96);
				ii += 96;
				let surfName = String.fromCharCode(...surfNameBytes).trim().split('\u0000')[0];
				let ints = new Int32Array(buffer,ii,3);
				ii += 12;
				let nVerts = ints[0];
				let nTris = ints[1];
				let nValues = ints[2];
				//console.log(surfName, nVerts, nTris, nValues);
				let floats = new Float32Array(buffer,ii,7);
				ii += 28;
				let rMax = floats[0];
				let xRange = floats.slice(1,3);
				let yRange = floats.slice(3,5);
				let zRange = floats.slice(5,7);
				//console.log(xRange,yRange,zRange);
				let verticesOffset;
				let indicesOffset;
				if ( nVerts > 0 && nTris == 0 && iStep > 0 ) { // this is a fixed vertices check
					verticesOffset = offsets[0][iSurf].verticesOffset;
					indicesOffset = offsets[0][iSurf].indicesOffset;
					nTris = offsets[0][iSurf].nTris;
				} else {
					verticesOffset = ii;
					ii += nVerts*3*4;
					indicesOffset = ii;
					ii += nTris*3*4;
				}
				let valuesList = [];
				for (let iValue = 0; iValue < nValues; iValue++) {
					let valueNameBytes = new Int8Array(buffer,ii,96);
					ii += 96;
					let valueName = String.fromCharCode(...valueNameBytes).trim().split('\u0000')[0];
					let valueRange = new Float32Array(buffer,ii,2);
					ii +=8;
					let valuesOffset = ii;
					ii += nVerts*4;
					valuesList.push( { name : valueName, range : valueRange, offset : valuesOffset });
				}
				surfaces.push( {name : surfName, nVerts, nTris, nValues, rMax, xRange, yRange, zRange, 
					verticesOffset, indicesOffset, values : valuesList });
			}
			offsets.push(surfaces);
		}
		this.offsets = offsets;
	}

	tipOn() {
		/*const container = d3.select(`#${this.elementId}`);
		const highlightTasks = this.layout.highlightTasks;
		if ( highlightTasks ) {
			container
				.style("outline-style","solid")
				.style("outline-color","red")
				.style("outline-width","4px")
				.style("outline-offset","0px")
				.raise();
			dbsliceData.highlightTasks = [taskId];
			highlightTasksAllPlots();
		}*/
	}

	tipOff() {
		/*const container = d3.select(`#${this.elementId}`);
		const highlightTasks = this.layout.highlightTasks;
		if ( highlightTasks ) {
			container.style("outline-width","0px")
			dbsliceData.highlightTasks = [];
			highlightTasksAllPlots();
		}*/
	}

}

export { triMesh3D };