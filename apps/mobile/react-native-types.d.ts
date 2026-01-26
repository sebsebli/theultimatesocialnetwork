// Type declaration to fix React 19 / React Native compatibility
// This makes React Native components compatible with React 19's stricter JSX types
// React 19 requires JSX.Element (ReactElement | null) but React Native components return ReactNode (which can include undefined)

import 'react';
import type { ComponentType, ReactElement } from 'react';
import type { PressableProps } from 'react-native';

// Override Pressable to return JSX.Element | null instead of ReactNode
declare module 'react-native' {
  interface PressableComponent extends ComponentType<PressableProps> {
    (props: PressableProps): ReactElement | null;
  }
  export const Pressable: PressableComponent;
}

// Override the global JSX namespace to allow undefined in Element type
declare global {
  namespace JSX {
    interface ElementClass {
      new(props: any, deprecatedLegacyContext?: any): any;
    }

    // Override Element to include undefined for React Native compatibility
    // This allows components returning ReactNode (which may include undefined) to be used as JSX elements
    type Element = React.ReactElement<any, any> | null | undefined;
  }
}

// Also override React.JSX.Element namespace
declare module 'react' {
  namespace React {
    namespace JSX {
      // Override Element to include undefined for React Native compatibility
      type Element = React.ReactElement<any, any> | null | undefined;
    }

    // Override memo to properly type components that return JSX.Element | null
    function memo<P extends object, T extends (props: P) => JSX.Element | null>(
      Component: T
    ): React.NamedExoticComponent<P> & T;
  }
}
