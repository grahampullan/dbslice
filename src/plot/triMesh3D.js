
import * as d3 from 'd3v7';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Plot } from './Plot.js';
import { makeQuadTree, getLine } from './cutQuadTrees.js';

class TriMesh3D extends Plot {

    constructor(options) {
		if (!options) { options = {} }
		options.layout = options.layout || {};
		options.layout.margin = options.layout.margin || {top:2, right:0, bottom:0, left:0};
		if (options.layout.twoDSameScale == undefined) {
			options.layout.twoDSameScale = true;
		}
		if (options.layout.showXAxis) {
			options.layout.margin.bottom += 20;
		}
		if (options.layout.showYAxis) {
			options.layout.margin.left += 35;
		}
		if (options.layout.showColorBar) {
			options.layout.margin.right += 50;
		}
        super(options);
		this.stencilRects = [];
		this.meshUuids = [];
    }

	make() {
		this.updateHeader();
		this.addPlotAreaDiv();
		this.setLasts();

		const container = d3.select(`#${this.id}`);
		const plotArea = d3.select(`#${this.plotAreaId}`);
	
		const boundTipOn = this.tipOn.bind(this);
		const boundTipOff = this.tipOff.bind(this);

		plotArea
			.on( "mouseover", boundTipOn)
			.on( "mouseout", boundTipOff );
 
		const overlay = container.append("svg")
			.attr("class","svg-overlay")
			.style("position","absolute")
			.style("pointer-events", "none")
			.style("top",`${this.plotAreaTop}px`)
			.style("left",`${this.plotAreaLeft - this.layout.margin.left}px`)
			.attr("width", `${this.plotAreaWidth + this.layout.margin.left + this.layout.margin.right}`)
			.attr("height", `${this.plotAreaHeight + this.layout.margin.bottom}`);

		if (this.layout.filterId) {
			this.filterId = this.layout.filterId;
			const filter = this.sharedStateByAncestorId["context"].filters.find( f => f.id == this.filterId );
			if ( this.layout.highlightItems ) {
				const obsId = filter.highlightItemIds.subscribe( this.highlightItems.bind(this) );
				this.subscriptions.push({observable:filter.highlightItemIds, id:obsId});
			}
		}

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

		this.renderer = this.sharedStateByAncestorId["context"].renderer;
		this.cuts = [];
		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();
		this.vScale = [0,1];
		this.update();
	}

