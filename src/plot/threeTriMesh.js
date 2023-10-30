import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';

const threeTriMesh = {

	make : function () {

		const container = d3.select(`#${this.elementId}`);
		const width = container.node().offsetWidth;
		const height = this.layout.height;

		const boundTipOn = this.tipOn.bind(this);
		const boundTipOff = this.tipOff.bind(this);
		const div = container.append("div")
			.attr("class", "plot-area")
			.on( "mouseover", boundTipOn)
			.on( "mouseout", boundTipOff );

		const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( width , height );
		div.node().appendChild( renderer.domElement );
		this.renderer = renderer;

		this.update();

	},

	update : function () {

		this.getOffsets();

		const container = d3.select(`#${this.elementId}`);
		const taskId = this.taskId;
		const cameraSync = this.layout.cameraSync;
		const timeSync = this.layout.timeSync;
		const highlightTasks = this.layout.highlightTasks;
		const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
		const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
		const nSteps = this.nSteps;
		const nSurfsNow = this.nSurfsNow;
		const buffer = this.data;
		const renderer = this.renderer;

		const boundUpdateSurfaces = updateSurfaces.bind(this);
		const boundRenderScene = renderScene.bind(this);

		if (this.layout.newData == false && dbsliceData.windowResize == false) {
            return
        }

		
		let vScale;
        if (this.layout.vScale === undefined) {
        	vScale = [0,1];
        } else {
        	vScale = this.layout.vScale;
        }

		const color = ( this.layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( this.layout.colourMap );
        color.domain( vScale );

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
			let timeSlider = container.select(".time-slider");
            if ( timeSlider.empty() ) {
				container.insert("input",":first-child")
					.attr("class", "form-range time-slider")
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
							container.select(".time-slider").node().value = valueset;
							boundUpdateSurfaces(valueset);
						}
						return true;
					}
				};
				let watchedTime = new Proxy({iStep:0}, handler);
				this.watchedTime = watchedTime;
			}
		}

		const width = container.node().offsetWidth;
		const height = this.layout.height;
		renderer.setSize( width , height );

		// Initialise threejs scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xefefef );

		//const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
		const material = new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );

		const offsets = this.offsets;
		// use size of first surface to set camera and lights
		let iStep = this.watchedTime.iStep;
		let iSurface = 0;
		let thisSurface = offsets[iStep][iSurface];
		let xRange = thisSurface.xRange;
		let yRange = thisSurface.yRange;
		let zRange = thisSurface.zRange;
		let xMid = 0.5*( xRange[0] + xRange[1] );
		let yMid = 0.5*( yRange[0] + yRange[1] );
		let zMid = 0.5*( zRange[0] + zRange[1] );
		let rMax = thisSurface.rMax;

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
		for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
			let thisSurface = offsets[iStep][iSurf];
			const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
			const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
			const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
			const uvs = new Float32Array(Array.from(values).map( d => [d,0.5]).flat());

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
			geometry.setIndex(new THREE.BufferAttribute(indices, 1));
			geometry.computeVertexNormals();

			const mesh = new THREE.Mesh( geometry, material );
			meshUuids.push( mesh.uuid );
			scene.add( mesh );
		}
		this.scene = scene;
	
		// Define the camera
		const camera = new THREE.PerspectiveCamera( 45, width/height, 0.0001, 1000. );
		camera.position.x = xMid + 2*rMax;
		camera.position.y = yMid;
		camera.position.z = zMid;
		camera.up.set(0,0,1);

		if (this.watchedCamera !== undefined) {
			camera.position.copy(this.watchedCamera.position);
			camera.rotation.copy(this.watchedCamera.rotation);
		}

		if ( cameraSync && !this.watchedCamera) {
			let handler = {
				set: function(target, key, value) {
					camera[key].copy(value);
					//renderer.render(scene,camera);
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
			if (xRange[1]-xRange[0]==0.) {
				controls.enableRotate = false;
			}

			controls.addEventListener( 'change', function(){
    			//renderer.render(scene,camera); // re-render if controls move/zoom 
				boundRenderScene();
				if ( cameraSync ) {
					let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
					plots.forEach( (plot) =>  {
						if (plot.watchedCamera !== undefined) {
							plot.watchedCamera.position = camera.position;
							plot.watchedCamera.rotation = camera.rotation;
						}
					});
				}
			} ); 
			controls.enableZoom = true; 
			this.controls = controls;
		}
	
		boundRenderScene();

		function timeStepSliderChange() {
			iStep = this.value;
			const plot = dbsliceData.session.plotRows[plotRowIndex].plots[plotIndex];
			plot.watchedTime.iStep = iStep;
			if ( timeSync ) {
				const plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if ( indx !== plotIndex && plot.watchedTime !== undefined) {
						plot.watchedTime.iStep = iStep;
					}
				});
			}
			//boundUpdateSurfaces(iStep);
		}

		function updateSurfaces(iStep) {
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				let thisSurface = this.offsets[iStep][iSurf];
				const vertices = new Float32Array(this.data, thisSurface.verticesOffset, thisSurface.nVerts * 3);
				const indices = new Uint32Array(this.data, thisSurface.indicesOffset, thisSurface.nTris * 3);
				const values = new Float32Array(this.data, thisSurface.values[0].offset, thisSurface.nVerts);
				const uvs = new Float32Array(Array.from(values).map( d => [d,0.5]).flat());
			
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
				geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
				geometry.setIndex(new THREE.BufferAttribute(indices, 1));
				geometry.computeVertexNormals();

				const oldMesh = scene.getObjectByProperty('uuid',meshUuids[iSurf]);
				oldMesh.geometry.dispose();
				oldMesh.material.dispose();
    			scene.remove(oldMesh);

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

		

		this.layout.newData = false;

	},

	highlightTasks : function(){

		if (!this.layout.highlightTasks) return;

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
        }
	},

	getOffsets : function() {


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
	},

	tipOn : function() {
		const container = d3.select(`#${this.elementId}`);
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
		}
	},

	tipOff : function() {
		const container = d3.select(`#${this.elementId}`);
		const highlightTasks = this.layout.highlightTasks;
		if ( highlightTasks ) {
			container.style("outline-width","0px")
			dbsliceData.highlightTasks = [];
			highlightTasksAllPlots();
		}
	}

}

export { threeTriMesh };