// Type declaration for expo-splash-screen to help TypeScript resolve the module
declare module 'expo-splash-screen' {
  export interface SplashScreenOptions {
    fade?: boolean;
  }

  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<void>;
  export function hide(): void;
  export function setOptions(options: SplashScreenOptions): void;
}
