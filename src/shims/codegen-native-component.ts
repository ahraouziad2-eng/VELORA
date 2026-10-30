import React from 'react';

export default function codegenNativeComponent(_name: string) {
  return function NativeComponent(props: any) {
    return React.createElement('div', props);
  };
}
