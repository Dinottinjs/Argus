"use client";
import React from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/geo-layers';
import { Map as MapGL } from 'react-map-gl';
import { useArgusStore } from '@/store/useArgusStore';

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 30,
  zoom: 2.0,
  pitch: 45,
  bearing: 0
};

export default function GlobalMap() {
  const { events } = useArgusStore();

  const layers = [
    new ScatterplotLayer({
      id: 'scatter-layer',
      data: events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
      getPosition: (d: any) => d.coordinates,
      getFillColor: (d: any) => d.type === 'CRITICAL' ? [255, 0, 0, 200] : d.type === 'HIGH' ? [255, 165, 0, 180] : [0, 255, 255, 150],
      getRadius: (d: any) => d.type === 'CRITICAL' ? 300000 : d.type === 'HIGH' ? 150000 : 80000,
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      pickable: true
    }),
    new HeatmapLayer({
      id: 'heatmap-layer',
      data: events.filter(e => e.coordinates && e.coordinates.length === 2 && e.coordinates[0] !== 0),
      getPosition: (d: any) => d.coordinates,
      getWeight: (d: any) => d.type === 'CRITICAL' ? 10 : d.type === 'HIGH' ? 5 : 1,
      radiusPixels: 40,
      intensity: 1,
      threshold: 0.1
    })
  ];

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={({object}: any) => object && `${object.title}\nSource: ${object.source}`}
      >
        <MapGL
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
    </div>
  );
}
