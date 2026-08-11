"use client";
import React from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map as MapGL } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useArgusStore } from '@/store/useArgusStore';

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 30,
  zoom: 2.0,
  pitch: 45,
  bearing: 0
};

const CARTO_DARK_MATTER = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function GlobalMap() {
  const { events, binaryPositions, showHeatmap, showScatterplot } = useArgusStore();

  const layers = [];
  
  if (showScatterplot) {
    layers.push(
      new ScatterplotLayer({
        id: 'scatter-layer',
        // If we have binary positions, we use them for ultra-fast GPU rendering
        data: binaryPositions ? { length: binaryPositions.length / 2, attributes: { getPosition: { value: binaryPositions, size: 2 } } } : events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
        getPosition: binaryPositions ? undefined : ((d: any) => d.coordinates),
        getFillColor: binaryPositions ? [255, 50, 50, 200] : ((d: any) => d.type === 'CRITICAL' ? [255, 0, 0, 200] : d.type === 'HIGH' ? [255, 165, 0, 180] : [0, 255, 255, 150]),
        getRadius: binaryPositions ? 150000 : ((d: any) => d.type === 'CRITICAL' ? 300000 : d.type === 'HIGH' ? 150000 : 80000),
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        pickable: !binaryPositions // Disable picking on raw binary layer to save CPU
      })
    );
  }
  
  if (showHeatmap) {
    layers.push(
      new HeatmapLayer({
        id: 'heatmap-layer',
        data: events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
        getPosition: (d: any) => d.coordinates,
        getWeight: (d: any) => d.type === 'CRITICAL' ? 10 : d.type === 'HIGH' ? 5 : 1,
        radiusPixels: 40,
        intensity: 1,
        threshold: 0.1
      })
    );
  }

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={({object}: any) => object && `${object.title}\nSource: ${object.source}`}
      >
        <MapGL
          mapStyle={CARTO_DARK_MATTER as any}
        />
      </DeckGL>
    </div>
  );
}