	async update() {
		if (this.fetchingData) return;
		await this.getData();
		if (this.data === undefined) return;

		const container = d3.select(`#${this.id}`);
		const overlay = container.select(".svg-overlay");
		const plotArea = container.select(".plot-area");
		const width = this.plotAreaWidth;
		const height = this.plotAreaHeight;
		const layout = this.layout;
		const cameraSync = layout.cameraSync;
		const timeSync = layout.timeSync;
		const plotGroupId = this.ancestorIds[this.ancestorIds.length-1];
		const sharedCamera = this.sharedStateByAncestorId[plotGroupId].sharedCamera;

		const boundUpdateSurfaces = updateSurfaces.bind(this);

		let iStep = 0;
		
		const requestWebGLRender = this.sharedStateByAncestorId[this.boardId].requestWebGLRender;
	
		this.updateHeader();
		this.updatePlotAreaSize();

		overlay
			.attr("width", width+this.layout.margin.left+this.layout.margin.right)
			.attr("height", height+this.layout.margin.bottom);

		this.setLasts();
		this.addAxes();
		this.addColorBar();

		if ( !this.newData ) return;

		this.getOffsets();
		const offsets = this.offsets;
		const nSteps = this.nSteps;
		const nSurfs = this.nSurfs;

		if (layout.cuts?.length > 0) {
			this.initCuts();
			this.makeQuadTrees();
		}

		//
		// values range and colour scale
		//
		let vScale;
        if (layout.vScale === undefined) {
        	vScale = [0,1];
        } else {
        	vScale = layout.vScale;
        }
		this.vScale = vScale;

		const color = ( layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( layout.colourMap );
		this.colorScale = ( layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( layout.colourMap );
        color.domain( [0,1] );

		const textureWidth = 256;
		const textureHeight = 4;
		const texData = new Uint8Array(4*textureWidth*textureHeight);
  		let k=0;
  		for (let j=0; j<textureHeight; j++) {
    		for (let i=0; i<textureWidth; i++) {
				let t = i/textureWidth;
      			let col = d3.rgb(color(t));
      			texData[k] = col.r;
      			texData[k+1] = col.g;
      			texData[k+2] = col.b;
      			texData[k+3] = 255;
      			k += 4;
    		}
  		}
  		const tex = new THREE.DataTexture( texData, textureWidth, textureHeight,  THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.needsUpdate = true;

		//
		// this is deprecated way of handling multipe time steps
		// should be converted to a dimension change handler
		//
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


		// Initialise threejs scene
		if (!this.scene) {
			this.scene = new THREE.Scene();

			// add background
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
                	`gl_Position = vec4( position , 1.0 );`);
        	}
        	background.renderOrder = 9;
        	this.scene.add(background);
			this.background = background;

			// add lights
			const ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );	
			this.scene.add( ambientLight );
			const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
			this.scene.add( light );
			this.light = light;

			// materials for surface rendering
			//const materialCol = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
			this.materialCol = new THREE.MeshLambertMaterial( { color:0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
			this.materialGrey = new THREE.MeshLambertMaterial( { color: 0xaaaaaa, side: THREE.DoubleSide, wireframe:false } );
		}

		
		// get ranges
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
		this.radMax = Math.sqrt(yMax**2 + zMax**2);
		this.xRange = xRange;
		this.yRange = yRange;
		this.zRange = zRange;

		if (xRange[1]-xRange[0]==0.) {
			this.twoD=true;
		}

		//
		// add all surfaces to scene
		//
		this.meshUuids.forEach( uuid => { // remove old surface meshes from scene
			const oldMesh = this.scene.getObjectByProperty('uuid',uuid);
			oldMesh.geometry.dispose();
			oldMesh.material.dispose();
			this.scene.remove(oldMesh);
		});
		this.meshUuids=[];

		const surfFlags = this.layout.surfFlags;
		for (let iSurf = 0; iSurf < nSurfs; iSurf++) {
			const surf = this.getSurface(0, iSurf);
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.BufferAttribute( surf.vertices, 3 ) );
			geometry.setAttribute( 'uv', new THREE.BufferAttribute( surf.uvs, 2 ) );
			geometry.setIndex(new THREE.BufferAttribute( surf.indices, 1));
			geometry.computeVertexNormals();

			let material;
			if ( surfFlags !== undefined ) {
				if ( surfFlags[iSurf] == -1 ) {
					material = this.materialGrey;
				} else {
					material = this.materialCol;
					material.transparent = true;
					material.opacity = surfFlags[iSurf];
				} 
			} else {
				material = this.materialCol;
			}
			material.stencilWrite = true;
        	material.stencilRef = 1;
        	material.stencilFunc = THREE.NotEqualStencilFunc;

			const mesh = new THREE.Mesh( geometry, material );
			mesh.renderOrder = 10;
			this.meshUuids.push( mesh.uuid );
			this.scene.add( mesh );
		}
	
		//
		// add camera
		//
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
				if (this.layout.twoDSameScale) {
					camera = new THREE.OrthographicCamera( -maxDiff, maxDiff, maxDiff, -maxDiff, 0.0001, 100000.);
				} else {
					camera = new THREE.OrthographicCamera( -yDiff/2, yDiff/2, zDiff/2, -zDiff/2, 0.0001, 100000.);
				}
				camera.position.x = xMid + 5*rMax;
				camera.position.y = yMid;
				camera.position.z = zMid;
			}
			
			camera.up.set(0,0,1);
			this.camera = camera;
		}
	
