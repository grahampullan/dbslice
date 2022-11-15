import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';
import { TrackballControls } from 'three124/examples/jsm/controls/TrackBallControls';


const threeTriMesh = {

	make : function ( element, buffer, layout ) {

		threeTriMesh.update ( element, buffer, layout );

	},

	update : function (element, buffer, layout ) {

		var container = d3.select(element);

		if ( layout.highlightTasks == true ) {

            if (dbsliceData.highlightTasks === undefined || dbsliceData.highlightTasks.length == 0) {

                container.style("outline-width","0px")
 
            } else {

                container.style("outline-width","0px")

                dbsliceData.highlightTasks.forEach( function (taskId) {

                	//console.log(layout.taskId);

                    if ( taskId == layout.taskId ) {
                    
                        container
                            .style("outline-style","solid")
                            .style("outline-color","red")
                            .style("outline-width","4px")
                            .style("outline-offset","4px")
                            .raise();

                    }

                });
            }
        }

		if (layout.newData == false && dbsliceData.windowResize == false) {
            return
        }

		// parse arrayBuffer to make lookup offsets object
		let ii = 0 // byte index
		const nSteps = new Int32Array(buffer,ii,1)[0];
		ii += 4;
		let nSurfsNow = new Int32Array(buffer,ii,1)[0];
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


        if (layout.vScale === undefined) {
        	var vScale = [0,1];
        } else {
        	var vScale = layout.vScale;
        }

		var color = ( layout.colourMap === undefined ) ? d3.scaleSequential( t => interpolateSpectral(1-t)  ) : d3.scaleSequential( layout.colourMap );
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

		container.select(".plotArea").remove();

		var div = container.append("div")
			.attr("class", "plotArea")
			.on( "mouseover", tipOn )
			.on( "mouseout", tipOff );

		if ( nSteps > 0 ){
			div.append("input")
				.attr("class", "form-range time-slider")
				.attr("type","range")
				.attr("id","time")
				.attr("name","time")
				.attr("min",0)
				.attr("value",0)
				.attr("max",nSteps-1)
				.attr("step",1)
				.on( "input change", timeStepSliderChange );
		}

		var width = container.node().offsetWidth,
			height = layout.height;

		// Initialise threejs scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xefefef );
			
		// Create renderer
		var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( width , height )

		//const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
		const material = new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );

		// use size of first surface to set camera and lights
		let iStep = 0;
		let iSurface = 0;
		let thisSurface=offsets[iStep][iSurface];
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

		// add all surfaces (at iStep = 0) to scene
		layout._meshUuids = [];
		for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
			let thisSurface=offsets[iStep][iSurf];
			const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
			const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
			const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
			const uvs = new Float32Array(Array.from(values).map( d => [d,0.5]).flat());
			let xRange = thisSurface.xRange;

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
			geometry.setIndex(new THREE.BufferAttribute(indices, 1));
			geometry.computeVertexNormals();
			if (xRange[1]-xRange[0]==0.) {
				geometry.rotateY(Math.PI/2);
			}

			const mesh = new THREE.Mesh( geometry, material );
			layout._meshUuids.push( mesh.uuid );
			scene.add( mesh );
		}
	
		// Set target DIV for rendering
		//var container = document.getElementById( elementId );
		div.node().appendChild( renderer.domElement );

		// Define the camera
		var camera = new THREE.PerspectiveCamera( 45, width/height, 0.0001, 1000. );
		camera.position.x = xMid + 2*(xRange[1]-xRange[0]);
		camera.position.y = yMid;
		camera.position.z = zMid;

		if ( layout.cameraSync ) {
			let handler = {
				set: function(target, key, value) {
					camera[key].copy(value);
					renderer.render(scene,camera);
					return true;
				}
			};
			let watchedCamera = new Proxy({position: camera.position, rotation: camera.rotation}, handler);
			layout.watchedCamera = watchedCamera;
		}

		if ( layout.timeSync ) {
			let handler = {
				set: function(target, key, value) {
					target[key] = value;
					if (key = 'iStep') {
						div.select(".time-slider").attr("value",value);
						updateSurfaces(value);
					}
					return true;
				}
			};
			let watchedTime = new Proxy({iStep}, handler);
			layout.watchedTime = watchedTime;
		}


		// Add controls 
		
		camera.up.set(0,0,1);
		const controls = new OrbitControls( camera, renderer.domElement );
		controls.target.set( xMid, yMid, zMid );
		controls.enabled = true;
		controls.update();
		if (xRange[1]-xRange[0]==0.) {
			controls.minAzimuthAngle = 0.;
			controls.maxAzimuthAngle = 0.;
			controls.minPolarAngle = Math.PI/2;
			controls.maxPolarAngle = Math.PI/2;
		}
		controls.addEventListener( 'change', function(){
    		renderer.render(scene,camera); // re-render if controls move/zoom 
			if ( layout.cameraSync ) {
				let plotRowIndex = container.attr("plot-row-index");
				let plotIndex = container.attr("plot-index");
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex) {
						plot.layout.watchedCamera.position = camera.position;
						plot.layout.watchedCamera.rotation = camera.rotation;
					}
				});
			}
		} ); 
		controls.enableZoom = true; 
		
		// Make initial call to render scene
		renderer.render( scene, camera );


		function timeStepSliderChange() {
			iStep = this.value;
			if ( layout.timeSync ) {
				let plotRowIndex = container.attr("plot-row-index");
				let plotIndex = container.attr("plot-index");
				let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
				plots.forEach( (plot, indx) =>  {
					if (indx != plotIndex) {
						plot.layout.watchedTime.iStep = iStep;
					}
				});
			}
			updateSurfaces(iStep);
		}

		function updateSurfaces(iStep) {
			for (let iSurf = 0; iSurf < nSurfsNow; iSurf++) {
				let thisSurface=offsets[iStep][iSurf];
				const vertices = new Float32Array(buffer, thisSurface.verticesOffset, thisSurface.nVerts * 3);
				const indices = new Uint32Array(buffer, thisSurface.indicesOffset, thisSurface.nTris * 3);
				const values = new Float32Array(buffer, thisSurface.values[0].offset, thisSurface.nVerts);
				const uvs = new Float32Array(Array.from(values).map( d => [d,0.5]).flat());
				let xRange = thisSurface.xRange;
			
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
				geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
				geometry.setIndex(new THREE.BufferAttribute(indices, 1));
				geometry.computeVertexNormals();
				if (xRange[1]-xRange[0]==0.) {
					geometry.rotateY(Math.PI/2);
				}

				const oldMesh = scene.getObjectByProperty('uuid',layout._meshUuids[iSurf]);
				oldMesh.geometry.dispose();
				oldMesh.material.dispose();
    			scene.remove(oldMesh);

				const newMesh = new THREE.Mesh( geometry, material );
				layout._meshUuids[iSurf] = newMesh.uuid;
				scene.add( newMesh );
			}
			renderer.render(scene,camera);
		}

		function tipOn() {
            if ( layout.highlightTasks == true ) {
                container
                    .style("outline-style","solid")
                    .style("outline-color","red")
                    .style("outline-width","4px")
                    .style("outline-offset","-4px")
                    .raise();
                dbsliceData.highlightTasks = [layout.taskId];
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }

        function tipOff() {
            if ( layout.highlightTasks == true ) {
                container.style("outline-width","0px")
                dbsliceData.highlightTasks = [];
                update( dbsliceData.elementId, dbsliceData.session );
            }
        }

		layout.newData = false;

	}

}

export { threeTriMesh };