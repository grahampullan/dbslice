import { Context as bbContext } from 'board-box';
import * as d3 from 'd3v7';
import * as THREE from 'three';

class Context extends bbContext {
    constructor() {
        super();
        const canvas = d3.select("body").append("canvas");
        //const canvas = d3.select("body").insert("canvas", ":first-child");
        canvas
            .attr("id", "dbslice-canvas")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            //.style("z-index", "100")
            .style("pointer-events", "none");
        const renderer = new THREE.WebGLRenderer({canvas: canvas.node(), logarithmicDepthBuffer: true});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
        renderer.setScissorTest( true );
        this.sharedState.renderer = renderer;
    }
}

export { Context };