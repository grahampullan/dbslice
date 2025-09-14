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

            // Make background much larger to ensure visibility
            const bgSize = Math.max(xDiff, yDiff) * 2;
            const backgroundGeometry = new THREE.PlaneGeometry(bgSize, bgSize);
            const backgroundColour = this.layout.backgroundColour || 0xefefef;
            const backgroundMaterial = new THREE.MeshBasicMaterial({color: backgroundColour});
            backgroundMaterial.depthWrite = false;
            // Temporarily disable stencil for debugging
            // backgroundMaterial.stencilWrite = true;
            // backgroundMaterial.stencilRef = 1;
            // backgroundMaterial.stencilFunc = THREE.NotEqualStencilFunc;
            const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
            // Temporarily disable clip space shader to see if background shows
            // background.material.onBeforeCompile = function(shader) {
            //     shader.vertexShader = shader.vertexShader.replace(`#include <project_vertex>`,
            //         `gl_Position = vec4( position , 1.0 );`);
            // }
            background.position.set(xMid, yMid, -1); // Position in world space behind data
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

        // Initialize background to correct size
        this.updateBackground();

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

        this.addAxes();
        //this.addOrbitControls();

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
        renderer.clear(true, true, false);
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

        const xAxis = d3.axisBottom(this.xScale);
        if (layout.xTickNumber !== undefined) {
            xAxis.ticks(layout.xTickNumber);
        }
        if (layout.xTickFormat !== undefined) {
            xAxis.tickFormat(d3.format(layout.xTickFormat));
        }

        const yAxis = d3.axisLeft(this.yScale);
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
                .call(xAxis);
            gX.append("text")
                .attr("class", "x-axis-text")
                .attr("fill", "#000")
                .attr("x", this.plotAreaWidth)
                .attr("y", this.marginTotal.bottom - 5)
                .attr("text-anchor", "end")
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
                .call(yAxis);
            gY.append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", -this.marginTotal.left + 15)
                .attr("text-anchor", "end")
                .text(layout.yAxisLabel);
        } else {
            gY.attr("transform", `translate(${this.marginTotal.left - standOff},0)`)
                .call(yAxis);
        }
    }

    updateAxesFromCamera() {
        // Update scales to match camera bounds
        this.xScale.domain([this.camera.left, this.camera.right]);
        this.yScale.domain([this.camera.bottom, this.camera.top]);

        // Update background to fill camera view
        this.updateBackground();

        // Re-render axes
        const overlay = d3.select(`#${this.id}`).select(".svg-overlay");
        const layout = this.layout;

        const xAxis = d3.axisBottom(this.xScale);
        if (layout.xTickNumber !== undefined) {
            xAxis.ticks(layout.xTickNumber);
        }
        if (layout.xTickFormat !== undefined) {
            xAxis.tickFormat(d3.format(layout.xTickFormat));
        }

        const yAxis = d3.axisLeft(this.yScale);
        if (layout.yTickNumber !== undefined) {
            yAxis.ticks(layout.yTickNumber);
        }
        if (layout.yTickFormat !== undefined) {
            yAxis.tickFormat(d3.format(layout.yTickFormat));
        }

        overlay.select(".axis-x").call(xAxis);
        overlay.select(".axis-y").call(yAxis);
    }

    updateBackground() {
        // Background is fixed to clip space like TriMesh3D - no need to update
        // The shader modification makes it cover the entire view regardless of camera position
    }


    addOrbitControls() {
        if (this.controls) return;

        const container = d3.select(`#${this.id}`);
        const plotArea = container.select(".plot-area");

        // Setup OrbitControls exactly like TriMesh3D
        this.controls = new OrbitControls(this.camera, plotArea.node());
        this.controls.target.set(this.xMid, this.yMid, 0); // Target data center like TriMesh3D
        this.controls.enabled = true;
        this.controls.update();
        this.controls.enableRotate = false; // Disable rotation for 2D
        this.controls.addEventListener('change', () => {
            this.handleOrbitChange();
        });
    }

    handleOrbitChange() {
        // For now, just trigger a WebGL render without updating axes
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
    }
}

export { LineSeriesGL };