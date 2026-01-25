// Type declaration to fix React 19 / React Native compatibility
// This makes React Native components compatible with React 19's stricter JSX types

import 'react';

declare module 'react' {
  namespace React {
    interface Component<P = {}, S = {}, SS = any> {
      refs?: {
        [key: string]: React.ReactInstance;
      };
    }
  }
}

// Override JSX.ElementClass to be more permissive for React Native components
declare global {
  namespace JSX {
    interface ElementClass {
      // Make the constructor signature more permissive
      new (props: any, deprecatedLegacyContext?: any): any;
    }
  }
  
  // Override React's JSX namespace to allow ReactNode as valid return type
  namespace React {
    namespace JSX {
      // Allow components that return ReactNode | Promise<ReactNode>
      type ElementType = 
        | string
        | React.ComponentType<any>
        | ((props: any) => ReactNode | Promise<ReactNode> | JSX.Element | null);
    }
  }
}
