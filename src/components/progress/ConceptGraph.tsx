import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { ConceptMap } from '../../types/app';

interface ConceptGraphProps {
  conceptMap: ConceptMap;
  conceptScores?: Record<string, number>;
  size?: number;
}

const NODE_TYPE_COLORS = {
  main_idea: '#6366f1',
  concept: '#8b5cf6',
  detail: '#a5b4fc',
};

function layoutNodes(nodes: ConceptMap['nodes'], size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 50;

  return nodes.map((node, i) => {
    if (node.type === 'main_idea') return { ...node, x: cx, y: cy };
    const nonMain = nodes.filter((n) => n.type !== 'main_idea');
    const idx = nonMain.findIndex((n) => n.id === node.id);
    const angle = (360 / nonMain.length) * idx - 90;
    const rad = angle * (Math.PI / 180);
    return { ...node, x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  });
}

export function ConceptGraph({ conceptMap, conceptScores = {}, size = 300 }: ConceptGraphProps) {
  const laid = layoutNodes(conceptMap.nodes, size);
  const nodeMap = new Map(laid.map((n) => [n.id, n]));

  return (
    <View>
      <Svg width={size} height={size}>
        {conceptMap.edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          return (
            <Line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#c7d7fe"
              strokeWidth={1.5}
            />
          );
        })}
        {laid.map((node) => {
          const score = conceptScores[node.label];
          const fill = NODE_TYPE_COLORS[node.type];
          const nodeR = node.type === 'main_idea' ? 30 : 20;
          const opacity = score !== undefined ? 0.4 + (score / 100) * 0.6 : 1;
          return (
            <React.Fragment key={node.id}>
              <Circle cx={node.x} cy={node.y} r={nodeR} fill={fill} opacity={opacity} />
              <SvgText
                x={node.x}
                y={node.y + nodeR + 10}
                fontSize={8}
                fill="#374151"
                textAnchor="middle"
              >
                {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
