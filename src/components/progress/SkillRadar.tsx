import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';

interface SkillRadarProps {
  skills: Record<string, number>;
  size?: number;
}

const DIMENSIONS = ['Main Idea', 'Detail', 'Inference', 'Vocabulary', 'Critical'];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function SkillRadar({ skills, size = 220 }: SkillRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = DIMENSIONS.length;

  const userPoints = DIMENSIONS.map((d, i) => {
    const score = (skills[d] ?? 0) / 100;
    const angle = (360 / n) * i;
    return polarToXY(angle, score * maxR, cx, cy);
  });

  const bgPoints = DIMENSIONS.map((_, i) => {
    const angle = (360 / n) * i;
    return polarToXY(angle, maxR, cx, cy);
  });

  const toPolygon = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={size} height={size}>
      <Polygon points={toPolygon(bgPoints)} fill="#e0eaff" stroke="#c7d7fe" strokeWidth={1} />
      <Polygon
        points={toPolygon(userPoints)}
        fill="rgba(99,102,241,0.3)"
        stroke="#6366f1"
        strokeWidth={2}
      />
      {bgPoints.map((p, i) => (
        <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#c7d7fe" strokeWidth={1} />
      ))}
      {userPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#6366f1" />
      ))}
      {bgPoints.map((p, i) => {
        const angle = (360 / n) * i;
        const labelPt = polarToXY(angle, maxR + 18, cx, cy);
        return (
          <SvgText
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            fontSize={9}
            fill="#6b7280"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {DIMENSIONS[i]}
          </SvgText>
        );
      })}
    </Svg>
  );
}
