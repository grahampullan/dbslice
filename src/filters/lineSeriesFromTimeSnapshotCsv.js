import * as d3 from "d3v7";

// Convert per-item time-snapshot CSV responses into LineSeries data.
// Each CSV row contains yProperty and multiple timestep columns (keys convertible to numbers).
// config: { yProperty, itemLabels, cPropertyValues }
function lineSeriesFromTimeSnapshotCsv(rawData, itemsOnPlot = [], config = {}) {
  const series = [];

  rawData.forEach((rows, index) => {
    if (!rows || !rows.length) return;
    const yProp = config.yProperty || Object.keys(rows[0]).find((k) => isNaN(+k));
    const stepKeys = Object.keys(rows[0])
      .filter((k) => k !== yProp)
      .sort((a, b) => (+a) - (+b));

    stepKeys.forEach((stepKey) => {
      const line = rows.map((row) => ({
        x: +row[stepKey],
        y: +row[yProp],
      }));
      const itemId = itemsOnPlot[index] ?? index;
      const label = config.itemLabels?.[index] ? `${config.itemLabels[index]} | iStep=${stepKey}` : `iStep=${stepKey}`;
      const cKey = config.cPropertyValues?.[index];
      const seriesEntry = { label, data: line, itemId };
      if (cKey !== undefined) seriesEntry.cKey = cKey;
      series.push(seriesEntry);
    });
  });

  return { series };
}

export { lineSeriesFromTimeSnapshotCsv };
