// Type definitions for fabric 5.3.0
declare module 'fabric' {
  export namespace fabric {
    class Canvas {
      constructor(element: HTMLCanvasElement | string, options?: any);
      width: number;
      height: number;
      backgroundColor: string | Gradient | any;
      add(...objects: Object[]): Canvas;
      renderAll(): Canvas;
      setBackgroundColor(color: string | Gradient | any, callback?: () => void): Canvas;
      toDataURL(options?: { format?: string; quality?: number; multiplier?: number }): string;
      dispose(): void;
    }

    class Object {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      fill?: string;
      opacity?: number;
      originX?: string;
      originY?: string;
      shadow?: string;
      scaleX?: number;
      scaleY?: number;
      set(options: any): Object;
      scaleToWidth(width: number): Object;
    }

    class Circle extends Object {
      constructor(options?: {
        left?: number;
        top?: number;
        radius?: number;
        fill?: string;
        opacity?: number;
        originX?: string;
        originY?: string;
        shadow?: string;
      });
    }

    class Rect extends Object {
      constructor(options?: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        fill?: string;
        opacity?: number;
        rx?: number;
        ry?: number;
        originX?: string;
        originY?: string;
        shadow?: string;
      });
    }

    class Text extends Object {
      constructor(text: string, options?: {
        left?: number;
        top?: number;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        fontWeight?: string;
        textAlign?: string;
        originX?: string;
        originY?: string;
        shadow?: string;
        opacity?: number;
      });
    }

    class Image extends Object {
      static fromURL(
        url: string,
        callback: (img: Image | null) => void,
        options?: { crossOrigin?: string }
      ): void;
    }

    class Gradient {
      constructor(options: {
        type: string;
        coords: { x1: number; y1: number; x2: number; y2: number };
        colorStops: Array<{ offset: number; color: string }>;
      });
    }
  }
}
