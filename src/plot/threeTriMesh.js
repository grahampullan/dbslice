import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';

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

		if (layout.newData == false) {
            return
        }

        if (layout.vScale === undefined) {
        	var vScale = [0,1];
        } else {
        	var vScale = layout.vScale;
        }

		// extract data from binary buffer
		const intsHeader = new Int32Array(buffer,0,4);
		const nSurfs=intsHeader[0];
		const nVerts=intsHeader[1];
		const nTris = intsHeader[2];
		const nValues = intsHeader[3];
		const rmax = new Float32Array(buffer,16,1)[0];
		const xyzRanges = new Float32Array(buffer,20,6);
		const vertices = new Float32Array(buffer,44,nVerts*3);
		const indices = new Uint32Array(buffer,44 + nVerts*4*3,nTris*3);
		const valuesRange = new Float32Array(buffer, 44 + nVerts*4*3 + nTris*4*3, 2);
		const values = new Float32Array(buffer,44+ nVerts*4*3 + nTris*4*3 + 8, nVerts*nValues);
		const uvs = new Float32Array(Array.from(values).map( d => [d,0.5]).flat());

        var color = ( layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
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


		var width = container.node().offsetWidth,
			height = layout.height;
    
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
		geometry.setIndex(new THREE.BufferAttribute(indices, 1));
		if (xyzRanges[1]-xyzRanges[0]==0.) {
			geometry.rotateY(Math.PI/2);
		}

		const material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide, wireframe:false, map: tex} );
			
		// Initialise threejs scene
		const scene = new THREE.Scene();
		scene.background = new THREE.Color( 0xefefef );
		scene.add( new THREE.Mesh( geometry, material ) );
    
		// Create renderer
		var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( width , height );

		// Set target DIV for rendering
		//var container = document.getElementById( elementId );
		div.node().appendChild( renderer.domElement );

		// Define the camera
		var camera = new THREE.PerspectiveCamera( 45, width/height, 0.0001, 1000. );
		camera.position.z = 2*rmax; 

		if ( layout.cameraSync ) {

			let plotRowIndex = container.attr("plot-row-index");
			let plotIndex = container.attr("plot-index");

			//console.log(plotRowIndex);
			//console.log(dbsliceData.session.plotRows[plotRowIndex].plots.length);

			let plotRow = dbsliceData.session.plotRows[plotRowIndex];

			plotRow.plots[plotIndex].layout.camera = {position: camera.position, rotation: camera.rotation};

			let validator = {
				set: function(target, key, value) {
					camera[key].copy(value);
					//console.log(camera[key]);
					renderer.render(scene,camera);
					return true;
				}
			};
			let watchedCamera = new Proxy({position: camera.position, rotation: camera.rotation}, validator);
			plotRow.plots[plotIndex].layout.watchedCamera = watchedCamera;

		}


		// Add controls 
		const controls = new OrbitControls( camera, renderer.domElement );
		if (xyzRanges[1]-xyzRanges[0]==0.) {
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
				//console.log(camera.rotation);
				plots.forEach( (plot, indx) =>  {
					//console.log(plot);
					if (indx != plotIndex) {
						//console.log(camera.rotation);
						//console.log(indx);
						plot.layout.watchedCamera.position = camera.position;
						plot.layout.watchedCamera.rotation = camera.rotation;
					}
				});
			}
		} ); 
		controls.enableZoom = true; 

		// Make initial call to render scene
		renderer.render( scene, camera );

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