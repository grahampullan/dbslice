import { dbsliceData } from '../core/dbsliceData.js';
import { highlightTasksAllPlots } from '../core/plot.js';
import * as d3 from 'd3';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as THREE from 'three124';
import { OrbitControls } from 'three124/examples/jsm/controls/OrbitControls';

const threeSurf3d = {

	make : function () {

		this.update();

	},

	update : function () {

		const container = d3.select(`#${this.elementId}`);
		const cameraSync = this.layout.cameraSync;
		const highlightTasks = this.layout.highlightTasks;
		const taskId = this.taskId;
		const geometry = this.data;

		if (this.layout.newData == false && dbsliceData.windowResize == false) {
            return
        }

		let vScale;
        if (this.layout.vScale === undefined) {
        	vScale = geometry.vScale;
        } else {
        	vScale = this.layout.vScale;
        }

        const color = ( this.layout.colourMap === undefined ) ? d3.scaleSequential( interpolateSpectral ) : d3.scaleSequential( this.layout.colourMap );
        color.domain( vScale );

        geometry.faces.forEach(function(face, index) {
        	face.vertexColors[0] = new THREE.Color( color( geometry.faceValues[index][0] ) );
        	face.vertexColors[1] = new THREE.Color( color( geometry.faceValues[index][1] ) );
        	face.vertexColors[2] = new THREE.Color( color( geometry.faceValues[index][2] ) );
        })

		container.select(".plot-area").remove();

        const div = container.append("div")
        	.attr("class", "plot-area")
        	.on( "mouseover", tipOn )
            .on( "mouseout", tipOff );


		const width = container.node().offsetWidth,
			height = this.layout.height;

		// Compute normals for shading
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
    
		// Use MeshPhongMaterial for a reflective surface
		const material = new THREE.MeshPhongMaterial( {
    		side: THREE.DoubleSide,
    		color: 0xffffff,
    		vertexColors: THREE.VertexColors,
    		specular: 0x0,
    		shininess: 100.,
    		emissive: 0x0
    	});
    
		// Initialise threejs scene
		const scene = new THREE.Scene();

		// Add background colour
		scene.background = new THREE.Color( 0xefefef );
    
		// Add Mesh to scene
		scene.add( new THREE.Mesh( geometry, material ) );
    
		// Create renderer
		const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true}); 
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( width , height );

		// Set target DIV for rendering
		//var container = document.getElementById( elementId );
		div.node().appendChild( renderer.domElement );

		// Define the camera
		const camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 10 );
		camera.position.z = 2; 

		if ( cameraSync ) {

			this.layout.camera = {position: camera.position, rotation: camera.rotation};

			let validator = {
				set: function(target, key, value) {
					camera[key].copy(value);
					//console.log(camera[key]);
					renderer.render(scene,camera);
					return true;
				}
			};
			const watchedCamera = new Proxy({position: camera.position, rotation: camera.rotation}, validator);
			this.layout.watchedCamera = watchedCamera;

		}


		// Add controls 
		const controls = new OrbitControls( camera, renderer.domElement );
		const plotRowIndex = dbsliceData.session.plotRows.findIndex( e => e._id == this._prid );
		const plotIndex = dbsliceData.session.plotRows[plotRowIndex].plots.findIndex( e => e._id == this._id );
		controls.addEventListener( 'change', function(){
    		renderer.render(scene,camera); // re-render if controls move/zoom 
			if ( cameraSync ) {
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

		const ambientLight = new THREE.AmbientLight( 0xaaaaaa );
		scene.add( ambientLight );

		const lights = [];
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

		lights.forEach(light => scene.add(light));
  
		// Make initial call to render scene
		renderer.render( scene, camera );

		function tipOn() {
            if ( highlightTasks ) {
                container
                    .style("outline-style","solid")
                    .style("outline-color","red")
                    .style("outline-width","4px")
                    .style("outline-offset","-4px")
                    .raise();
                dbsliceData.highlightTasks = [taskId];
				highlightTasksAllPlots();
            }
        }

        function tipOff() {
            if ( highlightTasks ) {
                container.style("outline-width","0px")
                dbsliceData.highlightTasks = [];
                highlightTasksAllPlots();
            }
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
                        .style("outline-offset","4px")
                        .raise();
				}
            });
        }
	}

}

export { threeSurf3d };