		const camera = this.camera;
		this.light.position.copy( camera.position );
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		//
		// add controls
		//
		if (!this.controls) {
			const controls = new OrbitControls( camera, plotArea.node() );
			controls.target.set( xMid, yMid, zMid );
			controls.enabled = true;
			controls.update();
			if (this.twoD) {
				controls.enableRotate = false;
			}

			controls.addEventListener( 'change', (event) => {
				if ( cameraSync ) {
					sharedCamera.position = this.camera.position;
					sharedCamera.rotation = this.camera.rotation;
					sharedCamera.zoom = this.camera.zoom;
				}
				this.light.position.copy( this.camera.position );
				this.addAxes();
				this.webGLUpdate();
			} ); 
			controls.enableZoom = true; 
			this.controls = controls;
		}
	
		this.addCutLines(); // add cut lines to scene

		if (!this.renderObserverId) {
			this.renderObserverId = requestWebGLRender.subscribeWithData({observer:this.renderScene.bind(this), data:{boxId:this.boxId}});
			this.subscriptions.push({observable:requestWebGLRender, id:this.renderObserverId});
		}
		
		// needs updating to handle dimension change
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

		// needs updating to handle dimension change
		function updateSurfaces(iStep) {
			const meshUuids = this.meshUuids;
			const surfFlags = this.layout.surfFlags;
			const scene = this.scene;
			for (let iSurf = 0; iSurf < nSurfs; iSurf++) {
				const surf = this.getSurface(iStep, iSurf);
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute( 'position', new THREE.BufferAttribute( surf.vertices, 3 ) );
				geometry.setAttribute( 'uv', new THREE.BufferAttribute( surf.uvs, 2 ) );
				geometry.setIndex(new THREE.BufferAttribute(surf.indices, 1));
				geometry.computeVertexNormals();

				const oldMesh = scene.getObjectByProperty('uuid',meshUuids[iSurf]);
				oldMesh.geometry.dispose();
				oldMesh.material.dispose();
    			scene.remove(oldMesh);

				let material;
				if ( surfFlags !== undefined ) {
					if ( surfFlags[iSurf] == -1 ) {
						material = this.materialGrey;
					} else {
						material = this.materialCol;
					} 
				} else {
					material = this.materialCol;
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

		
		if(this.newData) {
			this.webGLUpdate(); // ensures a webGL render after waiting for new data
			this.addAxes();
			this.addColorBar();
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
	
		const plotArea = container.select(".plot-area");
		renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
		let plotRect = plotArea.node().getBoundingClientRect();
		let rect={left:plotRect.left, right:plotRect.right, top:plotRect.top, bottom:plotRect.bottom};

		// set scissor limits
		const ancestorIds = this.ancestorIds.filter(d => (d !== "context" && d.includes("box")) );
		for (let ancestorId of ancestorIds) {
			const plotGroup = d3.select(`#${ancestorId}-component-plot-area`);
			let plotGroupRect = plotGroup.node().getBoundingClientRect();
			if (rect.right < plotGroupRect.left) return;
			if (rect.left > plotGroupRect.right) return;
			if (rect.bottom < plotGroupRect.top) return;
			if (rect.top > plotGroupRect.bottom) return;
			if (rect.left < plotGroupRect.left && rect.right > plotGroupRect.left) {
				rect.left = plotGroupRect.left + 2; 
			}
			if (rect.right > plotGroupRect.right && rect.left < plotGroupRect.right) { 
				rect.right = plotGroupRect.right -2 ; 
			}
			if (rect.top < plotGroupRect.top && rect.bottom > plotGroupRect.top) { 
				rect.top = plotGroupRect.top + 2; 
			}
			if (rect.bottom > plotGroupRect.bottom && rect.top < plotRect.bottom) { 
				rect.bottom = plotGroupRect.bottom - 2;
			}
		}

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

		// set stencil rectangles
        const overlappingDivsClipSpace = this.getOverlappingBoxesInClipSpace(plotRect);
        this.stencilRects.forEach( uuid => {
            const oldRect = this.scene.getObjectByProperty('uuid', uuid);
            oldRect.geometry.dispose();
            oldRect.material.dispose();
            this.scene.remove(oldRect);
        });
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
            const indices = new Uint32Array([0, 2, 1, 0, 3, 2]);
            rectangleBufferGeometryForMesh.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            rectangleBufferGeometryForMesh.setIndex(new THREE.BufferAttribute(indices, 1));

            const rectangleMaterial = new THREE.MeshBasicMaterial({color: "red", wireframe: false});
			if (this.layout.showStencilRects) {
				rectangleMaterial.colorWrite = true;
			} else {
				rectangleMaterial.colorWrite = false;
			}
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

	setCutValue(dimensionName) {
		const cut = this.cuts.find( d => d.dimensionName == dimensionName );
		if ( cut.type == "x") {
			cut.value = cut.point.y;
		} else if ( cut.type == "y") {
			cut.value = cut.point.z;
		} else if ( cut.type == "r") {
			cut.value = Math.sqrt(cut.point.y**2 + cut.point.z**2);
		} else if ( cut.type == "theta") {
			cut.value = Math.atan2(cut.point.z, cut.point.y);
		}
		const requestSetDimension = this.sharedStateByAncestorId["context"].requestSetDimension;
		requestSetDimension.state = { name:dimensionName, dimensionState:{value:cut.value, brushing:cut.brushing }};
	}

	setCutLinePosition(dimensionName) {
		const cut = this.cuts.find( d => d.dimensionName == dimensionName );
		cut.line.geometry.setPositions( this.getCutLinePositionsFromCutValue(dimensionName) );
	}

	getCutLinePositionsFromCutValue(dimensionName) {
		const cut = this.cuts.find( d => d.dimensionName == dimensionName );
		const mid = this.mid;
		const rMax = this.rMax;
		if ( cut.type == "x" ) {
			return [mid.x+2*rMax,cut.value,mid.z-rMax,mid.x+2*rMax,cut.value,mid.z+rMax];
		} else if ( cut.type == "y") {
			return [mid.x+2*rMax,mid.y-rMax,cut.value,mid.x+2*rMax,mid.y+rMax,cut.value];
		} else if ( cut.type == "r" ) {
			const npts = 360;
			const theta = Array.from({length:npts}, (d,i) => 2*Math.PI*i/(npts-1));
			const positions = theta.map(t => ([mid.x+2*rMax, cut.value*Math.sin(t), cut.value*Math.cos(t)]));
			return positions.flat();
		} else if ( cut.type == "theta" ) {
			return [mid.x+2*rMax,0,0,mid.x+2*rMax,this.radMax*Math.cos(cut.value),this.radMax*Math.sin(cut.value)];
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
			highlightItemIds.forEach( (itemId) => {
				if ( itemId == thisItemId ) {
                    container
                        .style("outline-style","solid")
                        .style("outline-color","red")
                        .style("outline-width","4px")
                        .style("outline-offset","0px");
                    box.raise();
					this.webGLUpdate();
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
		let nSurfs = new Int32Array(buffer,ii,1)[0];
		this.nSurfs = nSurfs;
		ii += 4;
		const offsets = [];
		for (let iStep = 0; iStep < nSteps; iStep++) {
			let surfaces = [];
			for (let iSurf = 0; iSurf < nSurfs; iSurf++) {
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

	getSurface(iStep, iSurf) {
		const offsets = this.offsets;
		const buffer = this.data;
		const thisSurface = offsets[iStep][iSurf];
		const nVerts = thisSurface.nVerts;
		const nTris = thisSurface.nTris;
		const vScale = this.vScale;
		const vertices = new Float32Array(buffer, thisSurface.verticesOffset, nVerts * 3);
		const indices = new Uint32Array(buffer, thisSurface.indicesOffset, nTris * 3);
		const values = new Float32Array(buffer, thisSurface.values[0].offset, nVerts);
		const uvs = new Float32Array(Array.from(values).map( d => [ (d-vScale[0])/(vScale[1]-vScale[0]),0.5]).flat());
		return {vertices, indices, values, uvs, nVerts, nTris};
	}

	makeQuadTrees() {
		this.cuts.forEach( cut => {
			cut.quadtrees = [];
			this.setZp(cut);
			for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
				const surf = this.getSurface(0, iSurf);
				const indices = surf.indices;
				const zp = cut.zps[iSurf];
				cut.quadtrees.push(makeQuadTree(indices, zp));
			}
			this.getCutLine(cut.dimensionName);
		});
	}

	setZp(cut) {
		cut.zps = [];
		cut.sdists = [];
		for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
			const surf = this.getSurface(0, iSurf);
			const vertices = surf.vertices;
			const zp = new Float32Array(surf.nVerts);
			const sdist = new Float32Array(surf.nVerts);
			for (let iVert = 0; iVert < surf.nVerts; iVert++) {
				const vert = [vertices[iVert*3], vertices[iVert*3+1], vertices[iVert*3+2]];
				if (cut.type == "x") {
					zp[iVert] = vert[1];
					sdist[iVert] = vert[2];
				} else if (cut.type == "y") {
					zp[iVert] = vert[2];
					sdist[iVert] = vert[1];
				} else if (cut.type == "r") {
					zp[iVert] = Math.sqrt(vert[1]**2 + vert[2]**2);
					let theta = Math.atan2(vert[1],vert[2]);
					sdist[iVert] = theta;
				} else if (cut.type == "theta") {
					zp[iVert] = Math.atan2(vert[2],vert[1]);
					sdist[iVert] = Math.sqrt(vert[1]**2 + vert[2]**2);
				}
			}
			cut.zps.push(zp);
			cut.sdists.push(sdist);
		}
	}

	getCutLine(dimensionName) {
		const cut = this.cuts.find( d => d.dimensionName == dimensionName );
		let lineSegmentsAll = [];
		for (let iSurf = 0; iSurf < this.nSurfs; iSurf++) {
			const surf = this.getSurface(0, iSurf);
			const line = getLine( {...surf, zp:cut.zps[iSurf], sdist:cut.sdists[iSurf]}, cut.quadtrees[iSurf], cut.value );
			lineSegmentsAll = lineSegmentsAll.concat(line);
		}
		this.sharedStateByAncestorId["context"].requestSaveToDerivedData.state = { name:cut.dataStoreName, itemId:this.itemId, data:lineSegmentsAll};
	}

	initCuts() {
		const requestCreateDimension = this.sharedStateByAncestorId["context"].requestCreateDimension;
		this.layout.cuts.forEach( cut => {
			if (this.cuts.map( d => d.dimensionName ).includes(cut.dimensionName)) {
				return;
			}
			const cutToAdd = this.makeCutObject(cut);
			this.setZp(cutToAdd);
			const avgZp = d3.mean(cutToAdd.zps.map( zp => d3.mean(zp)));
			const initValue = cut.value || avgZp;
			requestCreateDimension.state = {name:cut.dimensionName, value:initValue};
			const dimension = this.sharedStateByAncestorId["context"].dimensions.find( d => d.name == cut.dimensionName );
			const dimValue = dimension.state.value;
			cutToAdd.value = dimValue;
			const dimensionName = cut.dimensionName;
			cutToAdd.dimensionObserverId = dimension.subscribe( (data) => {
				const cut = this.cuts.find( d => d.dimensionName == dimensionName );
				cut.value = data.value;
				this.setCutLinePosition(dimensionName);
				if (!data.brushing) {
					this.getCutLine(dimensionName);
				} else if (cut.cutWhileBrushing) {
					this.getCutLine(dimensionName);
				}
				this.webGLUpdate();
			});
			this.subscriptions.push({observable:dimension, id:cutToAdd.dimensionObserverId});
			this.cuts.push(cutToAdd);
		});

	}

	addCutLines() {
		if ( !this.cuts.length ) return;
		this.cuts.forEach( cut => {
			if ( cut.lineAdded ) return;
			const lineMaterial = new LineMaterial( { color: 0xd0d5db, linewidth: 3 } ); // 0x39fc03
			lineMaterial.stencilWrite = true;
			lineMaterial.resolution.set( this.plotAreaWidth, this.plotAreaHeight );
			lineMaterial.depthTest = false;
			lineMaterial.stencilRef = 1;
        	lineMaterial.stencilFunc = THREE.NotEqualStencilFunc;
			const lineGeometry = new LineGeometry();
			lineGeometry.setPositions(this.getCutLinePositionsFromCutValue(cut.dimensionName));
			lineGeometry.computeBoundingSphere();
			const line = new Line2( lineGeometry, lineMaterial );
			line.renderOrder = 10;
			line.computeLineDistances();
			/*
			if ( cut.type == "r" ) { // change raycast method for r cut
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
			}*/
			cut.line = line;
			cut.lineAdded = true;
			this.getCutLine(cut.dimensionName);
			this.scene.add( line );

			
		});



		// add cut line interactions
		const updatePointerPosition = (event) => {
			const plotArea = d3.select(`#${this.id}`).select(".plot-area");
			const rect = plotArea.node().getBoundingClientRect();
			const width = rect.width;
			const height = rect.height;
			this.pointer.x = ( event.clientX - rect.left ) / width * 2 - 1;
			this.pointer.y = - ( event.clientY - rect.top ) / height * 2 + 1;
		}

		const checkOnCutLine = (event) => {
			updatePointerPosition(event);
			this.raycaster.setFromCamera( this.pointer, this.camera );
			this.cuts.forEach( cut => {
				const intersects = this.raycaster.intersectObject( cut.line );
				if (intersects.length > 0) {
					cut.lineDragging = true;
					cut.line.material.color.set(0x42d4f5);
					this.cutLineDragging = true;
					this.controls.enabled = false;
					this.webGLUpdate();
				}
			});
		}

		const cutLineDragged = (event) => {
			if (this.cutLineDragging) {
				const cut = this.cuts.find( cut => cut.lineDragging );
				updatePointerPosition(event.sourceEvent);
				this.raycaster.setFromCamera( this.pointer, this.camera );
				const planeNormal = new THREE.Vector3(1, 0, 0);
				const plane = new THREE.Plane(planeNormal);
				const planeIntersect = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());
				if (planeIntersect) {
					cut.point = planeIntersect;
					cut.brushing = true;
					this.setCutValue(cut.dimensionName);
					this.getCutLine(cut.dimensionName);
				}
			}
		}

		const cutLineDragEnd = () => {
			if (this.cutLineDragging) {
				const cut = this.cuts.find( cut => cut.lineDragging );
				cut.line.material.color.set(0xd0d5db);
				cut.lineDragging = false;
				this.cutLineDragging = false;
				cut.brushing = false;
				this.setCutValue(cut.dimensionName);
			}				
			this.controls.enabled = true;
		}

		const plotArea = d3.select(`#${this.id}`).select(".plot-area");
		const cutLineDrag = d3.drag()
			.on("drag", cutLineDragged)
			.on("end", cutLineDragEnd);
		plotArea.call(cutLineDrag);
		plotArea.node().addEventListener("pointerdown", checkOnCutLine, true);
		this.cutInteractionAdded = true;
		

	}

	handleDimensionChange() {
		this.fetchDataNow = true;
		this.update();
	}
		
	addAxes() {
		if (!this.twoD) return;
		if (!this.layout.showXAxis && !this.layout.showYAxis) return;
		// get current visible range using raycasting intersecting background
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		const planeNormal = new THREE.Vector3(1, 0, 0);
		const plane = new THREE.Plane(planeNormal);
		pointer.x = -1;
		pointer.y = -1;
		raycaster.setFromCamera( pointer, this.camera );
		const intersectBottomLeft = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
		pointer.x = 1;
		pointer.y = 1;
		raycaster.setFromCamera( pointer, this.camera );
		const intersectTopRight = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
		const xRangeVisible = [intersectBottomLeft.y, intersectTopRight.y];
		const yRangeVisible = [intersectBottomLeft.z, intersectTopRight.z];

		const xScale = d3.scaleLinear().domain(xRangeVisible).range([0, this.plotAreaWidth]);
		const yScale = d3.scaleLinear().domain(yRangeVisible).range([this.plotAreaHeight, 0]);

		const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
		const standOff = 2;
		if (this.layout.showXAxis) {
			const xAxis = d3.axisBottom(xScale);
			if (this.layout.xTickNumber) {
				xAxis.ticks(this.layout.xTickNumber);
			}
			const gX = overlay.select(".x-axis");
			if (gX.empty()) {
				overlay.append("g")
					.attr("class","x-axis")
					.attr("transform",`translate(${this.layout.margin.left},${this.plotAreaHeight+standOff})`)
					.style("pointer-events","bounding-box")
					.call(xAxis)
					.call(d3.zoom().on("zoom", (event) => {
						const transform = event.transform;
						let yDiff = this.yRange[1] - this.yRange[0]; 
						this.camera.left = -1./transform.k * yDiff/2;
						this.camera.right = 1./transform.k * yDiff/2;
						this.camera.updateProjectionMatrix();
						this.webGLUpdate();
						this.addAxes();
					}));	
			} else {
				gX.attr("transform",`translate(${this.layout.margin.left},${this.plotAreaHeight+standOff})`)
				.call(xAxis);
			}
		}

		if (this.layout.showYAxis) {
			const yAxis = d3.axisLeft(yScale);
			if (this.layout.yTickNumber) {
				yAxis.ticks(this.layout.yTickNumber);
			}
			const gY = overlay.select(".y-axis");
			if (gY.empty()) {
				overlay.append("g")
					.attr("class","y-axis")
					.attr("transform",`translate(${this.layout.margin.left-standOff},0)`)
					.style("pointer-events","bounding-box")
					.call(yAxis)
					.call(d3.zoom().on("zoom", (event) => {
						const transform = event.transform;
						let zDiff = this.zRange[1] - this.zRange[0]; 
						this.camera.top = 1./transform.k * zDiff/2;
						this.camera.bottom = -1./transform.k * zDiff/2;
						this.camera.updateProjectionMatrix();
						this.webGLUpdate();
						this.addAxes();
					}));	
			} else {
				gY.attr("transform",`translate(${this.layout.margin.left-standOff},0)`)
					.call(yAxis);
			}
		}
	}

	addColorBar() {
		if (!this.layout.showColorBar || !this.colorScale) return;
		const overlay = d3.select(`#${this.id}`).select(".svg-overlay");

		const scaleHeight = this.plotAreaHeight/2;
		const colorScale = this.colorScale;
		colorScale.domain( [0, scaleHeight]);

		let scaleArea = overlay.select(".scale-area");
		if (scaleArea.empty()) {
			scaleArea = overlay.append("g")
				.attr("class","scale-area")
		}
		scaleArea
			.attr("transform",`translate(${this.plotAreaWidth+this.layout.margin.left+5},${this.layout.margin.top})`);
		
		scaleArea.selectAll(".scale-bar").remove();
		
		const scaleBars = scaleArea.selectAll(".scale-bar")
			.data(d3.range(scaleHeight))
			.enter().append("rect")
				.attr("class", "scale-bar")
				.attr("x", 0 )
				.attr("y", function(d, i) { return scaleHeight - i; })
				.attr("height", 1)
				.attr("width", 15)
				.style("stroke", "none")
				.style("fill", function(d, i ) { return colorScale(d); })
		
		const cScale = d3.scaleLinear()
			.domain( this.vScale )
			.range( [scaleHeight, 0]);
		
		const cAxis = d3.axisRight( cScale ).ticks(4);
		
		const gC = scaleArea.select(".c-axis");

		if (gC.empty()) {
			scaleArea.append("g")
				.attr("class","c-axis")
				.attr("transform",`translate(15,1)`)
				.call(cAxis);
		} else {
			gC.attr("transform",`translate(15,1)`)
				.call(cAxis);
		}

	}


}

export { TriMesh3D };