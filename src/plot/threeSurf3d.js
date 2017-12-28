const threeSurf3d = {

	make : function ( element, geometry, layout ) {

		threeSurf3d.update ( element, geometry, layout );

	},

	update : function (element, geometry, layout ) {

		if (geometry.newData == false) {
            return
        }

        if (layout.vScale === undefined) {
        	var vScale = geometry.vScale;
        } else {
        	var vScale = layout.vScale;
        }

        var color = d3.scaleLinear()
        	.domain( vScale )
        	.interpolate(function() { return d3.interpolateRdBu; });

        geometry.faces.forEach(function(face, index) {
        	face.vertexColors[0] = new THREE.Color( color( geometry.faceValues[index][0] ) );
        	face.vertexColors[1] = new THREE.Color( color( geometry.faceValues[index][1] ) );
        	face.vertexColors[2] = new THREE.Color( color( geometry.faceValues[index][2] ) );
        })

		var container = d3.select(element);

		container.select(".plotArea").remove();

        var div = container.append("div")
        	.attr("class", "plotArea");

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
    		specular: 0x050505,
    		shininess: 100.,
    		emissive: 0x111111
    	});
    
		// Initialise threejs scene
		var scene = new THREE.Scene();
    
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

		// Add controls 
		var controls = new THREE.OrbitControls( camera, renderer.domElement );
		controls.addEventListener( 'change', function(){
    		renderer.render(scene,camera); // re-render if controls move/zoom 
		} ); 
		controls.enableZoom = true; 


		var light = new THREE.PointLight( 0xaaaaaa);
		light.position.set( 2, 0, 0. );
		//scene.add( light );
    
		// Light below
		var light = new THREE.PointLight( 0xaaaaaa);
		light.position.set( -2, 0, 0.);
		//scene.add( light );
		// Light above
		var light = new THREE.PointLight( 0x777777);
		light.position.set( 0, 0, 2. );
		scene.add( light );
    
		// Light below
		var light = new THREE.PointLight( 0x777777);
		light.position.set( 0, 0, -2.);
		scene.add( light );

		// Light above
		var light = new THREE.PointLight( 0x777777);
		light.position.set( 0, -2, 0. );
		scene.add( light );
    
		// Light below
		var light = new THREE.PointLight( 0x777777);
		light.position.set( 0, 2., 0.);
		scene.add( light );

		// Ambient light
		var light = new THREE.AmbientLight( 0x333333 );
		scene.add( light );  
  
		// Make initial call to render scene
		renderer.render( scene, camera );

		geometry.newData = false;

	}

}

export { threeSurf3d };