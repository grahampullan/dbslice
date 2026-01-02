// Shape an array of per-item line responses into the structure LineSeries expects.
// rawData: array of arrays of {x, y}
// itemsOnPlot: itemIds corresponding to each entry
// config: optional { itemLabels: [], cPropertyValues: [], cKeyProperty: string }
function lineSeriesFromLines(rawData, itemsOnPlot = [], config = {}) {
  const series = [];
  rawData.forEach((line, index) => {
    const itemId = itemsOnPlot[index] ?? index;
    const label = config.itemLabels?.[index] ?? itemId;
    const cKey = config.cPropertyValues?.[index];
    const seriesEntry = { label, data: line, itemId };
    if (cKey !== undefined) seriesEntry.cKey = cKey;
    series.push(seriesEntry);
  });
  return { series };
}

export { lineSeriesFromLines };
