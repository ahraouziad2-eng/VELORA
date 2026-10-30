import React from 'react';

type SvgProps = React.SVGProps<SVGSVGElement> & { width?: number | string; height?: number | string };

export function Svg(props: SvgProps) {
  const { width, height, ...rest } = props;
  return React.createElement('svg', { ...rest, width: width || 24, height: height || 24, xmlns: 'http://www.w3.org/2000/svg' });
}

export function Path(props: any) { return React.createElement('path', props); }
export function Circle(props: any) { return React.createElement('circle', props); }
export function Rect(props: any) { return React.createElement('rect', props); }
export function G(props: any) { return React.createElement('g', props); }
export function Defs(props: any) { return React.createElement('defs', props); }
export function LinearGradient(props: any) { return React.createElement('linearGradient', props); }
export function RadialGradient(props: any) { return React.createElement('radialGradient', props); }
export function Stop(props: any) { return React.createElement('stop', props); }
export function Line(props: any) { return React.createElement('line', props); }
export function Polygon(props: any) { return React.createElement('polygon', props); }
export function Polyline(props: any) { return React.createElement('polyline', props); }
export function Ellipse(props: any) { return React.createElement('ellipse', props); }
export function ClipPath(props: any) { return React.createElement('clipPath', props); }
export function Use(props: any) { return React.createElement('use', props); }
export function Symbol(props: any) { return React.createElement('symbol', props); }
export function Text(props: any) { return React.createElement('text', props); }
export function TSpan(props: any) { return React.createElement('tspan', props); }
export function Mask(props: any) { return React.createElement('mask', props); }
export function Pattern(props: any) { return React.createElement('pattern', props); }
export function Image(props: any) { return React.createElement('image', props); }
export function ForeignObject(props: any) { return React.createElement('foreignObject', props); }

export default Svg;
