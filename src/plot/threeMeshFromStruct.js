function threeMeshFromStruct ( data ) {
	var x, y, z, v, n, m;
   
    var xMinAll = d3.min( data.surfaces[0].x );
	var yMinAll = d3.min( data.surfaces[0].y );
	var zMinAll = d3.min( data.surfaces[0].z );
	var vMinAll = d3.min( data.surfaces[0].v );


	var xMaxAll = d3.max( data.surfaces[0].x );
	var yMaxAll = d3.max( data.surfaces[0].y );
	var zMaxAll = d3.max( data.surfaces[0].z );
	var vMaxAll = d3.max( data.surfaces[0].v );

	var nDataSets = data.surfaces.length;

	for (var nds = 1; nds < nDataSets; ++nds ) {
		xMinAll = ( d3.min( data.surfaces[nds].x ) < xMinAll ) ? d3.min( data.surfaces[nds].x ) : xMinAll;
		yMinAll = ( d3.min( data.surfaces[nds].y ) < yMinAll ) ? d3.min( data.surfaces[nds].y ) : yMinAll;
		zMinAll = ( d3.min( data.surfaces[nds].z ) < zMinAll ) ? d3.min( data.surfaces[nds].z ) : zMinAll;
		vMinAll = ( d3.min( data.surfaces[nds].v ) < vMinAll ) ? d3.min( data.surfaces[nds].v ) : vMinAll;
		xMaxAll = ( d3.max( data.surfaces[nds].x ) > xMaxAll ) ? d3.max( data.surfaces[nds].x ) : xMaxAll;
		yMaxAll = ( d3.max( data.surfaces[nds].y ) > yMaxAll ) ? d3.max( data.surfaces[nds].y ) : yMaxAll;
		zMaxAll = ( d3.max( data.surfaces[nds].z ) > zMaxAll ) ? d3.max( data.surfaces[nds].z ) : zMaxAll;
	 	vMaxAll = ( d3.max( data.surfaces[nds].v ) > vMaxAll ) ? d3.max( data.surfaces[nds].v ) : vMaxAll;	
    }

	var xrange = xMaxAll - xMinAll;
	var yrange = yMaxAll - yMinAll;
	var zrange = zMaxAll - zMinAll;

	var xmid = 0.5 * ( xMinAll + xMaxAll );
	var ymid = 0.5 * ( yMinAll + yMaxAll );
	var zmid = 0.5 * ( zMinAll + zMaxAll );

	var scalefac = 1./d3.max( [ xrange, yrange, zrange ] );

	// Use d3 for color scale 
	// vMinAll=0.4;
	// vMaxAll=1.1;
	// var color = d3.scaleLinear()
    //	.domain( [ vMinAll, vMaxAll ] )
    //	.interpolate(function() { return d3.interpolateRdBu; });
    
	// Initialise threejs geometry
	var geometry = new THREE.Geometry();
	geometry.faceValues = []; 
	geometry.vScale = [ vMinAll, vMaxAll ];

	var noffset = 0
	for ( nds = 0; nds < nDataSets; ++nds ) {
		x = data.surfaces[nds].x;
    	y = data.surfaces[nds].y;
    	z = data.surfaces[nds].z;
    	v = data.surfaces[nds].v;
    	m = data.surfaces[nds].size[0];
    	n = data.surfaces[nds].size[1];

    	var nverts = n * m;

    	// Add grid vertices to geometry
		for (var k = 0; k < nverts; ++k) {
    		var newvert= new THREE.Vector3( ( x[k] - xmid) * scalefac, ( y[k] - ymid) * scalefac, (z[k] - zmid) * scalefac);
    		geometry.vertices.push(newvert);
		}

		// Add cell faces (2 traingles per cell) to geometry
		for (var j = 0; j < m-1; j++){
    		for (var i = 0; i < n-1; i++){ 
        		var n0 = j*n + i;
        		var n1 = n0 + 1;
        		var n2 = (j+1)*n + i + 1;
        		var n3 = n2 - 1;
        		var face1 = new THREE.Face3( n0 + noffset, n1 + noffset, n2 + noffset );
        		var face2 = new THREE.Face3( n2 + noffset, n3 + noffset, n0 + noffset );
        		// face1.vertexColors[0] = new THREE.Color( color( v[n0] ) );
        		// face1.vertexColors[1] = new THREE.Color( color( v[n1] ) );
        		// face1.vertexColors[2] = new THREE.Color( color( v[n2] ) );
        		// face2.vertexColors[0] = new THREE.Color( color( v[n2] ) );
        		// face2.vertexColors[1] = new THREE.Color( color( v[n3] ) );
        		// face2.vertexColors[2] = new THREE.Color( color( v[n0] ) );
        		geometry.faces.push( face1 );
        		geometry.faces.push( face2 );
        		var faceValue1 = [];
        		var faceValue2 = [];
        		faceValue1.push( v[n0] );
        		faceValue1.push( v[n1] );
        		faceValue1.push( v[n2] );
        		faceValue2.push( v[n2] );
        		faceValue2.push( v[n3] );
        		faceValue2.push( v[n0] );
        		geometry.faceValues.push( faceValue1 );
        		geometry.faceValues.push( faceValue2 );
    		}
		}
		noffset = noffset + nverts;
	}
    
    return geometry;

}

export { threeMeshFromStruct };