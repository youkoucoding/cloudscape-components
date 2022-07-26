// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ChartDataTypes, InternalChartSeries, MixedLineBarChartProps } from './interfaces';
import { ChartScale, NumericChartScale } from '../internal/components/cartesian-chart/scales';

export interface ScaledPoint<T> {
  x: number;
  y: number;
  color: string;
  datum?: MixedLineBarChartProps.Datum<T> | undefined;
  series: MixedLineBarChartProps.ChartSeries<T>;
}

/**
 * Combine all line series into an array of scaled data points with the given scales.
 */
export default function makeScaledSeries<T extends ChartDataTypes>(
  series: ReadonlyArray<InternalChartSeries<T>>,
  xScale: ChartScale,
  yScale: NumericChartScale
): readonly ScaledPoint<T>[] {
  const xOffset = xScale.isCategorical() ? Math.max(0, xScale.d3Scale.bandwidth() - 1) / 2 : 0;
  const scaleX = (x: T) => (xScale.d3Scale(x as any) || 0) + xOffset;
  const scaleY = (y: number) => yScale.d3Scale(y) || 0;
  const allX = getAllX(series);

  const scaledSeries = series.reduce((acc, { series, color }) => {
    // Scale and add all line series data points.
    if (series.type === 'line') {
      for (const datum of series.data as MixedLineBarChartProps.Datum<T>[]) {
        acc.push({ x: scaleX(datum.x), y: scaleY(datum.y), datum, series, color });
      }
    }
    // Thresholds don't have X. To make thresholds navigable they are mapped to all defined X values.
    else if (series.type === 'threshold') {
      for (const x of allX) {
        acc.push({ x: scaleX(x), y: scaleY(series.y), datum: { x, y: series.y }, series, color });
      }
      // Support threshold-only setup.
      if (allX.length === 0) {
        acc.push({ x: NaN, y: scaleY(series.y), series, color });
      }
    }
    // X-thresholds only have X. The Y is taken as 0 so that the hoverable point is rendered on the baseline.
    else if (series.type === 'x-threshold') {
      acc.push({ x: scaleX(series.x), y: scaleY(0), datum: { x: series.x, y: 0 }, series, color });
    }
    // Bar series are handled separately.
    else if (series.type === 'bar') {
      // noop
    }
    return acc;
  }, [] as ScaledPoint<T>[]);

  // Sort scaled points by x to ensure their order matches visual order in the chart to support navigation.
  scaledSeries.sort((s1, s2) => s1.x - s2.x);

  return scaledSeries;
}

/**
 * Collect unique x values from all data series.
 */
function getAllX<T>(series: ReadonlyArray<InternalChartSeries<T>>) {
  const addDataXSet = new Set<T>();
  for (const { series: s } of series) {
    switch (s.type) {
      // Add all X values from data series.
      case 'bar':
      case 'line':
        for (const d of s.data) {
          addDataXSet.add(d.x);
        }
        break;
      // X-thresholds have a single X value.
      case 'x-threshold':
        addDataXSet.add(s.x);
        break;
      // Thresholds don't have X values.
      case 'threshold':
        break;
    }
  }
  const allDataX: T[] = [];
  addDataXSet.forEach(x => allDataX.push(x));

  return allDataX;
}
