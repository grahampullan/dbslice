// Convert per-item CSV responses (parsed via d3.csvParse) into LineSeries data.
// Each CSV is expected to have x/y columns (defaults to the first two columns).
// config: { xProperty, yProperty, itemLabels, cPropertyValues }
function lineSeriesFromCsv(rawData, itemsOnPlot = [], config = {}) {
  const series = [];

  rawData.forEach((rows, index) => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const xKey = config.xProperty || keys[0];
    const yKey = config.yProperty || keys[1] || keys[0];

    const line = rows.map((row) => ({
      x: +row[xKey],
      y: +row[yKey],
    }));

    const itemId = itemsOnPlot[index] ?? index;
    const label = config.itemLabels?.[index] ?? itemId;
    const cKey = config.cPropertyValues?.[index];
    const seriesEntry = { label, data: line, itemId };
    if (cKey !== undefined) seriesEntry.cKey = cKey;
    series.push(seriesEntry);
  });

  return { series };
}

export { lineSeriesFromCsv };
