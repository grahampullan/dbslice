import { dbsliceData } from '../core/dbsliceData.js';
import { update } from '../core/update.js';
import * as d3 from 'd3';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three124';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';

const threeSurf3d = {

	make : function ( element, geometry, layout ) {

		threeSurf3d.update ( element, geometry, layout );

	},

	update : function (element, geometry, layout ) {

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
        	var vScale = geometry.vScale;
        } else {
        	var vScale = layout.vScale;
        }


        var color = ( layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( layout.colourMap );
        color.domain( vScale );

        geometry.faces.forEach(function(face, index) {
        	face.vertexColors[0] = new THREE.Color( color( geometry.faceValues[index][0] ) );
        	face.vertexColors[1] = new THREE.Color( color( geometry.faceValues[index][1] ) );
        	face.vertexColors[2] = new THREE.Color( color( geometry.faceValues[index][2] ) );
        })

		container.select(".plotArea").remove();

        var div = container.append("div")
        	.attr("class", "plotArea")
        	.on( "mouseover", tipOn )
            .on( "mouseout", tipOff );


		var width = container.node().offsetWidth,
			height = layout.height;

		// Compute normals for shading
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
    
		// Use MeshPhongMaterial for a reflective surface
		var material = new THREE.MeshPhongMaterial( {
    		side: THREE.DoubleSide,
    		color: 0xffffff,
    		vertexColors: THREE.VertexColors,
    		specular: 0x0,
    		shininess: 100.,
    		emissive: 0x0
    	});
    
		// Initialise threejs scene
		var scene = new THREE.Scene();

		// Add background colour
		scene.background = new THREE.Color( 0xefefef );
    
		// Add Mesh to scene
		scene.add( new THREE.Mesh( geometry, material ) );
    
		// Create renderer
		var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( width , height );

		// Set target DIV for rendering
		//var container = document.getElementById( elementId );
		div.node().appendChild( renderer.domElement );

		// Define the camera
		var camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 10 );
		camera.position.z = 2; 

		if ( layout.cameraSync ) {

			let plotRowIndex = container.attr("plot-row-index");
			let plotIndex = container.attr("plot-index");

			console.log(plotRowIndex);
			console.log(dbsliceData.session.plotRows[plotRowIndex].plots.length);

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
		var controls = new OrbitControls( camera, renderer.domElement );
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
						console.log(indx);
						plot.layout.watchedCamera.position = camera.position;
						plot.layout.watchedCamera.rotation = camera.rotation;
					}
				});
			}
		} ); 
		controls.enableZoom = true; 

		var ambientLight = new THREE.AmbientLight( 0xaaaaaa );
		scene.add( ambientLight );

		var lights = [];
		lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 3 );
		lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 3 );
		lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 3 );
		lights[ 3 ] = new THREE.PointLight( 0xffffff, 1, 3 );
		lights[ 4 ] = new THREE.PointLight( 0xffffff, 1, 3 );
		lights[ 5 ] = new THREE.PointLight( 0xffffff, 1, 3 );

		lights[ 0 ].position.set( 0, 2, 0 );
		lights[ 1 ].position.set( 1, 2, 1 );
		lights[ 2 ].position.set( - 1, - 2, -1 );
		lights[ 3 ].position.set( 0, 0, 2 );
		lights[ 4 ].position.set( 0, 0, -2 );
		lights[ 5 ].position.set( 0, -2, 0 );

		lights.forEach(function(light){scene.add(light)});

  
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

export { threeSurf3d };