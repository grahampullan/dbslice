
async function triMeshFromComponents(rawData, config) {

    if ( config.fixedData ) {
        for (const d of config.fixedData) {
            if (!d.data) {
                //console.log('fetching', d.url);
                const response = await fetch(d.url);
                if (d.buffer) {
                    d.data = await response.arrayBuffer();
                }
            }
        }    
    }
    const verticesBuffer = config.fixedData.find(d => d.name == 'vertices').data;
    const indicesBuffer = config.fixedData.find(d => d.name == 'indices').data;
    const valuesBuffer = rawData;

    // concatenate the buffers
    const viewVertices = new Uint8Array(verticesBuffer);
    const viewIndices = new Uint8Array(indicesBuffer);
    const viewValues = new Uint8Array(valuesBuffer);
    const concatenatedBuffer = new ArrayBuffer(viewVertices.byteLength + viewIndices.byteLength + viewValues.byteLength);
    const viewConcatenated = new Uint8Array(concatenatedBuffer);
    viewConcatenated.set(viewVertices, 0);
    viewConcatenated.set(viewIndices, viewVertices.byteLength);
    viewConcatenated.set(viewValues, viewVertices.byteLength + viewIndices.byteLength);
    return concatenatedBuffer;
}

export { triMeshFromComponents }