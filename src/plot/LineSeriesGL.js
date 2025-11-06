import * as d3 from 'd3v7';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Plot } from './Plot.js';

class LineSeriesGL extends Plot {

    constructor(options) {
        if (!options) { options = {} }
        options.layout = options.layout || {};
        options.layout.margin = options.layout.margin || {top:5, right:20, bottom:30, left:53};
        super(options);
        this.componentType = "LineSeriesGL";
        this.lineUuids = [];
        this.stencilRects = [];
        this.cuts = [];
        this.cutLineMeshes = [];
    }

    make() {
        this.updateHeader();
        this.addPlotAreaDiv();
        this.setLasts();

        const container = d3.select(`#${this.id}`);
        const plotArea = d3.select(`#${this.plotAreaId}`);

        if (this.layout.highlightItems) {
            this.filterId = this.layout.filterId;
            const filter = this.sharedStateByAncestorId["context"].filters.find(f => f.id == this.filterId);
            const obsId = filter.highlightItemIds.subscribe(this.highlightItems.bind(this));
            this.subscriptions.push({observable: filter.highlightItemIds, id: obsId});
        }

        if (this.fetchData) {
            if (this.fetchData.urlTemplate) {
                this.filterId = this.fetchData.filterId;
                const filter = this.sharedStateByAncestorId["context"].filters.find(f => f.id == this.filterId);
                const obsId = filter.itemIdsInFilter.subscribe(this.handleFilterChange.bind(this));
                this.subscriptions.push({observable: filter.itemIdsInFilter, id: obsId});
                this.datasetId = this.fetchData.datasetId;
                const dataset = this.sharedStateByAncestorId["context"].datasets.find(d => d.id == this.datasetId);
                if (this.fetchData.getItemIdsFromFilter) {
                    this.fetchData.itemIds = filter.itemIdsInFilter.state.itemIds;
                }
                if (this.fetchData.dataFilterConfig) {
                    const config = this.fetchData.dataFilterConfig;
                    config.itemLabels = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id).label);
                    if (config.cProperty) {
                        config.cPropertyValues = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)[config.cProperty]);
                    }
                }
            }

            if (this.fetchData.derivedDataName) {
                const derivedData = this.sharedStateByAncestorId["context"].derivedData;
                let derivedDataStore = derivedData.find(d => d.name == this.fetchData.derivedDataName);
                if (!derivedDataStore) {
                    this.sharedStateByAncestorId["context"].requestCreateDerivedDataStore.state = {name: this.fetchData.derivedDataName};
                    derivedDataStore = derivedData.find(d => d.name == this.fetchData.derivedDataName);
                }
                const obsId = derivedDataStore.newData.subscribe(this.handleDerivedDataChange.bind(this));
                this.subscriptions.push({observable: derivedDataStore.newData, id: obsId});
            }

            if (this.fetchData.getUrlFromDimensions) {
                const requestCreateDimension = this.sharedStateByAncestorId["context"].requestCreateDimension;
                const dimensions = this.sharedStateByAncestorId["context"].dimensions;
                const dimensionNames = this.fetchData.getUrlFromDimensions.dimensionNames;

                dimensionNames.forEach(dimName => {
                    requestCreateDimension.state = {name: dimName, value: null};
                    const dimension = dimensions.find(d => d.name == dimName);
                    const obsId = dimension.subscribe(this.handleDimensionChange.bind(this));
                    this.subscriptions.push({observable: dimension, id: obsId});
                });
            }
        }

        const overlay = container.append("svg")
            .attr("class", "svg-overlay")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("top", `${this.plotAreaTop}px`)
            .style("left", `${this.plotAreaLeft - this.marginTotal.left}px`)
            .attr("width", `${this.plotAreaWidth + this.marginTotal.left + this.marginTotal.right}`)
            .attr("height", `${this.plotAreaHeight + this.marginTotal.bottom}`);

        container.append("div")
            .attr("class", "tool-tip")
            .style("opacity", 0);

        this.renderer = this.sharedStateByAncestorId["context"].renderer;
        this.update();
    }

    async update() {
        if (this.fetchingData) return;
        await this.getData();

        if (!this.data || this.data.series.length == 0) return;
        if (!this.newData && !this.checkResize) return;

        const container = d3.select(`#${this.id}`);
        const overlay = container.select(".svg-overlay");
        const layout = this.layout;
        const width = this.plotAreaWidth;
        const height = this.plotAreaHeight;
        const margin = layout.margin;
        const timeSync = layout.timeSync;
        const requestWebGLRender = this.sharedStateByAncestorId[this.boardId].requestWebGLRender;

        let highlightItemIds;
        if (layout.highlightItems) {
            const filter = this.sharedStateByAncestorId["context"].filters.find(f => f.id == this.filterId);
            highlightItemIds = filter.highlightItemIds;
        }

        const colour = (layout.colourMap === undefined) ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(layout.colourMap);
        if (layout.cSet !== undefined) {
            if (Array.isArray(layout.cSet)) {
                colour.domain(layout.cSet);
            } else {
                const filter = this.sharedStateByAncestorId["context"].filters.find(f => f.id == this.filterId);
                colour.domain(filter.categoricalUniqueValues[layout.cSet]);
            }
        }

        this.updateHeader();
        this.updatePlotAreaSize();

        overlay
            .attr("width", width + this.marginTotal.left + this.marginTotal.right)
            .attr("height", height + this.marginTotal.bottom);

        const nSeries = this.data.series.length;

        if (timeSync) {
            let timeSlider = container.select(".time-slider");
            if (timeSlider.empty()) {
                container.insert("input", ":first-child")
                    .attr("class", "form-range time-slider")
                    .attr("type", "range")
                    .attr("min", 0)
                    .attr("value", 0)
                    .attr("max", nSeries - 1)
                    .attr("step", 1)
                    .on("input", timeStepSliderChange);

                let handler = {
                    set: function(target, key, valueset) {
                        target[key] = valueset;
                        if (key = 'iStep') {
                            container.select(".time-slider").node().value = valueset;
                            highlightTimeStep(valueset);
                        }
                        return true;
                    }
                };
                let watchedTime = new Proxy({iStep: 0}, handler);
                this.watchedTime = watchedTime;
            }
        }

        this.setRanges();
        this.setScales();

        // Calculate data center and ranges (like TriMesh3D)
        const xMin = this.xRange[0];
        const xMax = this.xRange[1];
        const yMin = this.yRange[0];
        const yMax = this.yRange[1];
        const xMid = (xMin + xMax) / 2;
        const yMid = (yMin + yMax) / 2;
        const xDiff = xMax - xMin;
        const yDiff = yMax - yMin;

        if (!this.scene) {
            this.scene = new THREE.Scene();

            const backgroundGeometry = new THREE.PlaneGeometry(2, 2);
            const backgroundColour = this.layout.backgroundColour || 0xefefef;
            const backgroundMaterial = new THREE.MeshBasicMaterial({
                color: backgroundColour,
                transparent: false,
                opacity: 1.0
            });

            // Test stencil, never modify it
            backgroundMaterial.stencilWrite = true;   // enables the test in three.js
            backgroundMaterial.stencilRef   = 1;
            backgroundMaterial.stencilFunc  = THREE.NotEqualStencilFunc;
            backgroundMaterial.stencilFail  = THREE.KeepStencilOp;
            backgroundMaterial.stencilZFail = THREE.KeepStencilOp;
            backgroundMaterial.stencilZPass = THREE.KeepStencilOp;

            // Background shouldn’t touch depth
            backgroundMaterial.depthWrite = false;
            backgroundMaterial.depthTest  = false;

            const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
            background.material.onBeforeCompile = function(shader) {
                shader.vertexShader = shader.vertexShader.replace(
                    `#include <project_vertex>`,
                    `gl_Position = vec4(position, 1.0);`
                );
            };
            background.frustumCulled = false;
            background.material.needsUpdate = true;
            background.renderOrder = 9;
            this.scene.add(background);
            this.background = background;
        }
        const maxDiff = Math.max(xDiff, yDiff);
        const rMax = Math.sqrt(xDiff**2 + yDiff**2);

        this.xMid = xMid;
        this.yMid = yMid;
        this.rMax = rMax;
        this.xRange = [xMin, xMax];
        this.yRange = [yMin, yMax];

        if (!this.camera) {
            // Use TriMesh3D's symmetric bounds approach for 2D
            this.camera = new THREE.OrthographicCamera(
                -xDiff/2, xDiff/2,     // left, right (X range, symmetric)
                yDiff/2, -yDiff/2,     // top, bottom (Y range, symmetric, flipped)
                0.0001, 1e9
            );
            // Position camera at a reasonable distance relative to data scale
            const cameraZ = Math.max(xDiff, yDiff); // 2x the largest data dimension
            this.camera.position.set(xMid, yMid, cameraZ);
            this.camera.lookAt(xMid, yMid, 0);
            this.camera.up.set(0, 1, 0); // Y-up for 2D plots
        }

        this.lineUuids.forEach(uuid => {
            const oldLine = this.scene.getObjectByProperty('uuid', uuid);
            if (oldLine) {
                oldLine.geometry.dispose();
                oldLine.material.dispose();
                this.scene.remove(oldLine);
            }
        });
        this.lineUuids = [];

        this.data.series.forEach(series => {
            if (!series.data || series.data.length < 2) return;

            const positions = [];
            series.data.forEach(point => {
                const x = point.x;  // Use actual data coordinates
                const y = point.y;  // Use actual data coordinates
                positions.push(x, y, 0);
            });

            const lineGeometry = new LineGeometry();
            lineGeometry.setPositions(positions);

            const lineMaterial = new LineMaterial({
                color: (series.cKey !== undefined) ? colour(series.cKey) : 0x6495ed,
                linewidth: 1,
                resolution: new THREE.Vector2(width, height)
            });
            lineMaterial.stencilWrite = true;
            lineMaterial.stencilRef = 1;
            lineMaterial.stencilFunc = THREE.NotEqualStencilFunc;

            const line = new Line2(lineGeometry, lineMaterial);
            line.computeLineDistances();
            line.renderOrder = 10;
            line.userData = {
                seriesData: series,
                colour: colour
            };

            this.lineUuids.push(line.uuid);
            this.scene.add(line);
        });

        // Build quadtree for efficient point selection
        this.buildQuadtree();

        // Initialize cut lines from layout configuration
        this.initCuts();

        this.addAxes();
        this.addOrbitControls();

        // Add cut lines after controls are set up
        this.addCutLines();

        if (!this.renderObserverId) {
            this.renderObserverId = requestWebGLRender.subscribeWithData({
                observer: this.renderScene.bind(this),
                data: {boxId: this.boxId}
            });
            this.subscriptions.push({observable: requestWebGLRender, id: this.renderObserverId});
        }

        function timeStepSliderChange() {
            let iStep = this.value;
            if (timeSync) {
                let plots = dbsliceData.session.plotRows[plotRowIndex].plots;
                plots.forEach((plot) => {
                    if (plot.watchedTime !== undefined) {
                        plot.watchedTime.iStep = iStep;
                    }
                });
            }
            highlightTimeStep(iStep);
        }

        function highlightTimeStep(iStep) {
            // Implementation for highlighting time step
        }

        if (this.newData) {
            // When new data arrives, recenter camera and controls on the new data
            if (this.camera && this.controls) {
                this.camera.position.x = this.xMid;
                this.camera.position.y = this.yMid;
                this.controls.target.set(this.xMid, this.yMid, 0);
                this.camera.updateProjectionMatrix();
                this.updateCutLines(); // Update cut lines to span new visible range after recentering
            }
            this.webGLUpdate();
        }

        this.webGLUpdate();

        this.newData = false;
    }

    renderScene() {
        if (!this.scene) return;
        const renderer = this.renderer;
        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");

        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
        let plotRect = plotArea.node().getBoundingClientRect();
        let rect = {left: plotRect.left, right: plotRect.right, top: plotRect.top, bottom: plotRect.bottom};

        const ancestorIds = this.ancestorIds.filter(d => (d !== "context" && d.includes("box")));
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
                rect.right = plotGroupRect.right - 2;
            }
            if (rect.top < plotGroupRect.top && rect.bottom > plotGroupRect.top) {
                rect.top = plotGroupRect.top + 2;
            }
            if (rect.bottom > plotGroupRect.bottom && rect.top < plotRect.bottom) {
                rect.bottom = plotGroupRect.bottom - 2;
            }
        }

        // set stencil rectangles
        const overlappingDivsClipSpace = this.getOverlappingBoxesInClipSpace(plotRect);
        this.stencilRects.forEach(uuid => {
            const oldRect = this.scene.getObjectByProperty('uuid', uuid);
            if (oldRect) {
                oldRect.geometry.dispose();
                oldRect.material.dispose();
                this.scene.remove(oldRect);
            }
        });
        this.stencilRects = [];

        overlappingDivsClipSpace.forEach(d => {
            const margin = {left: 0.00, right: 0.02, top: 0.00, bottom: 0.02};
            const rectangleBufferGeometryForMesh = new THREE.BufferGeometry();
            const vertTopLeftClip = new THREE.Vector3(d.left - margin.left, d.top + margin.top, 0.5);
            const vertTopRightClip = new THREE.Vector3(d.right + margin.right, d.top + margin.top, 0.5);
            const vertBottomLeftClip = new THREE.Vector3(d.left - margin.left, d.bottom - margin.bottom, 0.5);
            const vertBottomRightClip = new THREE.Vector3(d.right + margin.right, d.bottom - margin.bottom, 0.5);
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

            this.stencilRects.push(rectangle.uuid);
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

        renderer.setScissorTest(true);
        renderer.setViewport(viewLeft, viewBottom, viewWidth, viewHeight);
        renderer.setScissor(scissorLeft, scissorBottom, scissorWidth, scissorHeight);
        renderer.clear(true, true, true);
        renderer.render(this.scene, this.camera);
        renderer.setScissorTest(false);
    }

    normalizeX(x) {
        return 2 * (x - this.xRange[0]) / (this.xRange[1] - this.xRange[0]) - 1;
    }

    normalizeY(y) {
        return 2 * (y - this.yRange[0]) / (this.yRange[1] - this.yRange[0]) - 1;
    }

    setRanges() {
        let xMin, xMax, yMin, yMax;
        if (!this.layout.segmentedLine) {
            xMin = d3.min(this.data.series, d => d3.min(d.data, d => d.x));
            xMax = d3.max(this.data.series, d => d3.max(d.data, d => d.x));
            yMin = d3.min(this.data.series, d => d3.min(d.data, d => d.y));
            yMax = d3.max(this.data.series, d => d3.max(d.data, d => d.y));
        } else {
            xMin = d3.min(this.data.series, d => d3.min(d.data, d => d[0][0]));
            xMax = d3.max(this.data.series, d => d3.max(d.data, d => d[0][0]));
            yMin = d3.min(this.data.series, d => d3.min(d.data, d => d[0][1]));
            yMax = d3.max(this.data.series, d => d3.max(d.data, d => d[0][1]));
        }

        this.xDataRange = [xMin, xMax];
        this.yDataRange = [yMin, yMax];

        let xDiff = xMax - xMin;
        xMin -= 0.05 * xDiff;
        xMax += 0.05 * xDiff;
        let yDiff = yMax - yMin;
        yMin -= 0.05 * yDiff;
        yMax += 0.05 * yDiff;

        this.xRange = this.layout.xRange || [xMin, xMax];
        this.yRange = this.layout.yRange || [yMin, yMax];
    }

    setScales() {
        if (this.layout.xscale == "time") {
            this.xScale = d3.scaleTime();
            this.xScale0 = d3.scaleTime();
        } else {
            this.xScale = d3.scaleLinear();
            this.xScale0 = d3.scaleLinear();
        }

        this.yScale = d3.scaleLinear();
        this.yScale0 = d3.scaleLinear();

        // For display scales, use the data ranges (not camera bounds)
        this.xScale.domain(this.xRange).range([0, this.plotAreaWidth]);
        this.yScale.domain(this.yRange).range([this.plotAreaHeight, 0]);

        // Keep reference scales for zoom calculations (original data ranges)
        this.xScale0.domain(this.xDataRange).range([0, this.plotAreaWidth]);
        this.yScale0.domain(this.yDataRange).range([this.plotAreaHeight, 0]);
    }

    addAxes() {
        const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
        const layout = this.layout;
        const standOff = 2;

        // Use raycaster to determine current visible range (like TriMesh3D)
        if (!this.raycaster || !this.camera) {
            // Use full range as fallback
            this.xScale.domain(this.xRange).range([0, this.plotAreaWidth]);
            this.yScale.domain(this.yRange).range([this.plotAreaHeight, 0]);
        } else {
            // Get current visible range using raycasting intersecting a plane at z=0 (like TriMesh3D)
            const planeNormal = new THREE.Vector3(0, 0, 1); // Plane normal pointing towards camera
            const plane = new THREE.Plane(planeNormal, 0); // Plane at z=0

            // Bottom-left corner of viewport
            this.pointer.x = -1;
            this.pointer.y = -1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersectBottomLeft = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

            // Top-right corner of viewport
            this.pointer.x = 1;
            this.pointer.y = 1;
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersectTopRight = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

            if (intersectBottomLeft && intersectTopRight) {
                const xRangeVisible = [intersectBottomLeft.x, intersectTopRight.x];
                const yRangeVisible = [intersectBottomLeft.y, intersectTopRight.y];

                // Update scales to match visible range
                this.xScale.domain(xRangeVisible).range([0, this.plotAreaWidth]);
                this.yScale.domain(yRangeVisible).range([this.plotAreaHeight, 0]);
            }
        }

        // Create axes from current scales
        const xScale = this.xScale;
        const yScale = this.yScale;

        const xAxis = d3.axisBottom(xScale);
        if (layout.xTickNumber !== undefined) {
            xAxis.ticks(layout.xTickNumber);
        }
        if (layout.xTickFormat !== undefined) {
            xAxis.tickFormat(d3.format(layout.xTickFormat));
        }

        const yAxis = d3.axisLeft(yScale);
        if (layout.yTickNumber !== undefined) {
            yAxis.ticks(layout.yTickNumber);
        }
        if (layout.yTickFormat !== undefined) {
            yAxis.tickFormat(d3.format(layout.yTickFormat));
        }

        let gX = overlay.select(".axis-x");
        if (gX.empty()) {
            gX = overlay.append("g")
                .attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
                .attr("class", "axis-x")
                .style("pointer-events", "bounding-box")
                .call(xAxis);

            // Make tick elements non-interactive
            gX.selectAll(".tick")
                .style("pointer-events", "none");

            // Specifically target tick text to override default text cursor
            gX.selectAll(".tick text")
                .style("cursor", "default")
                .style("user-select", "none");

            // Set hand cursor for the axis group
            gX.style("cursor", "grab");

            gX
                .call(d3.zoom().on("zoom", (event) => {
                    const transform = event.transform;
                    // Use original data range as reference for zoom (like TriMesh3D)
                    let xDiff = this.xRange[1] - this.xRange[0];

                    // Handle zoom (scale)
                    const scaledRange = xDiff / transform.k;
                    this.camera.left = -scaledRange/2;
                    this.camera.right = scaledRange/2;

                    // Handle pan (translation) - scale by current zoom level
                    const currentCameraRange = this.camera.right - this.camera.left;
                    const panScale = currentCameraRange / this.plotAreaWidth;
                    const panOffset = -transform.x * panScale;
                    this.camera.position.x = this.xMid + panOffset;

                    // Update OrbitControls target
                    this.controls.target.x = this.camera.position.x;

                    this.camera.updateProjectionMatrix();
                    this.updateCutLines(); // Update cut lines to span new visible range
                    this.webGLUpdate();
                    this.addAxes();
                }));
            gX.append("text")
                .attr("class", "x-axis-text")
                .attr("fill", "#000")
                .attr("x", this.plotAreaWidth)
                .attr("y", this.marginTotal.bottom - 5)
                .attr("text-anchor", "end")
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text(layout.xAxisLabel);
        } else {
            gX.attr("transform", `translate(${this.marginTotal.left},${this.plotAreaHeight + standOff})`)
                .call(xAxis);
            gX.select(".x-axis-text").attr("x", this.plotAreaWidth);
        }

        let gY = overlay.select(".axis-y");
        if (gY.empty()) {
            gY = overlay.append("g")
                .attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
                .attr("class", "axis-y")
                .style("pointer-events", "bounding-box")
                .call(yAxis);

            // Make tick elements non-interactive
            gY.selectAll(".tick")
                .style("pointer-events", "none");

            // Specifically target tick text to override default text cursor
            gY.selectAll(".tick text")
                .style("cursor", "default")
                .style("user-select", "none");

            // Set hand cursor for the axis group
            gY.style("cursor", "grab");

            gY
                .call(d3.zoom().on("zoom", (event) => {
                    const transform = event.transform;
                    // Use original data range as reference for zoom (like TriMesh3D)
                    let yDiff = this.yRange[1] - this.yRange[0];

                    // Handle zoom (scale)
                    const scaledRange = yDiff / transform.k;
                    this.camera.top = scaledRange/2;
                    this.camera.bottom = -scaledRange/2;

                    // Handle pan (translation) - scale by current zoom level
                    const currentCameraRange = this.camera.top - this.camera.bottom;
                    const panScale = currentCameraRange / this.plotAreaHeight;
                    const panOffset = transform.y * panScale; // Positive Y is up in world space
                    this.camera.position.y = this.yMid + panOffset;

                    // Update OrbitControls target
                    this.controls.target.y = this.camera.position.y;

                    this.camera.updateProjectionMatrix();
                    this.updateCutLines(); // Update cut lines to span new visible range
                    this.webGLUpdate();
                    this.addAxes();
                }));
            gY.append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -this.marginTotal.left + 15)
                .attr("text-anchor", "end")
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text(layout.yAxisLabel);
        } else {
            gY.attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
                .call(yAxis);
        }
    }


    addOrbitControls() {
        if (this.controls) return;

        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");

        // OrbitControls setup with trackpad/touch support
        this.controls = new OrbitControls(this.camera, plotArea.node());
        this.controls.target.set(this.xMid, this.yMid, 0);
        this.controls.enableRotate = false;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.zoomSpeed = 3.0;


        this.controls.addEventListener('change', () => {
            this.handleOrbitChange();
        });
        this.controls.update();

        // Initialize raycaster for reading camera view bounds (like TriMesh3D)
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // Only stop wheel events to prevent parent div zoom conflicts
        plotArea.node().addEventListener('wheel', (event) => {
            event.stopPropagation();
        }, {passive: false});

        // Add point selection and cut line interaction functionality
        plotArea.node().addEventListener('click', (event) => {
            this.handlePointSelection(event);
        });

        // Add cut line interactions exactly like triMesh3D
        this.cutLineDragging = false;

        const updatePointerPosition = (event) => {
            const rect = plotArea.node().getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            this.pointer.x = (event.clientX - rect.left) / width * 2 - 1;
            this.pointer.y = -((event.clientY - rect.top) / height) * 2 + 1;
        };

        const checkOnCutLine = (event) => {
            updatePointerPosition(event);
            this.raycaster.setFromCamera(this.pointer, this.camera);

            // Get world position for proximity-based detection (wider hit area)
            const planeNormal = new THREE.Vector3(0, 0, 1);
            const plane = new THREE.Plane(planeNormal, 0);
            const worldPos = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

            if (!worldPos) return;

            this.cuts.forEach(cut => {
                // Use proximity-based detection for wider hit area (like getCutLineAtPosition)
                let distance, threshold;
                const xRange = Math.abs(this.camera.right - this.camera.left);
                const yRange = Math.abs(this.camera.top - this.camera.bottom);

                if (cut.type == "x") {
                    // For vertical cut lines, use perpendicular (x-direction) threshold
                    distance = Math.abs(worldPos.x - cut.value);
                    threshold = xRange * 0.05; // 5% of x range for easier hitting
                } else if (cut.type == "y") {
                    // For horizontal cut lines, use perpendicular (y-direction) threshold
                    distance = Math.abs(worldPos.y - cut.value);
                    threshold = yRange * 0.05; // 5% of y range for easier hitting
                }

                if (distance <= threshold) {
                    cut.lineDragging = true;
                    cut.line.material.color.set(0x42d4f5);
                    this.cutLineDragging = true;
                    this.controls.enabled = false;
                    this.webGLUpdate();
                }
            });
        };

        const cutLineDragged = (event) => {
            if (this.cutLineDragging) {
                const cut = this.cuts.find(cut => cut.lineDragging);
                if (!cut) return;

                updatePointerPosition(event.sourceEvent);
                this.raycaster.setFromCamera(this.pointer, this.camera);

                // Intersect with data plane at z=0 (different from triMesh3D's x-plane)
                const planeNormal = new THREE.Vector3(0, 0, 1);
                const plane = new THREE.Plane(planeNormal, 0);
                const planeIntersect = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

                if (planeIntersect) {
                    cut.point = planeIntersect; // Store point like triMesh3D
                    cut.brushing = true;
                    this.setCutValue(cut.dimensionName); // Use triMesh3D's method
                    this.setCutLinePosition(cut.dimensionName);
                    this.webGLUpdate();
                }
            }
        };

        const cutLineDragEnd = () => {
            if (this.cutLineDragging) {
                const cut = this.cuts.find(cut => cut.lineDragging);
                cut.line.material.color.set(0xd0d5db);
                cut.lineDragging = false;
                this.cutLineDragging = false;
                cut.brushing = false;
                this.setCutValue(cut.dimensionName); // Final update like triMesh3D
                this.webGLUpdate(); // Need to render the color change
            }
            this.controls.enabled = true;
        };

        // Use triMesh3D's exact pattern: separate drag and pointerdown handlers
        const cutLineDrag = d3.drag()
            .on("drag", cutLineDragged)
            .on("end", cutLineDragEnd);
        plotArea.call(cutLineDrag);
        plotArea.node().addEventListener("pointerdown", checkOnCutLine, true);
    }

    buildQuadtree() {
        // Create quadtree for efficient point selection
        this.quadtree = d3.quadtree()
            .x(d => d.x)
            .y(d => d.y);

        // Add all points from all series to quadtree
        this.data.series.forEach((series, seriesIndex) => {
            series.data.forEach((point, pointIndex) => {
                this.quadtree.add({
                    x: point.x,
                    y: point.y,
                    seriesIndex: seriesIndex,
                    pointIndex: pointIndex,
                    seriesData: series,
                    pointData: point
                });
            });
        });
    }

    handlePointSelection(event) {
        if (!this.quadtree) return;

        // Get mouse coordinates relative to plot area
        const rect = event.target.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert screen coordinates to normalized device coordinates
        const pointer = new THREE.Vector2();
        pointer.x = (mouseX / rect.width) * 2 - 1;
        pointer.y = -(mouseY / rect.height) * 2 + 1;

        // Use raycaster to get world coordinates
        this.raycaster.setFromCamera(pointer, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectPoint = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

        if (!intersectPoint) return;

        // Find closest point using quadtree
        const closestPoint = this.quadtree.find(intersectPoint.x, intersectPoint.y);

        if (closestPoint) {
            // Calculate distance to ensure it's reasonably close
            const distance = Math.sqrt(
                Math.pow(closestPoint.x - intersectPoint.x, 2) +
                Math.pow(closestPoint.y - intersectPoint.y, 2)
            );

            // Calculate threshold based on both X and Y camera ranges
            const xRange = Math.abs(this.camera.right - this.camera.left);
            const yRange = Math.abs(this.camera.top - this.camera.bottom);
            const threshold = Math.max(xRange, yRange) * 0.02; // 2% of smaller visible range

            if (distance <= threshold) {
                console.log('Selected point:', {
                    coordinates: { x: closestPoint.x, y: closestPoint.y },
                    seriesIndex: closestPoint.seriesIndex,
                    pointIndex: closestPoint.pointIndex,
                    seriesLabel: closestPoint.seriesData.label || `Series ${closestPoint.seriesIndex}`,
                    distance: distance.toFixed(6)
                });
            }
        }
    }

    handleOrbitChange() {
        // Update cut lines to span new visible range after OrbitControls zoom/pan
        this.updateCutLines();
        this.addAxes();
        this.webGLUpdate();
    }

    highlightItems() {
        const filter = this.sharedStateByAncestorId["context"].filters.find(f => f.id == this.filterId);
        const highlightItemIds = filter.highlightItemIds.state.itemIds;
        const colour = (this.layout.colourMap === undefined) ? d3.scaleOrdinal(d3.schemeTableau10) : d3.scaleOrdinal(this.layout.colourMap);

        if (this.layout.cSet !== undefined) {
            if (Array.isArray(this.layout.cSet)) {
                colour.domain(this.layout.cSet);
            } else {
                colour.domain(filter.categoricalUniqueValues[this.layout.cSet]);
            }
        }

        this.scene.children.forEach(object => {
            if (object.userData.seriesData) {
                if (highlightItemIds === undefined || highlightItemIds.length == 0) {
                    object.material.color.set((object.userData.seriesData.cKey !== undefined) ? colour(object.userData.seriesData.cKey) : 0x6495ed);
                    object.material.linewidth = 3;
                } else {
                    object.material.color.set(0xd3d3d3);
                    object.material.linewidth = 3;
                    highlightItemIds.forEach(function(itemId) {
                        if (object.userData.seriesData.itemId == itemId) {
                            object.material.color.set((object.userData.seriesData.cKey !== undefined) ? colour(object.userData.seriesData.cKey) : 0x6495ed);
                            object.material.linewidth = 6;
                        }
                    });
                }
                object.material.needsUpdate = true;
            }
        });
        this.webGLUpdate();
    }

    handleFilterChange(data) {
        if (data.brushing) return;
        if (this.fetchData.getItemIdsFromFilter && !data.noFilter) {
            this.fetchData.itemIds = data.itemIds;
        }
        if (!this.fetchData.getItemIdsFromFilter && data.noFilter) {
            this.fetchData.itemIds = data.itemIds;
        }
        this.fetchDataNow = true;
        if (this.fetchData.dataFilterConfig) {
            const config = this.fetchData.dataFilterConfig;
            const dataset = this.sharedStateByAncestorId["context"].datasets.find(d => d.id == this.datasetId);
            config.itemLabels = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id).label);
            if (config.cProperty) {
                config.cPropertyValues = this.fetchData.itemIds.map(id => dataset.data.find(i => i.itemId == id)[config.cProperty]);
            }
        }
        this.update();
    }

    async handleDerivedDataChange() {
        this.fetchDataNow = true;
        await this.update();
        this.fetchDataNow = true;
        this.update();
    }

    handleDimensionChange() {
        this.fetchDataNow = true;
        this.update();
    }

    initCuts() {
        if (!this.layout.cuts?.length) return;
        const requestCreateDimension = this.sharedStateByAncestorId["context"].requestCreateDimension;
        this.layout.cuts.forEach(cut => {
            if (this.cuts.map(d => d.dimensionName).includes(cut.dimensionName)) {
                return;
            }
            const cutToAdd = this.makeCutObject(cut);
            let avgValue;
            if (cut.type == "x") {
                avgValue = d3.mean(this.xDataRange);
            } else if (cut.type == "y") {
                avgValue = d3.mean(this.yDataRange);
            }
            const dimensionName = cut.dimensionName;
            requestCreateDimension.state = { name: dimensionName, value: avgValue };
            const dimensions = this.sharedStateByAncestorId["context"].dimensions;
            const dimension = dimensions.find(d => d.name == dimensionName);
            const dimValue = dimension.state.value;
            cutToAdd.value = dimValue;
            cutToAdd.dimensionObserverId = dimension.subscribe((data) => {
                const cut = this.cuts.find(d => d.dimensionName == dimensionName);
                cut.value = data.value;
                this.setCutLinePosition(dimensionName);
            });
            this.subscriptions.push({ observable: dimension, id: cutToAdd.dimensionObserverId });
            this.cuts.push(cutToAdd);
        });
    }

    makeCutObject(cut) {
        return {
            dimensionName: cut.dimensionName,
            type: cut.type,
            value: null,
            brushing: false,
            lineAdded: false,
            line: null
        };
    }

    addCutLines() {
        if (!this.cuts.length) return;

        this.cuts.forEach(cut => {
            if (cut.lineAdded) return;
            const dimensionName = cut.dimensionName;

            // Create Three.js line geometry for cut line
            let positions;
            if (cut.type == "x") {
                // Vertical line spanning Y range
                positions = [cut.value, this.yRange[0], 0, cut.value, this.yRange[1], 0];
            } else if (cut.type == "y") {
                // Horizontal line spanning X range
                positions = [this.xRange[0], cut.value, 0, this.xRange[1], cut.value, 0];
            }

            const lineGeometry = new LineGeometry();
            lineGeometry.setPositions(positions);
            //lineGeometry.computeBoundingSphere(); // Essential for raycasting!

            const lineMaterial = new LineMaterial({
                color: cut.brushing ? 0x42d4f5 : 0xd0d5db, // Cyan when dragging, gray otherwise
                linewidth: 3,
                resolution: new THREE.Vector2(this.plotAreaWidth, this.plotAreaHeight)
            });
            lineMaterial.stencilWrite = true;
            lineMaterial.stencilRef = 1;
            lineMaterial.stencilFunc = THREE.NotEqualStencilFunc;
            lineMaterial.depthTest = false; // Like triMesh3D

            const cutLine = new Line2(lineGeometry, lineMaterial);
            cutLine.computeLineDistances();
            cutLine.renderOrder = 15; // Render above data lines but below UI
            cutLine.userData = {
                cutDimensionName: dimensionName,
                isCutLine: true
            };

            cut.line = cutLine;
            cut.lineAdded = true;
            this.cutLineMeshes.push(cutLine.uuid);
            this.scene.add(cutLine);
        });
    }

    setCutValue(dimensionName) {
        const cut = this.cuts.find(d => d.dimensionName == dimensionName);
        if (cut.type == "x") {
            cut.value = cut.point.x; // Extract from intersect point like triMesh3D
        } else if (cut.type == "y") {
            cut.value = cut.point.y;
        }

        // Update dimension state like triMesh3D
        const requestSetDimension = this.sharedStateByAncestorId["context"].requestSetDimension;
        requestSetDimension.state = { name: dimensionName, dimensionState: { value: cut.value, brushing: cut.brushing } };
    }

    setCutLinePosition(dimensionName) {
        const cut = this.cuts.find(d => d.dimensionName == dimensionName);
        if (!cut || !cut.line) return;

        // Get current visible range from camera bounds (updated during zoom/pan)
        const planeNormal = new THREE.Vector3(0, 0, 1);
        const plane = new THREE.Plane(planeNormal, 0);

        // Bottom-left corner of viewport
        this.pointer.x = -1;
        this.pointer.y = -1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectBottomLeft = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

        // Top-right corner of viewport
        this.pointer.x = 1;
        this.pointer.y = 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectTopRight = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());

        if (!intersectBottomLeft || !intersectTopRight) return;

        // Update line geometry positions based on current visible range
        let positions;
        if (cut.type == "x") {
            // Vertical line spanning current visible Y range
            positions = [cut.value, intersectBottomLeft.y, 0, cut.value, intersectTopRight.y, 0];
        } else if (cut.type == "y") {
            // Horizontal line spanning current visible X range
            positions = [intersectBottomLeft.x, cut.value, 0, intersectTopRight.x, cut.value, 0];
        }

        // Update geometry
        cut.line.geometry.setPositions(positions);
        cut.line.computeLineDistances();

        // Update material color based on brushing state
        cut.line.material.color.set(cut.brushing ? 0x42d4f5 : 0xd0d5db);
        cut.line.material.needsUpdate = true;
    }

    updateCutLines() {
        // Update all cut lines to span the new visible range after zoom/pan
        this.cuts.forEach(cut => {
            this.setCutLinePosition(cut.dimensionName);
        });
    }

    getCutLineAtPosition(event) {
        // Use raycaster to check if we hit a cut line
        const intersectPoint = this.getWorldPositionFromEvent(event);
        if (!intersectPoint || !this.cuts.length) return null;

        // Check each cut line for proximity
        for (let cut of this.cuts) {
            if (!cut.line) continue;

            let distance, threshold;
            const xRange = Math.abs(this.camera.right - this.camera.left);
            const yRange = Math.abs(this.camera.top - this.camera.bottom);

            if (cut.type == "x") {
                // For vertical cut lines, use perpendicular (x-direction) threshold
                distance = Math.abs(intersectPoint.x - cut.value);
                threshold = xRange * 0.02; // 2% of x range
            } else if (cut.type == "y") {
                // For horizontal cut lines, use perpendicular (y-direction) threshold
                distance = Math.abs(intersectPoint.y - cut.value);
                threshold = yRange * 0.02; // 2% of y range
            }

            if (distance <= threshold) {
                return { dimensionName: cut.dimensionName };
            }
        }

        return null;
    }

    getWorldPositionFromEvent(event) {
        // Convert mouse event to world coordinates (shared with point selection)
        const rect = event.target.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert screen coordinates to normalized device coordinates
        const pointer = new THREE.Vector2();
        pointer.x = (mouseX / rect.width) * 2 - 1;
        pointer.y = -(mouseY / rect.height) * 2 + 1;

        // Use raycaster to get world coordinates
        this.raycaster.setFromCamera(pointer, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        return this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    }

    remove() {
        this.removeSubscriptions();
        this.lineUuids.forEach(uuid => {
            const oldLine = this.scene.getObjectByProperty('uuid', uuid);
            if (oldLine) {
                oldLine.geometry.dispose();
                oldLine.material.dispose();
                this.scene.remove(oldLine);
            }
        });

        // Clean up cut line meshes
        this.cutLineMeshes.forEach(uuid => {
            const oldCutLine = this.scene.getObjectByProperty('uuid', uuid);
            if (oldCutLine) {
                oldCutLine.geometry.dispose();
                oldCutLine.material.dispose();
                this.scene.remove(oldCutLine);
            }
        });
    }
}

export { LineSeriesGL };