import * as d3 from 'd3v7';

function makeQuadTree(indices, zp) {
    const tris = [];
    const nt = indices.length/3;
    for (let iTri=0; iTri < nt; iTri++) {
        let ivert0 = indices[iTri*3];
        let ivert1 = indices[iTri*3+1];
        let ivert2 = indices[iTri*3+2];
        const zpTri = [zp[ivert0], zp[ivert1], zp[ivert2]];
        let zpMin = Math.min(...zpTri);
        let zpMax = Math.max(...zpTri);
        tris.push( {zpMin,zpMax,i:iTri} );
    }
    const quadtree = d3.quadtree()
        .x(d => d.zpMin)
        .y(d => d.zpMax)
        .addAll(tris);
    return quadtree;
}

function getCutLine( surface, quadtree, zpCut) {
    const cutTris = findCutTrisLine(quadtree, zpCut);
    const line = getLineFromCutTris(surface, zpCut, cutTris);
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
                if ( triCut ) cutTris.push(triIndx); 
            } while (node = node.next);
        }
        return (x1 > zpCut || y2 < zpCut) ;
    });
    return cutTris;
}

function getLineFromCutTris(surface, zpCut, cutTris) { 
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
          let verts = getVerts(itri, surface);
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

function getVerts(itri, surface) {
    let verts = [];
    for (let i=0; i<3; i++) {
        let ivert = surfaces.indices[itri*3 + i];
        const vert = [ surface.zp[ivert], surface.s[ivert], surface.values[ivert] ];
        verts.push(vert);
    }
    return verts;
}

function cutEdge(verts, edge, zpCut) {
    let i0 = edge[0];
    let i1 = edge[1];
    let zp0 = verts[i0][0];
    let zp1 = verts[i1][0];
    let frac = (zpCut-zp0)/(zp1-zp0);
    let frac1 = 1.-frac;
    let vert = [];
    let nvals = verts[0].length;
    for (let n=0; n<nvals; n++) {
          let cutVal = frac1*verts[i0][n] + frac*verts[i1][n];
          vert.push(cutVal);
    }
    return vert;
}

export { makeQuadTree, getCutLine };