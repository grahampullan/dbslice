
import * as d3 from 'd3v7';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Plot } from './Plot.js';
import { light } from '@fortawesome/fontawesome-svg-core/import.macro';


class TriMesh3D extends Plot {

    constructor(options) {
		if (!options) { options={} }
		options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:0, right:0, bottom:0, left:0};
        super(options);
		this.stencilRects = [];
    }

	make() {
		this.updateHeader();
		this.addPlotAreaDiv();
		const container = d3.select(`#${this.id}`);
		const plotArea = d3.select(`#${this.plotAreaId}`);
		if (this.layout.filterId) {
			this.filterId = this.layout.filterId;
        	const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        	if ( this.layout.highlightItems ) {
            	const obsId = filter.highlightItemIds.subscribe( this.highlightItems.bind(this) );
				this.subscriptions.push({observable:filter.highlightItemIds, id:obsId});
			}
        }
	
		const boundTipOn = this.tipOn.bind(this);
		const boundTipOff = this.tipOff.bind(this);

		plotArea
			.on( "mouseover", boundTipOn)
			.on( "mouseout", boundTipOff );
		this.setLasts();
 
		this.renderer = this.sharedStateByAncestorId["context"].renderer;

		const overlay = container.append("svg")
			.attr("class","svg-overlay")
			.style("position","absolute")
			.style("pointer-events", "none")
			.style("z-index",2)
			.style("top",`${this.plotAreaTop}px`)
			.style("left",`${this.plotAreaLeft}px`)
			.attr("width", `${this.plotAreaWidth}px`)
			.attr("height", `${this.plotAreaHeight}px`);

		this.cut= {};
		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();
		this.cut.lineDragging = false;
		this.update();

	}

	async update() {
		if (this.fetchingData) return;
		await this.getData();

		const container = d3.select(`#${this.id}`);
		const overlay = container.select(".svg-overlay");
		const plotArea = container.select(".plot-area");
		const width = this.plotAreaWidth;
		const height = this.plotAreaHeight;
		const layout = this.layout;
		const cameraSync = layout.cameraSync;
		const timeSync = layout.timeSync;
		const highlightTasks = layout.highlightTasks;
		const plotGroupId = this.ancestorIds[this.ancestorIds.length-1];
		const sharedCamera = this.sharedStateByAncestorId[plotGroupId].sharedCamera;
		const sharedCutValue = this.sharedStateByAncestorId[plotGroupId].sharedCutValue;
		const buffer = this.data;
		const renderer = this.renderer;
		const cut = this.cut;
		const pointer = this.pointer;
		const raycaster = this.raycaster;
		

		const boundUpdateSurfaces = updateSurfaces.bind(this);
		const boundRenderScene = this.renderScene.bind(this);
		//const boundFindZpCut = findZpCut.bind(this);
		const boundGetCutLine = getCutLine.bind(this);
		const boundWebGLUpdate = this.webGLUpdate.bind(this);
		const boundCheckOnCutLine = checkOnCutLine.bind(this);
		const boundCutLineDragged = cutLineDragged.bind(this);
		const boundCutLineDragEnd = cutLineDragEnd.bind(this);
		const boundUpdatePointerPosition = updatePointerPosition.bind(this);
		//const boundSetCutLinePosition = setCutLinePosition.bind(this);
		//const boundSetCutValue = setCutValue.bind(this);

		let iStep = 0;
		

		const requestWebGLRender = this.sharedStateByAncestorId[this.boardId].requestWebGLRender;
		const requestCutEvaluate = this.sharedStateByAncestorId[plotGroupId].requestCutEvaluate;
	
		this.updateHeader();
		this.updatePlotAreaSize();

		overlay
			.attr("width", width)
			.attr("height", height);

		this.setLasts();
		this.webGLUpdate();

		//if (this.updateType == "layout") {
		//		return;
		//}

		if ( !this.newData ) {
			return;
		}

		this.getOffsets();
		const offsets = this.offsets;
		const nSteps = this.nSteps;
		const nSurfsNow = this.nSurfsNow;

		if (layout.cut) {
			makeQuadTree();
			if (!this.cut.requestCutObserverId) {
				this.cut.requestCutObserverId = requestCutEvaluate.subscribe( boundGetCutLine );
				this.subscriptions.push({observable:requestCutEvaluate, id:this.cut.requestCutObserverId});
			}
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



		if (this.watchedTime !== undefined) {
			iStep = this.watchedTime.iStep;
		} else {
			iStep = 0
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
		const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
		const backgroundColour = this.layout.backgroundColour || 0xefefef;
        const backgroundMaterial = new THREE.MeshBasicMaterial({color: backgroundColour});
        backgroundMaterial.depthWrite = false;
        backgroundMaterial.stencilWrite = true;
        backgroundMaterial.stencilRef = 1;
        backgroundMaterial.stencilFunc = THREE.NotEqualStencilFunc;
        const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        background.material.onBeforeCompile = function( shader ){
                    shader.vertexShader = shader.vertexShader.replace( `#include <project_vertex>` , 
                        `gl_Position = vec4( position , 1.0 );`
                    );
                }
        background.renderOrder = 9;
        scene.add(background);


		//const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
		const materialCol = new THREE.MeshLambertMaterial( { color:0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
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
		this.mid = {x:xMid, y:yMid, z:zMid};
		this.rMax = rMax;

		if (xRange[1]-xRange[0]==0.) {
			this.twoD=true;
		}

		/*
		const light1 = new THREE.Light( 0xffffff, 0.8 );
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
		*/
		const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );	
		scene.add( ambientLight );
		const light = new THREE.DirectionalLight( 0xffffff, 1 );
		scene.add( light );
		this.light = light;
		

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
			material.stencilWrite = true;
        	material.stencilRef = 1;
        	material.stencilFunc = THREE.NotEqualStencilFunc;

			const mesh = new THREE.Mesh( geometry, material );
			mesh.renderOrder = 10;
			meshUuids.push( mesh.uuid );
			scene.add( mesh );
		}
		this.scene = scene;
	
		// Define the camera
		if (!this.camera) {
			let camera;

			if (!this.twoD) {
				camera = new THREE.PerspectiveCamera( 75, width/height,0.001 , 1000. );
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
		light.position.copy( camera.position );
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		
		if (!this.controls) {
			const controls = new OrbitControls( camera, plotArea.node() );
			controls.target.set( xMid, yMid, zMid );
			controls.enabled = true;
			controls.update();
			if (this.twoD) {
				controls.enableRotate = false;
			}

			controls.addEventListener( 'change', function(){
				if ( cameraSync ) {
					sharedCamera.position = camera.position;
					sharedCamera.rotation = camera.rotation;
					sharedCamera.zoom = camera.zoom;
				}
				light.position.copy( camera.position );
				boundWebGLUpdate();
			} ); 
			controls.enableZoom = true; 
			this.controls = controls;
		}
		//this.controls.enabled = false;

		if (layout.cut && !this.cut.LineAdded) {
			
			const lineMaterial = new LineMaterial( { color: 0x39fc03, linewidth: 3 } );
			lineMaterial.stencilWrite = true;
			lineMaterial.resolution.set( width, height );
			lineMaterial.depthTest = false;
			lineMaterial.stencilRef = 1;
        	lineMaterial.stencilFunc = THREE.NotEqualStencilFunc;
			const lineGeometry = new LineGeometry();
			if (layout.cutType=="x") {
				this.cut.value = yMid;
				lineGeometry.setPositions( this.getCutLinePositionsFromCutValue() );
			} else if (layout.cutType=="r") {
				this.cut.value = Math.sqrt( yMid**2 + zMid**2);
				lineGeometry.setPositions( this.getCutLinePositionsFromCutValue() );
			}
			//lineGeometry.setPositions( [xMid+0.5*rMax,yMid,zMid-rMax,xMid+0.5*rMax,yMid,zMid+rMax] );
			lineGeometry.computeBoundingSphere();
			const line = new Line2( lineGeometry, lineMaterial );
			line.renderOrder = 10;
			line.computeLineDistances();
			if (layout.cutType=="r") {
			line.raycast = function (raycaster, intersects) {
				if (!this.geometry.boundingBox) {
					this.geometry.computeBoundingBox();
				}
				const boundingBox = this.geometry.boundingBox.clone();
				boundingBox.applyMatrix4(this.matrixWorld); // Transform to world space
			
				if (raycaster.ray.intersectsBox(boundingBox)) {
					intersects.push({
						distance: raycaster.ray.origin.distanceTo(boundingBox.getCenter(new THREE.Vector3())),
						point: boundingBox.getCenter(new THREE.Vector3()),
						object: this,
					});
				}
			};
			}
				
			this.scene.add( line );
			this.cut.line = line;
			this.cut.lineAdded = true;
			
			const cutLineDrag = d3.drag()
				.on("drag", boundCutLineDragged)
				.on("end", boundCutLineDragEnd);

			plotArea.call(cutLineDrag);
			plotArea.node().addEventListener("pointerdown", boundCheckOnCutLine, true);


		}

		this.renderScene();

		
		if (!this.renderObserverId) {
			this.renderObserverId = requestWebGLRender.subscribeWithData({observer:boundRenderScene, data:{boxId:this.boxId}});
			this.subscriptions.push({observable:requestWebGLRender, id:this.renderObserverId});
		}
		
		function checkOnCutLine(event) {
			boundUpdatePointerPosition(event);
			const raycaster = this.raycaster;
			raycaster.setFromCamera( this.pointer, this.camera );
			const intersects = raycaster.intersectObject( this.cut.line );
			if (intersects.length > 0) {
				this.cut.lineDragging = true;
				this.controls.enabled = false;
			}
		}

		function cutLineDragged(event) {
			if (this.cut.lineDragging) {
				boundUpdatePointerPosition(event.sourceEvent);
				const raycaster = this.raycaster;
				raycaster.setFromCamera( this.pointer, this.camera );
				const planeNormal = new THREE.Vector3(1, 0, 0);
				const plane = new THREE.Plane(planeNormal);
				const planeIntersect = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
				if (planeIntersect) {
					this.cut.point = planeIntersect;
					this.setCutValue();
					this.setCutLinePosition();
					boundWebGLUpdate();
					boundGetCutLine();
				}
			}
		}

		function cutLineDragEnd() {
			if (this.cut.lineDragging) {
				this.cut.lineDragging = false;
				requestCutEvaluate.state = true;
			}				
			this.controls.enabled = true;
		}

		
		function updatePointerPosition(event) {
			const plotArea = d3.select(`#${this.id}`).select(".plot-area");
			const rect = plotArea.node().getBoundingClientRect();
			const width = rect.width;
			const height = rect.height;
			pointer.x = ( event.clientX - rect.left ) / width * 2 - 1;
			pointer.y = - ( event.clientY - rect.top ) / height * 2 + 1;
		}

		function timeStepSliderChange() {
			iStep = this.value;
			//if ( layout.xCut) {
			//	boundFindZpCut(cutData.zpClip, 0.);
			//}
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
				material.stencilWrite = true;
        		material.stencilRef = 1;
        		material.stencilFunc = THREE.NotEqualStencilFunc;
				const newMesh = new THREE.Mesh( geometry, material );
				newMesh.renderOrder = 10;
				meshUuids[iSurf] = newMesh.uuid;
				scene.add( newMesh );
			} 
			this.scene = scene;
			this.renderScene();
		}

		/*
		function barDragged(event,d){
			let xCutPix = event.x;
			d3.select(this)
				.attr("d",d3.line()([[xCutPix,0],[xCutPix,height]]));
			let xClip = ( event.x / width ) * 2 - 1;
			let yClip = - ( event.y / height ) * 2 + 1;
			boundFindZpCut( xClip, yClip );
			cutData.zpClip = xClip;
			cutData.zpPix = xCutPix;    
		}*/

		/*function findZpCut(xPt, yPt) {
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
				cut.zpCutValue = d3.mean(intersects, d => d.point.y);
				const cutLine = boundGetCutLine();
				//dbsliceData.derived[layout.cutDataId] = cutLine;
				//update();
			}

		}*/

		function makeQuadTree() {
			cut.quadtrees = [];
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
					let zpTri;
					if (layout.cutType=="x") {
						zpTri = [vertices[i0*3+1], vertices[i1*3+1], vertices[i2*3+1]]; // y coord 
					} else if (layout.cutType=="r") {
						zpTri = [Math.sqrt(vertices[i0*3+1]**2 + vertices[i0*3+2]**2), Math.sqrt(vertices[i1*3+1]**2 + vertices[i1*3+2]**2), Math.sqrt(vertices[i2*3+1]**2 + vertices[i2*3+2]**2)]; // r coord
					}
					let zpMin = Math.min(...zpTri);
					let zpMax = Math.max(...zpTri);
					tris.push( {zpMin,zpMax,i:iTri} );
				}
				const quadtree = d3.quadtree()
					.x(d => d.zpMin)
					.y(d => d.zpMax)
					.addAll(tris);
				cut.quadtrees.push(quadtree);
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
					if (layout.cutType=="x") {
          				zp[i] = vertices[3*i + 1];  // y values
					} else if (layout.cutType=="r") {
						zp[i] = Math.sqrt(vertices[3*i + 1]**2 + vertices[3*i + 2]**2); // r values
					}
        		} 
				const line = getCut(tm, zp, cut.value, iSurf );
				lineSegmentsAll = lineSegmentsAll.concat(line);
			}
			this.sharedStateByAncestorId["context"].requestSaveToDerivedData.state={name:this.layout.cutDataStoreName, itemId:this.itemId, data:lineSegmentsAll};
			return lineSegmentsAll;
		}

		function getCut( tm, zp, zpCut, iSurf) {
			let cutTris = findCutTrisLine(cut.quadtrees[iSurf], zpCut);
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
				if (layout.cutType=="x") {
			  		vert.push(tm.vertices[ivert*3+2]);
				} else if (layout.cutType=="r") {
					let theta = Math.atan2(tm.vertices[ivert*3+1],tm.vertices[ivert*3+2]);
					vert.push(zp[ivert]*theta); // r*theta
				}
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

	renderScene() {
		if (!this.scene) return;
		const renderer = this.renderer;
		const light = this.light;
		const container = d3.select(`#${this.id}`);
		const sharedCamera = this.sharedStateByAncestorId[this.ancestorIds[this.ancestorIds.length-1]].sharedCamera;
		const sharedCameraPosition = sharedCamera.position;
		const sharedCameraRotation = sharedCamera.rotation;
		const sharedCameraZoom = sharedCamera.zoom;
		const sharedCutValue = this.sharedStateByAncestorId[this.ancestorIds[this.ancestorIds.length-1]].sharedCutValue;
	
		if (this.layout.cameraSync && sharedCameraPosition) {
			this.camera.position.copy(sharedCameraPosition);
			this.camera.rotation.copy(sharedCameraRotation);
			this.camera.zoom = sharedCameraZoom;
			this.camera.updateProjectionMatrix();
			this.camera.updateMatrixWorld();
			light.position.copy( this.camera.position );
		}

		if (this.layout.cutValueSync && sharedCutValue.cutValue) {
			this.cut.value = sharedCutValue.cutValue;
			this.setCutLinePosition();
		}

		const plotArea = container.select(".plot-area");
		renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
		let plotRect = plotArea.node().getBoundingClientRect();
		const ancestorId = this.ancestorIds[this.ancestorIds.length-1];
		let rect={left:plotRect.left, right:plotRect.right, top:plotRect.top, bottom:plotRect.bottom};
		if (ancestorId !== "context") {
			const plotGroup = d3.select(`#${ancestorId}-component-plot-area`);
			let plotGroupRect = plotGroup.node().getBoundingClientRect();
			if (plotRect.right < plotGroupRect.left) {return;}
			if (plotRect.left > plotGroupRect.right) {return;}
			if (plotRect.bottom < plotGroupRect.top) {return;}
			if (plotRect.top > plotGroupRect.bottom) {return;}
			if (plotRect.left < plotGroupRect.left && plotRect.right > plotGroupRect.left) {
				rect.left = plotGroupRect.left + 2; 
			}
			if (plotRect.right > plotGroupRect.right && plotRect.left < plotGroupRect.right) { 
				rect.right = plotGroupRect.right -2 ; 
			}
			if (plotRect.top < plotGroupRect.top && plotRect.bottom > plotGroupRect.top) { 
				rect.top = plotGroupRect.top + 2; 
			}
			if (plotRect.bottom > plotGroupRect.bottom && plotRect.top < plotRect.bottom) { 
				rect.bottom = plotGroupRect.bottom - 2;
			}
            const overlappingDivsClipSpace = this.getOverlappingBoxesInClipSpace(plotRect);
            this.stencilRects.forEach( uuid => {
                const oldRect = this.scene.getObjectByProperty('uuid', uuid);
                oldRect.geometry.dispose();
                oldRect.material.dispose();
                this.scene.remove(oldRect);
            })
            this.stencilRects = [];

            overlappingDivsClipSpace.forEach(d => {
				const margin={left:0.00,right:0.02,top:0.00,bottom:0.02};
                const rectangleBufferGeometryForMesh = new THREE.BufferGeometry();
				const vertTopLeftClip = new THREE.Vector3(d.left-margin.left, d.top+margin.top, 0.5);
				const vertTopRightClip = new THREE.Vector3(d.right+margin.right, d.top+margin.top, 0.5);
				const vertBottomLeftClip = new THREE.Vector3(d.left-margin.left, d.bottom-margin.bottom, 0.5);
				const vertBottomRightClip = new THREE.Vector3(d.right+margin.right, d.bottom-margin.bottom, 0.5);
				const vertTopLeftWorld = vertTopLeftClip.unproject(this.camera);
				const vertTopRightWorld = vertTopRightClip.unproject(this.camera);
				const vertBottomLeftWorld = vertBottomLeftClip.unproject(this.camera);
				const vertBottomRightWorld = vertBottomRightClip.unproject(this.camera);

				const vertices = new Float32Array([
					vertTopLeftWorld.x, vertTopLeftWorld.y, vertTopLeftWorld.z,
					vertTopRightWorld.x, vertTopRightWorld.y, vertTopRightWorld.z,
					vertBottomRightWorld.x, vertBottomRightWorld.y, vertBottomRightWorld.z,
					vertBottomLeftWorld.x, vertBottomLeftWorld.y, vertBottomLeftWorld.z
				]);

                const indices = new Uint32Array([
                    0, 2, 1,
                    0, 3, 2
                ]);
                rectangleBufferGeometryForMesh.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                rectangleBufferGeometryForMesh.setIndex(new THREE.BufferAttribute(indices, 1));

                const rectangleMaterial = new THREE.MeshBasicMaterial({color: "red", wireframe: false});
                rectangleMaterial.colorWrite = false;
                rectangleMaterial.depthWrite = false;
				rectangleMaterial.depthTest = false;
                rectangleMaterial.stencilWrite = true;
                rectangleMaterial.stencilRef = 1;
                rectangleMaterial.stencilFunc = THREE.AlwaysStencilFunc;
                rectangleMaterial.stencilZPass = THREE.ReplaceStencilOp;
                const rectangle = new THREE.Mesh(rectangleBufferGeometryForMesh, rectangleMaterial);
                rectangle.renderOrder = 0;

                this.stencilRects.push(rectangle.uuid)
                this.scene.add(rectangle);  
                
            });

		}

		const scissorLeft = Math.floor(rect.left);
		const scissorBottom = Math.floor(renderer.domElement.clientHeight - rect.bottom);
		const scissorWidth = Math.floor(rect.right - rect.left);
		const scissorHeight = Math.floor(rect.bottom - rect.top);

		const viewLeft = Math.floor(plotRect.left);
		const viewBottom = Math.floor(renderer.domElement.clientHeight - plotRect.bottom);
		const viewWidth = Math.floor(plotRect.right - plotRect.left);
		const viewHeight = Math.floor(plotRect.bottom - plotRect.top);

		//renderer.setClearColor( 0xe0e0e0 );
		renderer.setScissorTest( true );
	
		renderer.setViewport( viewLeft, viewBottom, viewWidth, viewHeight );
		renderer.setScissor( scissorLeft, scissorBottom, scissorWidth, scissorHeight);
		renderer.clear(true,true,false);
			
		renderer.render(this.scene, this.camera);
		renderer.setScissorTest( false );
	}

	setCutValue() {
		// need to check what kind of cut is being made
		const cutType = this.layout.cutType;
		if (cutType == "x") {
			this.cut.value = this.cut.point.y;
		} else if (cutType == "r") {
			this.cut.value = Math.sqrt(this.cut.point.y**2 + this.cut.point.z**2);
		}
		if (this.layout.cutValueSync) {
			const sharedCutValue = this.sharedStateByAncestorId[this.ancestorIds[this.ancestorIds.length-1]].sharedCutValue;
			sharedCutValue.cutValue = this.cut.value;
		}
	}

	setCutLinePosition() {
		const cutLine = this.cut.line;
		cutLine.geometry.setPositions( this.getCutLinePositionsFromCutValue() );
	}

	getCutLinePositionsFromCutValue() {
		const mid = this.mid;
		const rMax = this.rMax;
		const cutType = this.layout.cutType;
		const cutValue = this.cut.value;
		if (cutType == "x") {
			return [mid.x+0.5*rMax,cutValue,mid.z-rMax,mid.x+0.5*rMax,cutValue,mid.z+rMax];
		} else if (cutType == "r") {
			const npts=360;
			const theta = Array.from({length:npts}, (d,i) => 2*Math.PI*i/npts);
			const positions = theta.map(t => ([mid.x+0.5*rMax, cutValue*Math.cos(t),cutValue*Math.sin(t)]));
			return positions.flat();
		}
	}


	remove() {
		this.removeSubscriptions();
		const meshUuids = this.meshUuids;
		meshUuids.forEach( meshUuid => {
			const oldMesh = this.scene.getObjectByProperty('uuid',meshUuid);
			oldMesh.geometry.dispose();
			oldMesh.material.dispose();
			this.scene.remove(oldMesh);
		});
	}

	highlightItems(){

		const container = d3.select(`#${this.id}`);
		const box = d3.select(`#${this.boxId}`);
        const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
        const highlightItemIds = filter.highlightItemIds.state.itemIds;
		const boundWebGLUpdate = this.webGLUpdate.bind(this);
        
        const thisItemId = this.itemId;
	
		if (highlightItemIds === undefined || highlightItemIds.length == 0) {
			container.style("outline-width","0px");
 		} else {
			container.style("outline-width","0px")
			highlightItemIds.forEach( function (itemId) {
				if ( itemId == thisItemId ) {
                    container
                        .style("outline-style","solid")
                        .style("outline-color","red")
                        .style("outline-width","4px")
                        .style("outline-offset","0px");
                    box.raise();
					boundWebGLUpdate();
				}
            });
        }
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
				let floats = new Float32Array(buffer,ii,7);
				ii += 28;
				let rMax = floats[0];
				let xRange = floats.slice(1,3);
				let yRange = floats.slice(3,5);
				let zRange = floats.slice(5,7);
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
		if (!this.layout.highlightItems) { return; };
		const container = d3.select(`#${this.id}`);
		const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
		const highlightItemIds = filter.highlightItemIds;
		if ( this.layout.highlightItems ) {
			container
				.style("outline-style","solid")
				.style("outline-color","red")
				.style("outline-width","4px")
				.style("outline-offset","0px")
				.raise();
			highlightItemIds.state = {itemIds:[this.itemId]};
		}
	}

	tipOff() {
		if (!this.layout.highlightItems) { return; };
		const container = d3.select(`#${this.id}`);
		const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
		const highlightItemIds = filter.highlightItemIds;
		if ( this.layout.highlightItems ) {
			container.style("outline-width","0px")
			highlightItemIds.state = {itemIds:[]};
		}
	}

}

export { TriMesh3D };